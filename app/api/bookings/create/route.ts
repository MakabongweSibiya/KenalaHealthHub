import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePayFastSignature, getPayFastUrl } from "@/lib/payfast";
import { validateSouthAfricanPhone } from "@/lib/phone";
import {
  FIXED_DEPOSIT_AMOUNT,
  validateFullName,
  validatePhysicalAddress,
} from "@/lib/validation";

function generateRefCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let random = "";
  for (let i = 0; i < 4; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TOT-${new Date().getFullYear().toString().slice(-2)}${random}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
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

    // Validate mandatory fields
    if (
      !serviceId ||
      !patientName ||
      !patientPhone ||
      !patientEmail ||
      !patientAddress ||
      !appointmentDate ||
      !timeSlot
    ) {
      return NextResponse.json(
        { error: "Please fill in all mandatory appointment fields." },
        { status: 400 }
      );
    }

    // Strict Full Name (First Name & Surname) validation
    const nameResult = validateFullName(patientName);
    if (!nameResult.isValid) {
      return NextResponse.json(
        {
          error:
            nameResult.error ||
            "Please enter both your first name and surname (e.g. Lerato Khumalo).",
        },
        { status: 400 }
      );
    }

    // Strict Email validation
    const trimmedEmail = patientEmail.toLowerCase().trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address (e.g. name@example.co.za)." },
        { status: 400 }
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
        { status: 400 }
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
        { status: 400 }
      );
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service || !service.isActive) {
      return NextResponse.json(
        { error: "Selected treatment or product is currently unavailable." },
        { status: 404 }
      );
    }

    const totalAmount = service.price;
    const isProduct = service.itemType === "PRODUCT";

    let amountToPay = 0;
    let balanceDue = 0;

    if (isProduct || paymentChoice === "FULL_100") {
      amountToPay = totalAmount;
      balanceDue = 0.0;
    } else {
      amountToPay = Math.min(FIXED_DEPOSIT_AMOUNT, totalAmount); // Fixed R200 booking deposit across services
      balanceDue = Math.max(0, Math.round((totalAmount - amountToPay) * 100) / 100);
    }

    const referenceCode = generateRefCode();

    const booking = await prisma.booking.create({
      data: {
        referenceCode,
        serviceId: service.id,
        patientName: nameResult.formatted,
        patientPhone: phoneResult.formatted,
        patientEmail: trimmedEmail,
        patientAddress: addressResult.formatted,
        area: area.trim(),
        appointmentDate,
        timeSlot,
        paymentChoice,
        totalAmount,
        amountPaid: 0.0,
        balanceDue,
        status: "PENDING_PAYMENT",
        medicalNotes: medicalNotes?.trim() || null,
      },
      include: {
        service: true,
      },
    });

    // Prepare PayFast parameters
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://totusmassages.co.za";
    const merchantId = process.env.PAYFAST_MERCHANT_ID || "10000100";
    const merchantKey = process.env.PAYFAST_MERCHANT_KEY || "46f0cd694581a";
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
        isProduct || paymentChoice === "FULL_100" ? "Full Fee" : "R200 Deposit"
      }`,
      item_description: `Appointment on ${appointmentDate} at ${timeSlot} for ${nameResult.formatted}`,
      custom_str1: booking.id,
      custom_str2: paymentChoice,
    };

    // PayFast cell_number: strictly digits only without spaces or punctuation
    if (phoneResult.payfastCellNumber) {
      payfastData.cell_number = phoneResult.payfastCellNumber;
    }

    const signature = generatePayFastSignature(payfastData, passphrase);
    payfastData.signature = signature;

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        referenceCode: booking.referenceCode,
        serviceName: service.name,
        appointmentDate: booking.appointmentDate,
        timeSlot: booking.timeSlot,
        amountToPay,
        balanceDue,
        paymentChoice,
      },
      payfastUrl: getPayFastUrl(),
      payfastData,
    });
  } catch (error: any) {
    console.error("Booking creation error:", error);
    return NextResponse.json(
      { error: "Failed to initialize booking session." },
      { status: 500 }
    );
  }
}
