/**
 * Totus Massage & Aesthetics — PayFast Instant Transaction Notification (ITN) Webhook
 *
 * Security checks enforced strictly in order:
 * 1. Cryptographic MD5 signature verification (`verifyPayFastItnSignature`, constant-time)
 * 2. Merchant ID ownership verification (`PAYFAST_MERCHANT_ID`)
 * 3. Expected payment amount integrity verification (prevents R1 tampering)
 * 4. Official PayFast server-to-server validation handshake (`/eng/query/validate` === "VALID")
 * 5. Idempotent confirmation (duplicate ITN retries never re-dispatch receipt emails)
 */

import { prisma } from "@/lib/prisma";
import {
  verifyPayFastItnSignature,
  confirmPayFastItnWithGateway,
} from "@/lib/payfast";
import { FIXED_DEPOSIT_AMOUNT } from "@/lib/validation";
import { sendAdminWhatsAppNotification } from "@/lib/whatsapp";
import { sendBookingEmails } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    if (!rawBody || rawBody.length > 16_384) {
      return new Response("Invalid ITN payload", { status: 400 });
    }

    const params = new URLSearchParams(rawBody);
    const data: Record<string, string> = {};
    params.forEach((value, key) => {
      data[key] = value;
    });

    const receivedSignature = data.signature;
    const passphrase = (process.env.PAYFAST_PASSPHRASE || "").trim();
    const expectedMerchantId = (process.env.PAYFAST_MERCHANT_ID || "").trim();

    // 1. Cryptographic signature check (constant-time, exact POST order)
    const isSignatureValid = verifyPayFastItnSignature(
      rawBody,
      receivedSignature,
      passphrase
    );

    const paymentStatus = (data.payment_status || "UNKNOWN").toUpperCase();
    const bookingRef = (data.m_payment_id || "").trim();
    const pfPaymentId = data.pf_payment_id?.trim() || null;
    const receivedMerchantId = (data.merchant_id || "").trim();
    const amountGross = parseFloat(data.amount_gross || "0");
    const amountFee = data.amount_fee ? parseFloat(data.amount_fee) : null;
    const amountNet = data.amount_net ? parseFloat(data.amount_net) : null;

    if (!bookingRef || !/^[A-Z]{2,5}-[A-Z0-9]{4,12}$/.test(bookingRef)) {
      return new Response("Missing or invalid booking reference", { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { referenceCode: bookingRef },
      include: { service: true },
    });

    if (!booking) {
      return new Response("Booking not found", { status: 404 });
    }

    // Audit every ITN attempt (including rejected/tampered attempts)
    await prisma.paymentTransaction.create({
      data: {
        bookingId: booking.id,
        pfPaymentId,
        paymentStatus,
        amountGross: isNaN(amountGross) ? 0 : amountGross,
        amountFee: amountFee !== null && !isNaN(amountFee) ? amountFee : null,
        amountNet: amountNet !== null && !isNaN(amountNet) ? amountNet : null,
        signatureValid: isSignatureValid,
        rawPayload: rawBody.slice(0, 4000),
      },
    });

    // Reject forged or invalid signatures immediately
    if (!isSignatureValid) {
      console.warn(`[PayFast ITN Rejected] Invalid signature for ref ${bookingRef}`);
      return new Response("Invalid signature", { status: 403 });
    }

    // 2. Verify merchant ownership
    if (expectedMerchantId && receivedMerchantId !== expectedMerchantId) {
      console.warn(`[PayFast ITN Rejected] Merchant ID mismatch for ref ${bookingRef}`);
      return new Response("Merchant mismatch", { status: 403 });
    }

    // 3. Verify payment amount integrity (prevents tampered checkout totals)
    const isProduct = booking.service.itemType === "PRODUCT";
    const expectedAmount =
      isProduct || booking.paymentChoice === "FULL_100"
        ? booking.totalAmount
        : Math.min(FIXED_DEPOSIT_AMOUNT, booking.totalAmount);

    if (isNaN(amountGross) || amountGross < expectedAmount - 0.01) {
      console.warn(
        `[PayFast ITN Rejected] Amount mismatch for ref ${bookingRef}: received ${amountGross}, expected ${expectedAmount}`
      );
      return new Response("Amount mismatch", { status: 400 });
    }

    // 4. Official server-to-server PayFast validation handshake
    const isConfirmedByPayFast = await confirmPayFastItnWithGateway(rawBody);
    if (!isConfirmedByPayFast) {
      console.warn(`[PayFast ITN Rejected] Gateway validation failed for ref ${bookingRef}`);
      return new Response("Gateway validation failed", { status: 403 });
    }

    // 5. Idempotency guard: if already confirmed, acknowledge cleanly without re-sending emails
    if (booking.status === "CONFIRMED" || booking.status === "COMPLETED") {
      return new Response("OK", { status: 200 });
    }

    // Only confirm on verified COMPLETE status
    if (paymentStatus === "COMPLETE") {
      const updatedBooking = await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: "CONFIRMED",
          amountPaid: amountGross,
          balanceDue: Math.max(
            0,
            Math.round((booking.totalAmount - amountGross) * 100) / 100
          ),
          payfastPaymentId: pfPaymentId,
        },
        include: { service: true },
      });

      // Dispatch WhatsApp & Dual-Perspective Email Receipts
      await sendAdminWhatsAppNotification({
        referenceCode: updatedBooking.referenceCode,
        patientName: updatedBooking.patientName,
        patientPhone: updatedBooking.patientPhone,
        serviceName: updatedBooking.service.name,
        appointmentDate: updatedBooking.appointmentDate,
        timeSlot: updatedBooking.timeSlot,
        address: updatedBooking.patientAddress,
        paymentType: updatedBooking.paymentChoice,
        amountPaid: updatedBooking.amountPaid,
        balanceDue: updatedBooking.balanceDue,
        medicalNotes: updatedBooking.medicalNotes,
      });

      await sendBookingEmails({
        referenceCode: updatedBooking.referenceCode,
        patientName: updatedBooking.patientName,
        patientEmail: updatedBooking.patientEmail,
        patientPhone: updatedBooking.patientPhone,
        serviceName: updatedBooking.service.name,
        appointmentDate: updatedBooking.appointmentDate,
        timeSlot: updatedBooking.timeSlot,
        address: updatedBooking.patientAddress,
        paymentType: updatedBooking.paymentChoice,
        amountPaid: updatedBooking.amountPaid,
        balanceDue: updatedBooking.balanceDue,
        prepInstructions: updatedBooking.service.prepInstructions,
        medicalNotes: updatedBooking.medicalNotes,
      });
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("[PayFast ITN Handler Error]:", error);
    return new Response("Server error handling ITN", { status: 500 });
  }
}
