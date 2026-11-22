/**
 * Totus Massage & Aesthetics — Services & Products Management API
 *
 * Access control:
 * - Public GET returns strictly active catalog items (`isActive: true`)
 * - Authenticated Admin GET returns full catalog including hidden drafts
 * - POST / PATCH / DELETE strictly require verified Admin JWT + Neon DB verification
 * - All user inputs and image URLs are strictly sanitized & validated
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/auth";
import {
  sanitizePlainText,
  validateSafeImageUrl,
  NO_STORE_HEADERS,
} from "@/lib/security";
import { logAuditEvent } from "@/lib/audit";

function createSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base || "item"}-${suffix}`;
}

export async function GET() {
  try {
    const admin = await getAuthenticatedAdmin();
    const services = await prisma.service.findMany({
      where: admin ? undefined : { isActive: true },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ services }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error("Services fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
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
      itemType = "SERVICE",
      category,
      description,
      price,
      durationMinutes,
      imageUrl,
      prepInstructions,
      isActive = true,
    } = body;

    const cleanName = sanitizePlainText(name, 120);
    if (cleanName.length < 2) {
      return NextResponse.json(
        { error: "Item name is compulsory (minimum 2 characters)." },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const cleanDesc = sanitizePlainText(description, 2000);
    if (cleanDesc.length < 5) {
      return NextResponse.json(
        { error: "Description is compulsory (minimum 5 characters)." },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const numericPrice = parseFloat(String(price));
    if (isNaN(numericPrice) || numericPrice <= 0 || numericPrice > 250_000) {
      return NextResponse.json(
        { error: "A valid compulsory price greater than R0 is required." },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const imgCheck = validateSafeImageUrl(imageUrl);
    if (!imgCheck.valid) {
      return NextResponse.json(
        { error: imgCheck.error },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const normalizedType = itemType === "PRODUCT" ? "PRODUCT" : "SERVICE";
    const defaultCat = normalizedType === "PRODUCT" ? "Products" : "Massage & Aesthetics";
    const cleanCategory = sanitizePlainText(category, 80) || defaultCat;
    const cleanPrep = sanitizePlainText(prepInstructions, 600) || null;

    const created = await prisma.service.create({
      data: {
        name: cleanName,
        slug: createSlug(cleanName),
        itemType: normalizedType,
        category: cleanCategory,
        shortDescription: cleanDesc,
        fullDescription: cleanDesc,
        price: Math.round(numericPrice * 100) / 100,
        durationMinutes:
          normalizedType === "PRODUCT"
            ? 0
            : Math.min(480, Math.max(15, parseInt(String(durationMinutes), 10) || 60)),
        icon: normalizedType === "PRODUCT" ? "package" : "heart",
        imageUrl: imgCheck.value,
        prepInstructions: cleanPrep,
        isActive: Boolean(isActive),
      },
    });

    await logAuditEvent({
      eventType: "SERVICE_CREATED",
      actor: admin.email,
      req,
      resourceId: created.id,
      status: "OK",
      metadata: { name: created.name, itemType: created.itemType, price: created.price },
    });

    return NextResponse.json(
      { success: true, service: created },
      { status: 201, headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error("Service create error:", error);
    return NextResponse.json(
      { error: "Failed to create service or product." },
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
      itemType,
      category,
      description,
      price,
      durationMinutes,
      imageUrl,
      prepInstructions,
      isActive,
    } = body;

    if (typeof id !== "string" || !id.trim()) {
      return NextResponse.json(
        { error: "Item ID required" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) {
      const cleanName = sanitizePlainText(name, 120);
      if (cleanName.length >= 2) updateData.name = cleanName;
    }
    if (itemType !== undefined) {
      updateData.itemType = itemType === "PRODUCT" ? "PRODUCT" : "SERVICE";
    }
    if (category !== undefined) {
      const cleanCat = sanitizePlainText(category, 80);
      if (cleanCat) updateData.category = cleanCat;
    }
    if (description !== undefined) {
      const cleanDesc = sanitizePlainText(description, 2000);
      if (cleanDesc.length >= 5) {
        updateData.shortDescription = cleanDesc;
        updateData.fullDescription = cleanDesc;
      }
    }
    if (price !== undefined) {
      const p = parseFloat(String(price));
      if (!isNaN(p) && p > 0 && p <= 250_000) {
        updateData.price = Math.round(p * 100) / 100;
      }
    }
    if (durationMinutes !== undefined) {
      const dur = parseInt(String(durationMinutes), 10);
      if (!isNaN(dur) && dur >= 0 && dur <= 480) {
        updateData.durationMinutes = dur;
      }
    }
    if (imageUrl !== undefined) {
      const imgCheck = validateSafeImageUrl(imageUrl);
      if (!imgCheck.valid) {
        return NextResponse.json(
          { error: imgCheck.error },
          { status: 400, headers: NO_STORE_HEADERS }
        );
      }
      updateData.imageUrl = imgCheck.value;
    }
    if (prepInstructions !== undefined) {
      updateData.prepInstructions = sanitizePlainText(prepInstructions, 600) || null;
    }
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await prisma.service.update({
      where: { id: id.trim() },
      data: updateData,
    });

    await logAuditEvent({
      eventType: "SERVICE_UPDATED",
      actor: admin.email,
      req,
      resourceId: updated.id,
      status: "OK",
      metadata: { name: updated.name, isActive: updated.isActive, price: updated.price },
    });

    return NextResponse.json(
      { success: true, service: updated },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error("Service update error:", error);
    return NextResponse.json(
      { error: "Failed to update item" },
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
        { error: "Item ID required" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    await prisma.service.delete({ where: { id } });
    await logAuditEvent({
      eventType: "SERVICE_DELETED",
      actor: admin.email,
      req,
      resourceId: id,
      status: "OK",
    });
    return NextResponse.json({ success: true }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error("Service delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
