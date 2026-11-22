/**
 * Totus Massage & Aesthetics — Admin Bookings Management API
 *
 * Strictly protected by verified Admin JWT + Neon DB verification.
 * Validates allowed booking statuses and enforces private `no-store` caching headers.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/auth";
import {
  sanitizePlainText,
  isValidIsoDate,
  NO_STORE_HEADERS,
} from "@/lib/security";
import { logAuditEvent } from "@/lib/audit";

const ALLOWED_STATUSES = new Set([
  "PENDING_PAYMENT",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
]);

export async function GET(req: Request) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status")?.trim();
    const query = sanitizePlainText(searchParams.get("q") || "", 80);

    const where: Record<string, unknown> = {};
    if (status && status !== "ALL" && ALLOWED_STATUSES.has(status)) {
      where.status = status;
    }

    if (query) {
      where.OR = [
        { referenceCode: { contains: query, mode: "insensitive" } },
        { patientName: { contains: query, mode: "insensitive" } },
        { patientPhone: { contains: query, mode: "insensitive" } },
        { patientEmail: { contains: query, mode: "insensitive" } },
      ];
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { service: true, payments: true },
    });

    return NextResponse.json({ bookings }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error("Admin bookings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function PATCH(req: Request) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const { id, status, appointmentDate, timeSlot, medicalNotes, balancePaid } =
      body;

    if (typeof id !== "string" || !id.trim()) {
      return NextResponse.json(
        { error: "Booking ID is required" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (status !== undefined) {
      if (typeof status !== "string" || !ALLOWED_STATUSES.has(status)) {
        return NextResponse.json(
          { error: "Invalid booking status" },
          { status: 400, headers: NO_STORE_HEADERS }
        );
      }
      updateData.status = status;
    }
    if (appointmentDate !== undefined) {
      if (!isValidIsoDate(appointmentDate)) {
        return NextResponse.json(
          { error: "Invalid appointment date" },
          { status: 400, headers: NO_STORE_HEADERS }
        );
      }
      updateData.appointmentDate = appointmentDate;
    }
    if (timeSlot !== undefined) {
      const cleanSlot = sanitizePlainText(timeSlot, 40);
      if (cleanSlot) updateData.timeSlot = cleanSlot;
    }
    if (medicalNotes !== undefined) {
      updateData.medicalNotes = sanitizePlainText(medicalNotes, 500) || null;
    }
    if (typeof balancePaid === "boolean") {
      updateData.balancePaid = balancePaid;
      updateData.balancePaidAt = balancePaid ? new Date() : null;
    }

    const updated = await prisma.booking.update({
      where: { id: id.trim() },
      data: updateData,
      include: { service: true, payments: true },
    });

    await logAuditEvent({
      eventType: "BOOKING_UPDATED",
      actor: admin.email,
      req,
      resourceId: updated.referenceCode,
      status: "OK",
      metadata: { status: updated.status, balancePaid: updated.balancePaid },
    });

    return NextResponse.json(
      { success: true, booking: updated },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error("Booking update error:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
