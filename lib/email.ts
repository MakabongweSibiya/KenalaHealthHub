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

  const logoEmblemUrl = `${appUrl}/totus-emblem.png`;
  const googleMapsIconUrl = `${appUrl}/google-maps-icon.png`;
  const mapsUrl = getGoogleMapsUrl(data.address);
  const totalFee = data.amountPaid + data.balanceDue;
  const cleanClientWhatsapp = data.patientPhone
    .replace(/\D/g, "")
    .replace(/^0/, "27");
  const therapistWhatsappUrl = "https://wa.me/27790118464";

  const fontStack =
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  const paymentLabel =
    data.paymentType === "FULL_100" ? "Full Settlement" : "Booking Deposit";

  // 1. CLIENT-PERSPECTIVE EMAIL (Refined Luxury Receipt & Confirmation)
  const clientHtml = `
    <div style="font-family: ${fontStack}; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
      <!-- Luxury Header with Authentic Totus Emblem -->
      <div style="background: #FAF9F6; padding: 30px 24px 24px 24px; text-align: center; border-bottom: 2px solid #135061;">
        <img
          src="${logoEmblemUrl}"
          alt="Totus Massage & Aesthetics"
          width="76"
          height="76"
          style="display: block; margin: 0 auto 12px auto; width: 76px; height: 76px; object-fit: contain;"
        />
        <h1 style="color: #135061; margin: 0; font-size: 24px; letter-spacing: 4px; font-weight: 800;">
          TOTUS
        </h1>
        <p style="color: #1e293b; margin: 5px 0 0 0; font-size: 10px; letter-spacing: 2.5px; font-weight: 700;">
          — MASSAGE <span style="color: #E86689;">&amp;</span> AESTHETICS —
        </p>
      </div>
      
      <div style="padding: 28px 24px;">
        <!-- Clean Intro Card (No Left Pink Bar) -->
        <div style="background: #FAF9F6; border: 1px solid #e2e8f0; padding: 18px 20px; border-radius: 12px; margin-bottom: 24px;">
          <h2 style="color: #135061; margin: 0 0 6px 0; font-size: 17px; font-weight: 600;">
            Booking Receipt &amp; Confirmation
          </h2>
          <p style="color: #475569; margin: 0; font-size: 14px; line-height: 1.55; font-weight: 400;">
            Dear <strong style="color: #0f172a; font-weight: 600;">${data.patientName}</strong>, thank you for choosing Totus Massage &amp; Aesthetics. Your payment has been verified and your session is confirmed.
          </p>
        </div>

        <!-- Clean Details & Financial Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px; font-family: ${fontStack};">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: 400;">Booking Reference</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; text-align: right; font-weight: 600; letter-spacing: 0.3px;">${data.referenceCode}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: 400;">Reserved Treatment</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; text-align: right; font-weight: 600;">${data.serviceName}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: 400;">Date &amp; Time Slot</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; text-align: right; font-weight: 600;">${data.appointmentDate} at ${data.timeSlot}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: 400; vertical-align: middle;">Session Location</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; text-align: right; font-weight: 600; vertical-align: middle;">
              <table cellpadding="0" cellspacing="0" border="0" align="right" style="margin-left: auto;">
                <tr>
                  <td style="padding-right: 8px; text-align: right; color: #0f172a; font-size: 14px; font-weight: 600; line-height: 1.4;">
                    ${data.address}
                  </td>
                  <td style="vertical-align: middle;">
                    <a
                      href="${mapsUrl}"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open Location in Google Maps"
                      style="display: inline-block; padding: 6px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; text-decoration: none; line-height: 0;"
                    >
                      <img
                        src="${googleMapsIconUrl}"
                        alt="Google Maps"
                        width="20"
                        height="20"
                        style="display: block; width: 20px; height: 20px; border: 0;"
                      />
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 10px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: 400;">Total Treatment Fee</td>
            <td style="padding: 12px 10px; border-bottom: 1px solid #f1f5f9; color: #0f172a; text-align: right; font-weight: 600;">R${totalFee.toFixed(2)}</td>
          </tr>
          <tr style="background: #F0F9FA;">
            <td style="padding: 13px 10px; border-bottom: 1px solid #e2e8f0; color: #135061; font-weight: 600;">Amount Paid (PayFast)</td>
            <td style="padding: 13px 10px; border-bottom: 1px solid #e2e8f0; color: #135061; text-align: right; font-weight: 700; font-size: 15px;">
              R${data.amountPaid.toFixed(2)} <span style="color: #475569; font-weight: 500; font-size: 12px;">(${paymentLabel})</span>
            </td>
          </tr>
          <tr style="background: #F8FAFC;">
            <td style="padding: 13px 10px; border-bottom: 1px solid #e2e8f0; color: #334155; font-weight: 600;">Remaining Balance at Visit</td>
            <td style="padding: 13px 10px; border-bottom: 1px solid #e2e8f0; color: #0f172a; text-align: right; font-weight: 700; font-size: 15px;">
              R${data.balanceDue.toFixed(2)}
            </td>
          </tr>
        </table>

        ${
          data.prepInstructions
            ? `<div style="background: #F0F9FA; border: 1px solid #B2E2E6; padding: 15px 18px; border-radius: 10px; margin-bottom: 24px;">
                <strong style="color: #135061; font-size: 13px; display: block; margin-bottom: 4px; font-weight: 600;">Session Preparation Notes</strong>
                <span style="color: #334155; font-size: 13px; line-height: 1.55;">${data.prepInstructions}</span>
              </div>`
            : ""
        }

        <!-- Direct Therapist Contact with Clickable Call & WhatsApp API Links -->
        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 13px; color: #64748b; line-height: 1.7;">
          <p style="margin: 0 0 6px 0;">
            <strong style="color: #0f172a; font-weight: 600;">Totus Therapist (Call &amp; WhatsApp):</strong>
            <a href="tel:0790118464" style="color: #135061; text-decoration: none; font-weight: 600;">079 011 8464</a>
            &nbsp;•&nbsp;
            <a href="${therapistWhatsappUrl}" target="_blank" rel="noopener noreferrer" style="color: #135061; text-decoration: underline; font-weight: 600;">Message on WhatsApp</a>
          </p>
          <p style="margin: 0;">
            <strong style="color: #0f172a; font-weight: 600;">Email Inquiries:</strong>
            <a href="mailto:totusmassages@gmail.com" style="color: #475569; text-decoration: none;">totusmassages@gmail.com</a>
          </p>
        </div>
      </div>
      
      <div style="background: #FAF9F6; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
        Serenity, Beauty &amp; Pure Rejuvenation • Totus Massage &amp; Aesthetics © ${new Date().getFullYear()}
      </div>
    </div>
  `;

  // 2. ADMIN/OWNER-PERSPECTIVE EMAIL (Sent to totusmassages@gmail.com)
  const adminHtml = `
    <div style="font-family: ${fontStack}; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
      <!-- Owner Notification Header with Authentic Logo -->
      <div style="background: #FAF9F6; padding: 26px 24px 20px 24px; text-align: center; border-bottom: 2px solid #135061;">
        <img
          src="${logoEmblemUrl}"
          alt="Totus Massage & Aesthetics"
          width="64"
          height="64"
          style="display: block; margin: 0 auto 10px auto; width: 64px; height: 64px; object-fit: contain;"
        />
        <h1 style="color: #135061; margin: 0; font-size: 20px; font-weight: 700;">
          New Paid Booking Received
        </h1>
        <p style="color: #64748b; margin: 5px 0 0 0; font-size: 12px; font-weight: 500;">
          Booking Reference: <strong style="color: #0f172a;">${data.referenceCode}</strong>
        </p>
      </div>

      <div style="padding: 26px 24px;">
        <h3 style="color: #135061; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; font-weight: 700;">
          1. Client Details &amp; Contact
        </h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 22px; font-size: 14px; font-family: ${fontStack};">
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Client Full Name</td>
            <td style="padding: 8px 0; font-weight: 600; color: #0f172a; text-align: right;">${data.patientName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; vertical-align: middle;">WhatsApp / Phone</td>
            <td style="padding: 8px 0; font-weight: 600; text-align: right; vertical-align: middle;">
              <a href="tel:${data.patientPhone.replace(/\s+/g, "")}" style="color: #0f172a; text-decoration: none; margin-right: 10px;">${data.patientPhone}</a>
              <a
                href="https://wa.me/${cleanClientWhatsapp}"
                target="_blank"
                rel="noopener noreferrer"
                style="display: inline-block; background: #135061; color: #ffffff; font-size: 12px; font-weight: 600; padding: 6px 14px; border-radius: 99px; text-decoration: none;"
              >
                WhatsApp Client
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Client Email</td>
            <td style="padding: 8px 0; font-weight: 500; color: #0f172a; text-align: right;">
              <a href="mailto:${data.patientEmail}" style="color: #475569; text-decoration: none;">${data.patientEmail}</a>
            </td>
          </tr>
        </table>

        <h3 style="color: #135061; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; font-weight: 700;">
          2. Treatment, Schedule &amp; Location
        </h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 22px; font-size: 14px; font-family: ${fontStack};">
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Treatment Booked</td>
            <td style="padding: 8px 0; font-weight: 600; color: #0f172a; text-align: right;">${data.serviceName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Date &amp; Time Slot</td>
            <td style="padding: 8px 0; font-weight: 600; color: #0f172a; text-align: right;">${data.appointmentDate} (${data.timeSlot})</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; vertical-align: middle;">Session Location</td>
            <td style="padding: 8px 0; font-weight: 600; color: #0f172a; text-align: right; vertical-align: middle;">
              <table cellpadding="0" cellspacing="0" border="0" align="right" style="margin-left: auto;">
                <tr>
                  <td style="padding-right: 8px; text-align: right; color: #0f172a; font-size: 14px; font-weight: 600;">
                    ${data.address}
                  </td>
                  <td style="vertical-align: middle;">
                    <a
                      href="${mapsUrl}"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Navigate with Google Maps"
                      style="display: inline-block; padding: 6px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; text-decoration: none; line-height: 0;"
                    >
                      <img
                        src="${googleMapsIconUrl}"
                        alt="Google Maps"
                        width="20"
                        height="20"
                        style="display: block; width: 20px; height: 20px; border: 0;"
                      />
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${
            data.medicalNotes
              ? `<tr>
                  <td style="padding: 8px 0; color: #64748b;">Client Notes / Preferences</td>
                  <td style="padding: 8px 0; font-weight: 500; color: #334155; text-align: right;">${data.medicalNotes}</td>
                </tr>`
              : ""
          }
        </table>

        <h3 style="color: #135061; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; font-weight: 700;">
          3. Financial Settlement Summary
        </h3>
        <table style="width: 100%; border-collapse: collapse; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 24px; font-size: 14px;">
          <tr>
            <td style="padding: 13px 16px; color: #64748b; border-bottom: 1px solid #e2e8f0;">Total Treatment Fee</td>
            <td style="padding: 13px 16px; font-weight: 600; color: #0f172a; text-align: right; border-bottom: 1px solid #e2e8f0;">R${totalFee.toFixed(2)}</td>
          </tr>
          <tr style="background: #F0F9FA;">
            <td style="padding: 14px 16px; color: #135061; font-weight: 600; border-bottom: 1px solid #d5ecef;">Paid Now via PayFast</td>
            <td style="padding: 14px 16px; font-weight: 700; color: #135061; font-size: 15px; text-align: right; border-bottom: 1px solid #d5ecef;">
              R${data.amountPaid.toFixed(2)} <span style="color: #475569; font-weight: 500; font-size: 12px;">(${paymentLabel})</span>
            </td>
          </tr>
          <tr style="background: #F1F5F9;">
            <td style="padding: 14px 16px; color: #334155; font-weight: 600;">Balance to Collect at Session</td>
            <td style="padding: 14px 16px; font-weight: 700; color: #0f172a; font-size: 15px; text-align: right;">R${data.balanceDue.toFixed(2)}</td>
          </tr>
        </table>

        <div style="text-align: center;">
          <a href="${appUrl}/admin/dashboard" style="display: inline-block; background: #135061; color: #ffffff; font-weight: 600; font-size: 13px; padding: 13px 28px; border-radius: 99px; text-decoration: none;">
            Manage Booking in Admin Portal
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

    // 1. Send Client-Perspective Receipt
    const clientRes = await sendWithFallback(resend, primaryFrom, {
      to: data.patientEmail,
      replyTo: adminEmail,
      subject: `Booking Receipt & Confirmation: ${data.serviceName} (${data.referenceCode}) - Totus Massage & Aesthetics`,
      html: clientHtml,
    });

    // 2. Send Admin/Owner-Perspective Notification
    const adminRes = await sendWithFallback(resend, primaryFrom, {
      to: adminEmail,
      replyTo: data.patientEmail,
      subject: `New Paid Booking: ${data.patientName} — ${data.serviceName} (${data.referenceCode})`,
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
