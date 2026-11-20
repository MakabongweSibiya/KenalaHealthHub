import { Resend } from "resend";
import { getGoogleMapsUrl } from "@/lib/validation";

export interface EmailBookingPayload {
  referenceCode: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  serviceName: string;
  appointmentDate: string;
  timeSlot: string;
  address: string;
  paymentType: string;
  amountPaid: number;
  balanceDue: number;
  prepInstructions?: string | null;
  medicalNotes?: string | null;
}

export interface EmailDispatchResult {
  success: boolean;
  mock?: boolean;
  senderUsed?: string;
  usedFallbackSender?: boolean;
  clientEmail?: { sent: boolean; id?: string; error?: string };
  adminEmail?: { sent: boolean; id?: string; error?: string };
  error?: string;
}

const FALLBACK_FROM_EMAIL = "Totus Massage & Aesthetics <onboarding@resend.dev>";

async function sendWithFallback(
  resend: Resend,
  primaryFrom: string,
  payload: {
    to: string;
    replyTo?: string;
    subject: string;
    html: string;
  }
): Promise<{
  sent: boolean;
  id?: string;
  senderUsed: string;
  usedFallback: boolean;
  error?: string;
}> {
  const firstAttempt = await resend.emails.send({
    from: primaryFrom,
    to: payload.to,
    replyTo: payload.replyTo,
    subject: payload.subject,
    html: payload.html,
  });

  if (!firstAttempt.error && firstAttempt.data?.id) {
    return {
      sent: true,
      id: firstAttempt.data.id,
      senderUsed: primaryFrom,
      usedFallback: false,
    };
  }

  const errMsg = firstAttempt.error?.message || "Unknown Resend error";
  const isDomainUnverified =
    errMsg.toLowerCase().includes("domain") ||
    errMsg.toLowerCase().includes("not verified") ||
    errMsg.toLowerCase().includes("testing emails");

  // If custom domain is not yet verified in Resend, automatically retry with onboarding@resend.dev
  if (isDomainUnverified && primaryFrom !== FALLBACK_FROM_EMAIL) {
    const fallbackAttempt = await resend.emails.send({
      from: FALLBACK_FROM_EMAIL,
      to: payload.to,
      replyTo: payload.replyTo,
      subject: payload.subject,
      html: payload.html,
    });

    if (!fallbackAttempt.error && fallbackAttempt.data?.id) {
      return {
        sent: true,
        id: fallbackAttempt.data.id,
        senderUsed: FALLBACK_FROM_EMAIL,
        usedFallback: true,
      };
    }

    return {
      sent: false,
      senderUsed: FALLBACK_FROM_EMAIL,
      usedFallback: true,
      error: fallbackAttempt.error?.message || errMsg,
    };
  }

  return {
    sent: false,
    senderUsed: primaryFrom,
    usedFallback: false,
    error: errMsg,
  };
}

export async function sendBookingEmails(
  data: EmailBookingPayload
): Promise<EmailDispatchResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const primaryFrom =
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "Totus Massage & Aesthetics <noreply@kenalahealthhub.co.za>";
  const adminEmail =
    process.env.ADMIN_NOTIFICATION_EMAIL?.trim() || "totusmassages@gmail.com";
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://kenalahealthhub.co.za";

  const mapsUrl = getGoogleMapsUrl(data.address);
  const totalFee = data.amountPaid + data.balanceDue;
  const cleanWhatsappPhone = data.patientPhone
    .replace(/\D/g, "")
    .replace(/^0/, "27");

  // 1. CLIENT-PERSPECTIVE EMAIL (Official Receipt & Booking Confirmation for Customer)
  const clientHtml = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #f3d6e0; border-radius: 16px; overflow: hidden;">
      <div style="background: #111111; padding: 30px 24px; text-align: center; border-bottom: 4px solid #E86689;">
        <h1 style="color: #00A3AD; margin: 0; font-size: 26px; letter-spacing: 4px; font-weight: 900;">
          TOTUS
        </h1>
        <p style="color: #ffffff; margin: 6px 0 0 0; font-size: 11px; letter-spacing: 3px; font-weight: bold;">
          — MASSAGE <span style="color: #E86689;">&amp;</span> AESTHETICS —
        </p>
      </div>
      
      <div style="padding: 32px 24px;">
        <div style="background: #FDF2F5; border-left: 4px solid #E86689; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
          <h2 style="color: #135061; margin: 0 0 6px 0; font-size: 18px;">Official Booking Receipt &amp; Confirmation</h2>
          <p style="color: #475569; margin: 0; font-size: 14px; line-height: 1.5;">
            Dear <strong>${data.patientName}</strong>, thank you for choosing <strong>Totus Massage &amp; Aesthetics</strong>. Your payment has been verified and your session is officially reserved.
          </p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
          <tr>
            <td style="padding: 11px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Receipt / Booking Ref:</td>
            <td style="padding: 11px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #135061; text-align: right; font-family: monospace; font-size: 15px;">${data.referenceCode}</td>
          </tr>
          <tr>
            <td style="padding: 11px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Reserved Treatment:</td>
            <td style="padding: 11px 0; border-bottom: 1px solid #f1f5f9; font-weight: 700; color: #0f172a; text-align: right;">${data.serviceName}</td>
          </tr>
          <tr>
            <td style="padding: 11px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Date &amp; Time Slot:</td>
            <td style="padding: 11px 0; border-bottom: 1px solid #f1f5f9; font-weight: 700; color: #0f172a; text-align: right;">${data.appointmentDate} at ${data.timeSlot}</td>
          </tr>
          <tr>
            <td style="padding: 11px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Session Location:</td>
            <td style="padding: 11px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #0f172a; text-align: right;">
              ${data.address}<br/>
              <a href="${mapsUrl}" style="color: #007C89; font-size: 12px; text-decoration: underline;">Open Location in Google Maps ↗</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 11px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Total Treatment Fee:</td>
            <td style="padding: 11px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #0f172a; text-align: right;">R${totalFee.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 11px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Amount Paid (PayFast):</td>
            <td style="padding: 11px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #16a34a; text-align: right;">
              R${data.amountPaid.toFixed(2)} (${
    data.paymentType === "FULL_100" ? "100% Full Settlement" : "R200 Booking Deposit"
  })
            </td>
          </tr>
          <tr>
            <td style="padding: 11px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Remaining Balance at Visit:</td>
            <td style="padding: 11px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: ${
              data.balanceDue > 0 ? "#D4426E" : "#16a34a"
            }; text-align: right;">
              R${data.balanceDue.toFixed(2)}
            </td>
          </tr>
        </table>

        ${
          data.prepInstructions
            ? `<div style="background: #F0F9FA; border: 1px solid #B2E2E6; padding: 14px; border-radius: 10px; margin-bottom: 24px;">
                <strong style="color: #135061; font-size: 13px; display: block; margin-bottom: 4px;">Session Preparation Notes:</strong>
                <span style="color: #334155; font-size: 13px; line-height: 1.5;">${data.prepInstructions}</span>
              </div>`
            : ""
        }

        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 13px; color: #64748b;">
          <p style="margin: 0 0 6px 0;"><strong>Totus Concierge (Call &amp; WhatsApp):</strong> 079 011 8464</p>
          <p style="margin: 0;"><strong>Email Inquiries:</strong> totusmassages@gmail.com</p>
        </div>
      </div>
      
      <div style="background: #FAF9F6; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
        Serenity, Beauty &amp; Pure Rejuvenation • Totus Massage &amp; Aesthetics © ${new Date().getFullYear()}
      </div>
    </div>
  `;

  // 2. ADMIN/OWNER-PERSPECTIVE EMAIL (Sent to totusmassages@gmail.com)
  const adminHtml = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 16px; overflow: hidden;">
      <div style="background: #135061; padding: 24px; text-align: center; border-bottom: 4px solid #E86689;">
        <span style="background: #E86689; color: #ffffff; font-size: 10px; font-weight: bold; padding: 4px 10px; border-radius: 99px; letter-spacing: 1px; text-transform: uppercase;">
          Owner / Admin Notification
        </span>
        <h1 style="color: #ffffff; margin: 10px 0 0 0; font-size: 22px; font-weight: 800;">
          New Paid Booking Received
        </h1>
        <p style="color: #B2E2E6; margin: 4px 0 0 0; font-size: 12px;">
          Reference: <strong>${data.referenceCode}</strong> • PayFast Verified
        </p>
      </div>

      <div style="padding: 28px 24px;">
        <h3 style="color: #135061; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0; border-bottom: 2px solid #f1f5f9; padding-bottom: 6px;">
          1. Client Details &amp; Quick Contact
        </h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 22px; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Client Full Name:</td>
            <td style="padding: 8px 0; font-weight: bold; color: #0f172a; text-align: right;">${data.patientName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">WhatsApp / Phone:</td>
            <td style="padding: 8px 0; font-weight: bold; text-align: right;">
              <a href="https://wa.me/${cleanWhatsappPhone}" style="color: #16a34a; text-decoration: underline;">${data.patientPhone} (Chat on WhatsApp ↗)</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Client Email:</td>
            <td style="padding: 8px 0; font-weight: 600; color: #0f172a; text-align: right;">
              <a href="mailto:${data.patientEmail}" style="color: #007C89;">${data.patientEmail}</a>
            </td>
          </tr>
        </table>

        <h3 style="color: #135061; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0; border-bottom: 2px solid #f1f5f9; padding-bottom: 6px;">
          2. Treatment, Schedule &amp; Location
        </h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 22px; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Treatment Booked:</td>
            <td style="padding: 8px 0; font-weight: bold; color: #D4426E; text-align: right;">${data.serviceName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Date &amp; Time Slot:</td>
            <td style="padding: 8px 0; font-weight: bold; color: #0f172a; text-align: right;">${data.appointmentDate} (${data.timeSlot})</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Location / Address:</td>
            <td style="padding: 8px 0; font-weight: 600; color: #0f172a; text-align: right;">
              ${data.address}<br/>
              <a href="${mapsUrl}" style="color: #007C89; font-size: 12px; font-weight: bold;">Navigate on Google Maps ↗</a>
            </td>
          </tr>
          ${
            data.medicalNotes
              ? `<tr>
                  <td style="padding: 8px 0; color: #64748b;">Client Notes / Requests:</td>
                  <td style="padding: 8px 0; font-weight: 600; color: #b45309; text-align: right;">${data.medicalNotes}</td>
                </tr>`
              : ""
          }
        </table>

        <h3 style="color: #135061; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0; border-bottom: 2px solid #f1f5f9; padding-bottom: 6px;">
          3. Financial Settlement Summary
        </h3>
        <table style="width: 100%; border-collapse: collapse; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px; font-size: 14px;">
          <tr>
            <td style="padding: 12px 16px; color: #64748b; border-bottom: 1px solid #e2e8f0;">Total Treatment Fee:</td>
            <td style="padding: 12px 16px; font-weight: bold; color: #0f172a; text-align: right; border-bottom: 1px solid #e2e8f0;">R${totalFee.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; color: #64748b; border-bottom: 1px solid #e2e8f0;">Paid Now via PayFast:</td>
            <td style="padding: 12px 16px; font-weight: bold; color: #16a34a; text-align: right; border-bottom: 1px solid #e2e8f0;">R${data.amountPaid.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 12px 16px; color: #64748b;">Balance to Collect at Session:</td>
            <td style="padding: 12px 16px; font-weight: bold; color: #D4426E; text-align: right;">R${data.balanceDue.toFixed(2)}</td>
          </tr>
        </table>

        <div style="text-align: center;">
          <a href="${appUrl}/admin/dashboard" style="display: inline-block; background: #135061; color: #ffffff; font-weight: bold; font-size: 13px; padding: 13px 28px; border-radius: 99px; text-decoration: none;">
            Manage Booking in Admin Portal ↗
          </a>
        </div>
      </div>
    </div>
  `;

  if (!apiKey) {
    console.log(
      `[Email Service] RESEND_API_KEY pending. Ready to dispatch Client Receipt to (${data.patientEmail}) & Admin Alert to (${adminEmail}).`
    );
    return { success: true, mock: true };
  }

  try {
    const resend = new Resend(apiKey);

    // 1. Send Client-Perspective Receipt to the Client
    const clientRes = await sendWithFallback(resend, primaryFrom, {
      to: data.patientEmail,
      replyTo: adminEmail,
      subject: `Booking Receipt & Confirmation: ${data.serviceName} (${data.referenceCode}) - Totus Massage & Aesthetics`,
      html: clientHtml,
    });

    // 2. Send Admin/Owner-Perspective Alert to totusmassages@gmail.com
    const adminRes = await sendWithFallback(resend, primaryFrom, {
      to: adminEmail,
      replyTo: data.patientEmail,
      subject: `🌸 New Paid Booking: ${data.patientName} — ${data.serviceName} [${data.referenceCode}]`,
      html: adminHtml,
    });

    return {
      success: clientRes.sent || adminRes.sent,
      senderUsed: adminRes.senderUsed || clientRes.senderUsed,
      usedFallbackSender: adminRes.usedFallback || clientRes.usedFallback,
      clientEmail: {
        sent: clientRes.sent,
        id: clientRes.id,
        error: clientRes.error,
      },
      adminEmail: {
        sent: adminRes.sent,
        id: adminRes.id,
        error: adminRes.error,
      },
    };
  } catch (error: any) {
    console.error("[Email Error]:", error.message);
    return { success: false, error: error.message };
  }
}
