"use client";

/**
 * Totus Massage & Aesthetics — Glassmorphic Post-PayFast Verification & Confirmation Page
 *
 * Security design:
 * Displays a refined glassmorphic verification card while polling the strictly read-only
 * `/api/bookings/status` endpoint until PayFast's genuine server-to-server ITN webhook
 * cryptographically verifies and confirms the payment. Never self-confirms unpaid bookings.
 */

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import confetti from "canvas-confetti";
import { BrandLogo } from "@/components/BrandLogo";
import {
  CheckCircle2,
  Loader2,
  Clock,
  MessageCircle,
  Download,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

interface SafeBookingStatus {
  referenceCode: string;
  status: string;
  serviceName: string;
  itemType: string;
  appointmentDate: string;
  timeSlot: string;
  area: string;
  clientFirstName: string;
  paymentChoice: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
}

function BookingSuccessContent() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref");

  const [booking, setBooking] = useState<SafeBookingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const isConfirmed =
    booking?.status === "CONFIRMED" || booking?.status === "COMPLETED";

  useEffect(() => {
    let active = true;
    let pollAttempts = 0;
    const maxPolls = 8; // Poll ~16s while PayFast server-to-server ITN settles

    async function fetchStatus() {
      if (!refCode) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `/api/bookings/status?ref=${encodeURIComponent(refCode)}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (!active) return;

        if (data.booking) {
          setBooking(data.booking);
          if (
            data.booking.status === "CONFIRMED" ||
            data.booking.status === "COMPLETED"
          ) {
            setLoading(false);
            try {
              confetti({
                particleCount: 80,
                spread: 75,
                origin: { y: 0.5 },
                colors: ["#135061", "#007C89", "#E86689", "#CBD5E1"],
              });
            } catch {
              // Ignore non-critical animation failure
            }
            return;
          }
        }

        pollAttempts += 1;
        if (pollAttempts < maxPolls) {
          setTimeout(fetchStatus, 2000);
        } else {
          setLoading(false);
        }
      } catch (e) {
        console.error("Failed to verify booking status:", e);
        if (active) setLoading(false);
      }
    }

    fetchStatus();
    return () => {
      active = false;
    };
  }, [refCode]);

  const copyRefCode = () => {
    if (refCode) {
      navigator.clipboard.writeText(refCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadIcs = () => {
    if (!booking) return;
    const title = `Appointment: ${booking.serviceName} - Totus Massage & Aesthetics`;
    const description = `Totus Massage & Aesthetics Appointment. Reference: ${booking.referenceCode}. Contact: 079 011 8464.`;
    const location = booking.area || "Totus Studio";
    const dateStr = booking.appointmentDate?.replace(/-/g, "") || "20261124";

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Totus Massage & Aesthetics//Booking//EN",
      "BEGIN:VEVENT",
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      `DTSTART:${dateStr}T090000`,
      `DTEND:${dateStr}T100000`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", `Totus-Appointment-${booking.referenceCode}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const whatsappUrl = `https://wa.me/27790118464?text=${encodeURIComponent(
    `Hello Totus Massage & Aesthetics, I have completed payment for booking ${refCode || ""}. Looking forward to my appointment!`
  )}`;

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col justify-between relative overflow-hidden">
      {/* Floating Glassmorphic Dynamic Island Navbar */}
      <header className="fixed top-3 sm:top-4 left-0 right-0 z-40 px-3 sm:px-6 pointer-events-none">
        <nav className="pointer-events-auto max-w-7xl mx-auto rounded-full glass-island-nav px-3.5 sm:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4">
          <Link href="/" className="flex items-center min-w-0 focus:outline-none">
            <BrandLogo size="md" breathingGlow />
          </Link>
          <Link
            href="/"
            className="glass-btn-light flex-shrink-0 inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full text-[11px] sm:text-sm font-bold text-zinc-900 whitespace-nowrap"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#135061]" />
            <span>Back to Home</span>
          </Link>
        </nav>
      </header>

      {/* Main Glassmorphic Verification / Confirmation Card */}
      <main className="max-w-xl mx-auto px-4 pt-32 pb-14 w-full flex-1 flex items-center">
        <div className="w-full glass-modal-card rounded-3xl overflow-hidden">
          {/* Clean Glass Header */}
          <div className="bg-white/40 backdrop-blur-md p-7 sm:p-8 text-center border-b border-zinc-200/60">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#F0F9FA] border border-[#B2E2E6] flex items-center justify-center text-[#135061] mb-4 shadow-sm">
              {isConfirmed ? (
                <CheckCircle2 className="w-9 h-9 text-[#135061]" />
              ) : loading ? (
                <Loader2 className="w-8 h-8 text-[#135061] animate-spin" />
              ) : (
                <Clock className="w-8 h-8 text-[#135061]" />
              )}
            </div>

            <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#135061] block mb-1.5">
              {isConfirmed
                ? "Payment Verified"
                : loading
                ? "Awaiting Gateway Confirmation"
                : "Verification Pending"}
            </span>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight breathing-glow-text">
              {isConfirmed
                ? "Booking Confirmed"
                : loading
                ? "Verifying Your Payment..."
                : "Payment Processing"}
            </h1>

            <p className="text-xs sm:text-sm text-zinc-600 mt-2 max-w-sm mx-auto leading-relaxed">
              {isConfirmed
                ? "Your payment has been verified directly with PayFast and your session at Totus Massage & Aesthetics is officially reserved."
                : "Please hold on a brief moment while we confirm your transaction directly with PayFast. Your official receipt will email automatically once verified."}
            </p>

            {/* Reference Pill */}
            <div className="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-full bg-white/80 border border-zinc-200/80 text-xs shadow-sm">
              <span className="text-zinc-500 font-medium">Reference:</span>
              <span className="font-extrabold text-[#135061] text-sm tracking-wider">
                {refCode || "TOT-PENDING"}
              </span>
              {refCode && (
                <button
                  type="button"
                  onClick={copyRefCode}
                  className="p-1 text-zinc-400 hover:text-[#135061] transition-colors"
                  title="Copy reference code"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-[#135061]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="p-6 sm:p-8 space-y-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/70 text-zinc-800 border border-zinc-200/70 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#135061]" />
                <span>
                  {isConfirmed
                    ? "Official booking receipt dispatched to your email"
                    : "Listening securely for PayFast Instant Transaction Notification"}
                </span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/70 text-zinc-700 border border-zinc-200/70 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#E86689]" />
                <span>Totus Massage Therapist Direct Line: 079 011 8464</span>
              </div>
            </div>

            {booking && (
              <div className="bg-white/75 rounded-2xl p-4 border border-zinc-200/70 text-xs space-y-2.5">
                <div className="flex justify-between py-1 border-b border-zinc-200/60">
                  <span className="text-zinc-500">Treatment / Item:</span>
                  <strong className="text-zinc-900">{booking.serviceName}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-200/60">
                  <span className="text-zinc-500">Date &amp; Time:</span>
                  <strong className="text-zinc-900">
                    {booking.appointmentDate} at {booking.timeSlot}
                  </strong>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-200/60">
                  <span className="text-zinc-500">Client:</span>
                  <strong className="text-zinc-900">{booking.clientFirstName}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-200/60">
                  <span className="text-zinc-500">Area / Studio:</span>
                  <strong className="text-zinc-900">{booking.area}</strong>
                </div>
                <div className="flex justify-between pt-1 font-bold text-[#135061] text-sm">
                  <span>{isConfirmed ? "Amount Paid:" : "Expected Payment:"}</span>
                  <span>
                    R
                    {(isConfirmed
                      ? booking.amountPaid
                      : booking.paymentChoice === "FULL_100"
                      ? booking.totalAmount
                      : Math.min(200, booking.totalAmount)
                    ).toFixed(2)}
                  </span>
                </div>
                {booking.balanceDue > 0 && (
                  <div className="flex justify-between text-zinc-600 font-semibold text-xs">
                    <span>Remaining Balance (at session):</span>
                    <span>R{booking.balanceDue.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Glassmorphic Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={downloadIcs}
                disabled={!booking}
                className="glass-btn-light flex items-center justify-center gap-2 py-3 px-4 rounded-full text-xs font-bold text-zinc-900 disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-[#135061]" />
                Add to Calendar (.ics)
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-btn-teal flex items-center justify-center gap-2 py-3 px-4 rounded-full text-xs font-bold text-white"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp Therapist
              </a>
            </div>

            <div className="pt-2 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs font-bold text-[#135061] hover:underline"
              >
                Return to Homepage <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Seamless #FAF9F6 Footer */}
      <footer className="text-center py-6 text-xs text-zinc-500 bg-[#FAF9F6]">
        Totus Massage &amp; Aesthetics • Serenity, Beauty &amp; Pure Rejuvenation
      </footer>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-sm font-bold text-zinc-600 bg-[#FAF9F6]">
          Verifying booking confirmation...
        </div>
      }
    >
      <BookingSuccessContent />
    </Suspense>
  );
}
