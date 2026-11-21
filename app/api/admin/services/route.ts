import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/auth";

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
    const services = await prisma.service.findMany({
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ services });
  } catch (error: any) {
    console.error("Services fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
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
      itemType = "SERVICE",
      category,
      description,
      price,
      durationMinutes,
      imageUrl,
      prepInstructions,
      isActive = true,
    } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Item name is compulsory (minimum 2 characters)." },
        { status: 400 }
      );
    }

    if (!description || typeof description !== "string" || description.trim().length < 5) {
      return NextResponse.json(
        { error: "Description is compulsory (minimum 5 characters)." },
        { status: 400 }
      );
    }

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      return NextResponse.json(
        { error: "A valid compulsory price greater than R0 is required." },
        { status: 400 }
      );
    }

    const normalizedType = itemType === "PRODUCT" ? "PRODUCT" : "SERVICE";
    const defaultCat = normalizedType === "PRODUCT" ? "Products" : "Massage & Aesthetics";
    const cleanDesc = description.trim();

    const created = await prisma.service.create({
      data: {
        name: name.trim(),
        slug: createSlug(name),
        itemType: normalizedType,
        category: (category && category.trim()) || defaultCat,
        shortDescription: cleanDesc,
        fullDescription: cleanDesc,
        price: numericPrice,
        retainerPercentage: 30.0,
        durationMinutes:
          normalizedType === "PRODUCT"
            ? 0
            : Math.max(15, parseInt(durationMinutes, 10) || 60),
        icon: normalizedType === "PRODUCT" ? "package" : "heart",
        imageUrl: imageUrl && typeof imageUrl === "string" && imageUrl.trim() ? imageUrl.trim() : null,
        prepInstructions:
          prepInstructions && typeof prepInstructions === "string" && prepInstructions.trim()
            ? prepInstructions.trim()
            : null,
        isActive: Boolean(isActive),
      },
    });

    return NextResponse.json({ success: true, service: created }, { status: 201 });
  } catch (error: any) {
    console.error("Service create error:", error);
    return NextResponse.json(
      { error: "Failed to create service or product." },
      { status: 500 }
    );
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
      itemType,
      category,
      description,
      price,
      durationMinutes,
      imageUrl,
      prepInstructions,
      isActive,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Item ID required" }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined && name.trim()) updateData.name = name.trim();
    if (itemType !== undefined) {
      updateData.itemType = itemType === "PRODUCT" ? "PRODUCT" : "SERVICE";
    }
    if (category !== undefined && category.trim()) updateData.category = category.trim();
    if (description !== undefined && description.trim()) {
      updateData.shortDescription = description.trim();
      updateData.fullDescription = description.trim();
    }
    if (price !== undefined) {
      const p = parseFloat(price);
      if (!isNaN(p) && p > 0) updateData.price = p;
    }
    if (durationMinutes !== undefined) {
      updateData.durationMinutes = parseInt(durationMinutes, 10) || 0;
    }
    if (imageUrl !== undefined) {
      updateData.imageUrl =
        imageUrl && typeof imageUrl === "string" && imageUrl.trim() ? imageUrl.trim() : null;
    }
    if (prepInstructions !== undefined) {
      updateData.prepInstructions =
        prepInstructions && typeof prepInstructions === "string" && prepInstructions.trim()
          ? prepInstructions.trim()
          : null;
    }
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await prisma.service.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, service: updated });
  } catch (error: any) {
    console.error("Service update error:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
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
      return NextResponse.json({ error: "Item ID required" }, { status: 400 });
    }

    await prisma.service.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Service delete error:", error);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
