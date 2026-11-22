/**
 * Totus Massage & Aesthetics — Public Booking Creation & PayFast Checkout Initializer
 *
 * Security controls:
 * - Distributed Neon-backed IP rate limiting (15 bookings / 15 min) against spam/flooding
 * - Strict server-side price & fixed R200 deposit calculation (never trusts client amounts)
 * - Strict full name, SA phone, email, ISO date, and address validation + sanitization
 * - Cryptographically signed outbound PayFast form payload
 */

import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { generatePayFastSignature, getPayFastUrl } from "@/lib/payfast";
import { validateSouthAfricanPhone } from "@/lib/phone";
import {
  FIXED_DEPOSIT_AMOUNT,
  validateFullName,
  validatePhysicalAddress,
} from "@/lib/validation";
import {
  getClientIp,
  checkPersistentRateLimit,
  recordPersistentRateLimitHit,
  sanitizePlainText,
  isValidIsoDate,
  NO_STORE_HEADERS,
} from "@/lib/security";

const CREATE_MAX_REQUESTS = 15;
const CREATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Generates an unpredictable, human-friendly booking reference (`TOT-26XXXX`)
 * using cryptographically secure random bytes.
 */
function generateRefCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(4);
  let random = "";
  for (let i = 0; i < 4; i++) {
    random += chars.charAt(bytes[i] % chars.length);
  }
  return `TOT-${new Date().getFullYear().toString().slice(-2)}${random}`;
}

export async function POST(req: Request) {
  try {
    // 1. Distributed IP abuse protection
    const clientIp = getClientIp(req);
    const rateKey = `booking-create:${clientIp}`;
    const limit = await checkPersistentRateLimit(
      rateKey,
      CREATE_MAX_REQUESTS,
      CREATE_WINDOW_MS
    );

    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many booking requests from your network. Please wait a few minutes." },
        {
          status: 429,
          headers: {
            ...NO_STORE_HEADERS,
            "Retry-After": String(limit.retryAfterSeconds),
          },
        }
      );
    }

    await recordPersistentRateLimitHit(
      rateKey,
      CREATE_MAX_REQUESTS,
      CREATE_WINDOW_MS,
      CREATE_WINDOW_MS
    );

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request payload." },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const {
      serviceId,
      patientName,
      patientPhone,
      patientEmail,
      patientAddress,
      area = "Pretoria",
      appointmentDate,
      timeSlot,
      paymentChoice = "RETAINER_30",
      medicalNotes,
    } = body;

    // 2. Validate mandatory fields
    if (
      typeof serviceId !== "string" ||
      !serviceId.trim() ||
      typeof patientName !== "string" ||
      typeof patientPhone !== "string" ||
      typeof patientEmail !== "string" ||
      typeof patientAddress !== "string" ||
      typeof appointmentDate !== "string" ||
      typeof timeSlot !== "string"
    ) {
      return NextResponse.json(
        { error: "Please fill in all mandatory appointment fields." },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    if (!isValidIsoDate(appointmentDate)) {
      return NextResponse.json(
        { error: "Please select a valid appointment date." },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const cleanTimeSlot = sanitizePlainText(timeSlot, 40);
    if (cleanTimeSlot.length < 3) {
      return NextResponse.json(
        { error: "Please select a valid time slot." },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    // Strict Full Name validation
    const nameResult = validateFullName(patientName);
    if (!nameResult.isValid) {
      return NextResponse.json(
        {
          error:
            nameResult.error ||
            "Please enter both your first name and surname (e.g. Lerato Khumalo).",
        },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    // Strict Email validation
    const trimmedEmail = patientEmail.toLowerCase().trim().slice(0, 150);
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address (e.g. name@example.co.za)." },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    // Strict South African Phone validation
    const phoneResult = validateSouthAfricanPhone(patientPhone);
    if (!phoneResult.isValid) {
      return NextResponse.json(
        {
          error:
            phoneResult.error ||
            "Please enter a valid South African phone number (e.g. 079 011 8464).",
        },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    // Strict Address validation
    const addressResult = validatePhysicalAddress(patientAddress);
    if (!addressResult.isValid) {
      return NextResponse.json(
        {
          error:
            addressResult.error ||
            "Please provide a valid, verifiable street address or select a studio location.",
        },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    // 3. Authoritative server-side catalog lookup (never trusts client price)
    const service = await prisma.service.findUnique({
      where: { id: serviceId.trim() },
    });

    if (!service || !service.isActive) {
      return NextResponse.json(
        { error: "Selected treatment or product is currently unavailable." },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    const totalAmount = service.price;
    const isProduct = service.itemType === "PRODUCT";
    const normalizedChoice =
      isProduct || paymentChoice === "FULL_100" ? "FULL_100" : "RETAINER_30";

    const amountToPay =
      normalizedChoice === "FULL_100"
        ? totalAmount
        : Math.min(FIXED_DEPOSIT_AMOUNT, totalAmount);
    const balanceDue = Math.max(
      0,
      Math.round((totalAmount - amountToPay) * 100) / 100
    );

    const referenceCode = generateRefCode();
    const cleanArea = sanitizePlainText(area, 80) || "Pretoria";
    const cleanNotes = sanitizePlainText(medicalNotes, 500) || null;

    const booking = await prisma.booking.create({
      data: {
        referenceCode,
        serviceId: service.id,
        patientName: nameResult.formatted,
        patientPhone: phoneResult.formatted,
        patientEmail: trimmedEmail,
        patientAddress: sanitizePlainText(addressResult.formatted, 260),
        area: cleanArea,
        appointmentDate,
        timeSlot: cleanTimeSlot,
        paymentChoice: normalizedChoice,
        totalAmount,
        amountPaid: 0.0,
        balanceDue,
        status: "PENDING_PAYMENT",
        medicalNotes: cleanNotes,
      },
      include: {
        service: true,
      },
    });

    // 4. Prepare cryptographically signed PayFast checkout parameters
    const appUrl = (
      process.env.NEXT_PUBLIC_APP_URL || "https://totusmassages.co.za"
    ).trim();
    const merchantId = (process.env.PAYFAST_MERCHANT_ID || "10000100").trim();
    const merchantKey = (process.env.PAYFAST_MERCHANT_KEY || "46f0cd694581a").trim();
    const passphrase = (process.env.PAYFAST_PASSPHRASE || "").trim();

    const nameParts = nameResult.formatted.split(" ");
    const nameFirst = nameParts[0] || "Valued";
    const nameLast = nameParts.slice(1).join(" ") || "Client";

    const payfastData: Record<string, string> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: `${appUrl}/booking-success?ref=${referenceCode}`,
      cancel_url: `${appUrl}/?cancelled=${referenceCode}`,
      notify_url: `${appUrl}/api/payfast/itn`,
      name_first: nameFirst,
      name_last: nameLast,
      email_address: trimmedEmail,
      m_payment_id: referenceCode,
      amount: amountToPay.toFixed(2),
      item_name: `Totus Massage & Aesthetics - ${service.name} - ${
        normalizedChoice === "FULL_100" ? "Full Fee" : "R200 Deposit"
      }`,
      item_description: `Appointment on ${appointmentDate} at ${cleanTimeSlot} for ${nameResult.formatted}`,
      custom_str1: booking.id,
      custom_str2: normalizedChoice,
    };

    if (phoneResult.payfastCellNumber) {
      payfastData.cell_number = phoneResult.payfastCellNumber;
    }

    payfastData.signature = generatePayFastSignature(payfastData, passphrase);

    return NextResponse.json(
      {
        success: true,
        booking: {
          id: booking.id,
          referenceCode: booking.referenceCode,
          serviceName: service.name,
          appointmentDate: booking.appointmentDate,
          timeSlot: booking.timeSlot,
          amountToPay,
          balanceDue,
          paymentChoice: normalizedChoice,
        },
        payfastUrl: getPayFastUrl(),
        payfastData,
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error("Booking creation error:", error);
    return NextResponse.json(
      { error: "Failed to initialize booking session." },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
