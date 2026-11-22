import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { sendBookingEmails } from "@/lib/email";
import { NO_STORE_HEADERS } from "@/lib/security";

export async function POST() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const result = await sendBookingEmails({
      referenceCode: "TOT-26DEMO",
      patientName: "Lerato Khumalo (Sample Client)",
      patientEmail: admin.email,
      patientPhone: "079 011 8464",
      serviceName: "60-Min Signature Aromatherapy Full Body Massage",
      appointmentDate: "2026-11-24",
      timeSlot: "11:00 - 12:00",
      address: "Totus Massage & Aesthetics Studio, Pretoria East",
      paymentType: "RETAINER_30",
      amountPaid: 200,
      balanceDue: 450,
      prepInstructions:
        "Please arrive 10 minutes prior to your session. Stay hydrated and wear comfortable attire.",
      medicalNotes: "Medium pressure preferred on shoulders and upper back.",
    });

    return NextResponse.json(result, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send test email" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
