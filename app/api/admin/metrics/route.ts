import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [
      totalBookings,
      confirmedBookings,
      pendingBookings,
      completedBookings,
      activeBookings,
      recentBookings,
    ] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({ where: { status: "CONFIRMED" } }),
      prisma.booking.count({ where: { status: "PENDING_PAYMENT" } }),
      prisma.booking.count({ where: { status: "COMPLETED" } }),
      prisma.booking.findMany({
        where: { status: { in: ["CONFIRMED", "COMPLETED"] } },
        select: {
          totalAmount: true,
          amountPaid: true,
          balanceDue: true,
          balancePaid: true,
        },
      }),
      prisma.booking.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        include: { service: true },
      }),
    ]);

    let totalRetainersCollected = 0;
    let totalBalancesCollected = 0;
    let totalPendingBalance = 0;

    for (const b of activeBookings) {
      totalRetainersCollected += b.amountPaid || 0;
      if (b.balanceDue > 0) {
        if (b.balancePaid) {
          totalBalancesCollected += b.balanceDue;
        } else {
          totalPendingBalance += b.balanceDue;
        }
      }
    }

    return NextResponse.json({
      metrics: {
        totalBookings,
        confirmedBookings,
        pendingBookings,
        completedBookings,
        totalRevenueCollected: totalRetainersCollected + totalBalancesCollected,
        totalRetainersCollected,
        totalBalancesCollected,
        totalPendingBalance,
      },
      recentBookings,
    });
  } catch (error: any) {
    console.error("Metrics API error:", error);
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 });
  }
}
