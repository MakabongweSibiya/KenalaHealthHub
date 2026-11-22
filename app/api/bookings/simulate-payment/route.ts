/**
 * Totus Massage & Aesthetics — Sandbox-Only Payment Simulation Endpoint
 *
 * Security control:
 * Permanently disabled (`403 Forbidden`) whenever live PayFast payments are enabled
 * (`PAYFAST_SANDBOX !== "true"`), preventing unauthenticated booking confirmation bypasses.
 * Even in sandbox mode, requires an authenticated admin session.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { FIXED_DEPOSIT_AMOUNT } from "@/lib/validation";
import { NO_STORE_HEADERS } from "@/lib/security";
import { logAuditEvent } from "@/lib/audit";
import { sendAdminWhatsAppNotification } from "@/lib/whatsapp";
import { sendBookingEmails } from "@/lib/email";

export async function POST(req: Request) {
  // Hard production block: never allow simulated payment confirmation outside sandbox mode
  if (process.env.PAYFAST_SANDBOX !== "true") {
    await logAuditEvent({
      eventType: "PAYMENT_BYPASS_BLOCKED",
      actor: "public",
      req,
      status: "BLOCKED",
      metadata: { endpoint: "/api/bookings/simulate-payment" },
    });
    return NextResponse.json(
      { error: "Simulated confirmation is disabled in live payment mode." },
      { status: 403, headers: NO_STORE_HEADERS }
    );
  }

  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const body = await req.json().catch(() => null);
    const referenceCode = typeof body?.referenceCode === "string" ? body.referenceCode.trim() : "";

    if (!referenceCode) {
      return NextResponse.json(
        { error: "Reference code required" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { referenceCode },
      include: { service: true },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    const isProduct = booking.service.itemType === "PRODUCT";
    const paidAmount =
      isProduct || booking.paymentChoice === "FULL_100"
        ? booking.totalAmount
        : Math.min(FIXED_DEPOSIT_AMOUNT, booking.totalAmount);
    const balance = Math.max(0, Math.round((booking.totalAmount - paidAmount) * 100) / 100);

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "CONFIRMED",
        amountPaid: paidAmount,
        balanceDue: balance,
        payfastPaymentId: `SANDBOX-${Date.now()}`,
      },
      include: { service: true },
    });

    await prisma.paymentTransaction.create({
      data: {
        bookingId: booking.id,
        pfPaymentId: updated.payfastPaymentId,
        paymentStatus: "COMPLETE",
        amountGross: paidAmount,
        signatureValid: true,
        rawPayload: "SIMULATED_SANDBOX_CONFIRMATION",
      },
    });

    await sendAdminWhatsAppNotification({
      referenceCode: updated.referenceCode,
      patientName: updated.patientName,
      patientPhone: updated.patientPhone,
      serviceName: updated.service.name,
      appointmentDate: updated.appointmentDate,
      timeSlot: updated.timeSlot,
      address: updated.patientAddress,
      paymentType: updated.paymentChoice,
      amountPaid: updated.amountPaid,
      balanceDue: updated.balanceDue,
      medicalNotes: updated.medicalNotes,
    });

    await sendBookingEmails({
      referenceCode: updated.referenceCode,
      patientName: updated.patientName,
      patientEmail: updated.patientEmail,
      patientPhone: updated.patientPhone,
      serviceName: updated.service.name,
      appointmentDate: updated.appointmentDate,
      timeSlot: updated.timeSlot,
      address: updated.patientAddress,
      paymentType: updated.paymentChoice,
      amountPaid: updated.amountPaid,
      balanceDue: updated.balanceDue,
      prepInstructions: updated.service.prepInstructions,
      medicalNotes: updated.medicalNotes,
    });

    return NextResponse.json(
      { success: true, booking: updated },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error("Simulation error:", error);
    return NextResponse.json(
      { error: "Failed to simulate confirmation" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
