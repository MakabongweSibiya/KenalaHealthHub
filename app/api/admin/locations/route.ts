/**
 * Totus Massage & Aesthetics — Studio Locations & Dynamic Daily Operating Hours API
 *
 * Access control:
 * - Public GET returns strictly active locations (`isActive: true`) for Footer & BookingModal
 * - Authenticated Admin GET returns all locations including paused/inactive entries
 * - POST / PATCH / DELETE strictly require verified Admin JWT + Neon DB verification
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { DEFAULT_WEEKLY_HOURS } from "@/lib/schedule";
import {
  sanitizePlainText,
  isValidIsoDate,
  NO_STORE_HEADERS,
} from "@/lib/security";

export async function GET() {
  try {
    const admin = await getAuthenticatedAdmin();
    const locations = await prisma.location.findMany({
      where: admin ? undefined : { isActive: true },
      orderBy: { createdAt: "asc" },
      include: {
        overrides: {
          orderBy: { date: "asc" },
        },
      },
    });
    return NextResponse.json({ locations }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error("Locations fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function POST(req: Request) {
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

    const {
      name,
      type = "STUDIO",
      address,
      isActive = true,
      weeklyHours = DEFAULT_WEEKLY_HOURS,
    } = body;

    const cleanName = sanitizePlainText(name, 100);
    if (cleanName.length < 2) {
      return NextResponse.json(
        { error: "Location name is required." },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const cleanAddress = sanitizePlainText(address, 240);
    if (cleanAddress.length < 3) {
      return NextResponse.json(
        { error: "Physical address or coverage area is required." },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const created = await prisma.location.create({
      data: {
        name: cleanName,
        type: type === "MOBILE" ? "MOBILE" : "STUDIO",
        address: cleanAddress,
        isActive: Boolean(isActive),
        weeklyHours,
      },
      include: { overrides: true },
    });

    return NextResponse.json(
      { success: true, location: created },
      { status: 201, headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error("Location create error:", error);
    return NextResponse.json(
      { error: "Failed to create location" },
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

    const {
      id,
      name,
      type,
      address,
      isActive,
      weeklyHours,
      override,
      deleteOverrideDate,
    } = body;

    if (typeof id !== "string" || !id.trim()) {
      return NextResponse.json(
        { error: "Location ID required" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const cleanId = id.trim();

    // Upsert a specific daily schedule override (e.g., Unavailable today or custom 11:00–16:00)
    if (override && override.date) {
      if (!isValidIsoDate(override.date)) {
        return NextResponse.json(
          { error: "Override date must be in YYYY-MM-DD format." },
          { status: 400, headers: NO_STORE_HEADERS }
        );
      }

      const openTime = override.isOpen
        ? sanitizePlainText(override.openTime, 10) || "09:00"
        : null;
      const closeTime = override.isOpen
        ? sanitizePlainText(override.closeTime, 10) || "17:00"
        : null;
      const cleanNote = sanitizePlainText(override.note, 200) || null;

      await prisma.locationDateOverride.upsert({
        where: {
          locationId_date: {
            locationId: cleanId,
            date: override.date,
          },
        },
        update: {
          isOpen: Boolean(override.isOpen),
          openTime,
          closeTime,
          note: cleanNote,
        },
        create: {
          locationId: cleanId,
          date: override.date,
          isOpen: Boolean(override.isOpen),
          openTime,
          closeTime,
          note: cleanNote,
        },
      });
    }

    // Remove a specific date override
    if (deleteOverrideDate && isValidIsoDate(deleteOverrideDate)) {
      await prisma.locationDateOverride.deleteMany({
        where: {
          locationId: cleanId,
          date: deleteOverrideDate,
        },
      });
    }

    // Update core location fields if provided
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) {
      const cleanName = sanitizePlainText(name, 100);
      if (cleanName.length >= 2) updateData.name = cleanName;
    }
    if (type !== undefined) {
      updateData.type = type === "MOBILE" ? "MOBILE" : "STUDIO";
    }
    if (address !== undefined) {
      const cleanAddress = sanitizePlainText(address, 240);
      if (cleanAddress.length >= 3) updateData.address = cleanAddress;
    }
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (weeklyHours !== undefined) updateData.weeklyHours = weeklyHours;

    if (Object.keys(updateData).length > 0) {
      await prisma.location.update({
        where: { id: cleanId },
        data: updateData,
      });
    }

    const refreshed = await prisma.location.findUnique({
      where: { id: cleanId },
      include: { overrides: { orderBy: { date: "asc" } } },
    });

    return NextResponse.json(
      { success: true, location: refreshed },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error("Location update error:", error);
    return NextResponse.json(
      { error: "Failed to update location" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function DELETE(req: Request) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id")?.trim();

    if (!id) {
      return NextResponse.json(
        { error: "Location ID required" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    await prisma.location.delete({ where: { id } });
    return NextResponse.json({ success: true }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error("Location delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete location" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
