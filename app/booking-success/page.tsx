"use client";

/**
 * Totus Massage & Aesthetics — Secure Post-PayFast Return Confirmation Page
 *
 * Security design:
 * Queries the strictly read-only `/api/bookings/status` endpoint to verify whether
 * PayFast's server-to-server ITN webhook has authenticated and finalized payment.
 * Never self-confirms unpaid bookings on the client side.
 */

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import confetti from "canvas-confetti";
import { BrandLogo } from "@/components/BrandLogo";
import {
  CheckCircle2,
  Clock,
  MessageCircle,
  Download,
  Copy,
  Check,
  ArrowRight,
  Home,
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
    const maxPolls = 6; // Poll up to ~12s while PayFast server-to-server ITN finalizes

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
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col justify-between">
      {/* Top Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-zinc-200/80 py-4 px-6 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/">
            <BrandLogo size="sm" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-600 hover:text-[#135061] transition-colors"
          >
            <Home className="w-3.5 h-3.5" /> Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-xl mx-auto px-4 py-12 w-full">
        <div className="bg-white rounded-3xl shadow-xl border border-zinc-200/80 overflow-hidden">
          {/* Header */}
          <div className="bg-[#135061] text-white p-8 text-center border-b-4 border-[#E86689]/70 relative">
            <div className="w-16 h-16 mx-auto rounded-full bg-white/15 border border-white/30 flex items-center justify-center text-white mb-4">
              {isConfirmed ? (
                <CheckCircle2 className="w-9 h-9 text-white" />
              ) : (
                <Clock className="w-8 h-8 text-white animate-pulse" />
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {isConfirmed
                ? "Booking Confirmed"
                : loading
                ? "Verifying Payment..."
                : "Payment Processing"}
            </h1>
            <p className="text-xs text-white/80 mt-1.5 max-w-sm mx-auto">
              {isConfirmed
                ? "Your payment has been verified and your session at Totus Massage & Aesthetics is officially reserved."
                : "We have received your return from PayFast. Your official receipt will arrive via email as soon as gateway confirmation completes."}
            </p>

            {/* Reference Badge */}
            <div className="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-full bg-black/20 border border-white/20 text-xs">
              <span className="text-white/75">Reference:</span>
              <span className="font-extrabold text-white text-sm tracking-wider">
                {refCode || "TOT-PENDING"}
              </span>
              {refCode && (
                <button
                  onClick={copyRefCode}
                  className="p-1 text-white/75 hover:text-white transition-colors"
                  title="Copy reference code"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-white" />
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
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#FAF9F6] text-zinc-800 border border-zinc-200/80 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#135061]" />
                <span>
                  {isConfirmed
                    ? "Official booking receipt dispatched to your email"
                    : "Awaiting final PayFast Instant Transaction Notification (ITN)"}
                </span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#FAF9F6] text-zinc-700 border border-zinc-200/80 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#E86689]" />
                <span>Totus Massage Therapist Direct Line: 079 011 8464</span>
              </div>
            </div>

            {booking && (
              <div className="bg-[#FAF9F6] rounded-2xl p-4 border border-zinc-200/80 text-xs space-y-2.5">
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
                  <span>{isConfirmed ? "Amount Paid:" : "Deposit Due:"}</span>
                  <span>
                    R
                    {(isConfirmed
                      ? booking.amountPaid
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

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={downloadIcs}
                disabled={!booking}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 transition-colors"
              >
                <Download className="w-4 h-4 text-[#135061]" />
                Add to Calendar (.ics)
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-[#135061] hover:bg-[#007C89] transition-colors shadow-sm"
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

      {/* Mini Footer */}
      <footer className="text-center py-6 text-xs text-zinc-500 border-t border-zinc-200 bg-white">
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
