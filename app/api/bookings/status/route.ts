/**
 * Totus Massage & Aesthetics — Safe Read-Only Booking Verification Status Endpoint
 *
 * Used by `/booking-success` to check whether PayFast's server-to-server ITN webhook
 * has verified and confirmed the booking.
 *
 * Security controls:
 * - Strictly read-only (NEVER mutates booking or payment state)
 * - IP rate-limited via Neon PostgreSQL (prevents reference code brute-forcing)
 * - Validates reference format strictly (`TOT-XXXXXX` / legacy `KHH-XXXXXX`)
 * - Masks sensitive PII (never returns raw email or full street address publicly)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getClientIp,
  checkPersistentRateLimit,
  recordPersistentRateLimitHit,
  NO_STORE_HEADERS,
} from "@/lib/security";

const STATUS_MAX_LOOKUPS = 40;
const STATUS_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export async function GET(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const rateKey = `booking-status:${clientIp}`;
    const limit = await checkPersistentRateLimit(
      rateKey,
      STATUS_MAX_LOOKUPS,
      STATUS_WINDOW_MS
    );

    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many verification requests. Please wait a moment." },
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
      STATUS_MAX_LOOKUPS,
      STATUS_WINDOW_MS,
      STATUS_WINDOW_MS
    );

    const { searchParams } = new URL(req.url);
    const ref = (searchParams.get("ref") || "").trim().toUpperCase();

    if (!ref || !/^(TOT|KHH)-[A-Z0-9]{4,10}$/.test(ref)) {
      return NextResponse.json(
        { error: "Invalid booking reference format." },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { referenceCode: ref },
      select: {
        referenceCode: true,
        status: true,
        appointmentDate: true,
        timeSlot: true,
        area: true,
        paymentChoice: true,
        totalAmount: true,
        amountPaid: true,
        balanceDue: true,
        patientName: true,
        service: {
          select: {
            name: true,
            itemType: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking reference not found." },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    // Protect PII: expose only first name on unauthenticated confirmation lookup
    const firstName = booking.patientName.split(" ")[0] || "Valued Client";

    return NextResponse.json(
      {
        booking: {
          referenceCode: booking.referenceCode,
          status: booking.status,
          serviceName: booking.service.name,
          itemType: booking.service.itemType,
          appointmentDate: booking.appointmentDate,
          timeSlot: booking.timeSlot,
          area: booking.area,
          clientFirstName: firstName,
          paymentChoice: booking.paymentChoice,
          totalAmount: booking.totalAmount,
          amountPaid: booking.amountPaid,
          balanceDue: booking.balanceDue,
        },
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error("Booking status lookup error:", error);
    return NextResponse.json(
      { error: "Unable to verify booking status right now." },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
