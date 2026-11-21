import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { DEFAULT_WEEKLY_HOURS } from "@/lib/schedule";

export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        overrides: {
          orderBy: { date: "asc" },
        },
      },
    });
    return NextResponse.json({ locations });
  } catch (error: any) {
    console.error("Locations fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch locations" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      name,
      type = "STUDIO",
      address,
      isActive = true,
      weeklyHours = DEFAULT_WEEKLY_HOURS,
    } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Location name is required." },
        { status: 400 }
      );
    }

    if (!address || typeof address !== "string" || address.trim().length < 3) {
      return NextResponse.json(
        { error: "Physical address or coverage area is required." },
        { status: 400 }
      );
    }

    const created = await prisma.location.create({
      data: {
        name: name.trim(),
        type: type === "MOBILE" ? "MOBILE" : "STUDIO",
        address: address.trim(),
        isActive: Boolean(isActive),
        weeklyHours,
      },
      include: { overrides: true },
    });

    return NextResponse.json({ success: true, location: created }, { status: 201 });
  } catch (error: any) {
    console.error("Location create error:", error);
    return NextResponse.json({ error: "Failed to create location" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
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

    if (!id) {
      return NextResponse.json({ error: "Location ID required" }, { status: 400 });
    }

    // Optional: Upsert a specific date override (e.g. closed Tuesday or 11:00 - 16:00)
    if (override && override.date) {
      await prisma.locationDateOverride.upsert({
        where: {
          locationId_date: {
            locationId: id,
            date: override.date,
          },
        },
        update: {
          isOpen: Boolean(override.isOpen),
          openTime: override.isOpen ? override.openTime || "09:00" : null,
          closeTime: override.isOpen ? override.closeTime || "17:00" : null,
          note: override.note?.trim() || null,
        },
        create: {
          locationId: id,
          date: override.date,
          isOpen: Boolean(override.isOpen),
          openTime: override.isOpen ? override.openTime || "09:00" : null,
          closeTime: override.isOpen ? override.closeTime || "17:00" : null,
          note: override.note?.trim() || null,
        },
      });
    }

    // Optional: Remove a specific date override
    if (deleteOverrideDate) {
      await prisma.locationDateOverride.deleteMany({
        where: {
          locationId: id,
          date: deleteOverrideDate,
        },
      });
    }

    // Update core location details if provided
    const updateData: any = {};
    if (name !== undefined && name.trim()) updateData.name = name.trim();
    if (type !== undefined) updateData.type = type === "MOBILE" ? "MOBILE" : "STUDIO";
    if (address !== undefined && address.trim()) updateData.address = address.trim();
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (weeklyHours !== undefined) updateData.weeklyHours = weeklyHours;

    if (Object.keys(updateData).length > 0) {
      await prisma.location.update({
        where: { id },
        data: updateData,
      });
    }

    const refreshed = await prisma.location.findUnique({
      where: { id },
      include: { overrides: { orderBy: { date: "asc" } } },
    });

    return NextResponse.json({ success: true, location: refreshed });
  } catch (error: any) {
    console.error("Location update error:", error);
    return NextResponse.json({ error: "Failed to update location" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Location ID required" }, { status: 400 });
    }

    await prisma.location.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Location delete error:", error);
    return NextResponse.json({ error: "Failed to delete location" }, { status: 500 });
  }
}
