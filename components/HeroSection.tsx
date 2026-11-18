"use client";

import React from "react";
import { EcgPulseLine } from "./BrandLogo";
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Phone,
  MessageCircle,
} from "lucide-react";

interface HeroSectionProps {
  onOpenBooking: () => void;
  onExploreServices: () => void;
}

export function HeroSection({ onOpenBooking, onExploreServices }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FAF9F6] via-[#FDF2F5]/40 to-[#F0F9FA]/60 pt-8 pb-16 lg:pt-14 lg:pb-24 border-b border-zinc-200">
      {/* Decorative Teal & Lotus Rose Pink Ambient Blobs */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-[#E86689]/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-[#007C89]/15 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headlines & Call to Actions */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-zinc-900 tracking-tight leading-[1.15]">
              Bespoke Massage &amp; Aesthetics,{" "}
              <span className="text-[#135061] relative inline-block">
                Crafted for Serenity.
                <svg
                  className="absolute left-0 -bottom-2 w-full h-2.5 text-[#E86689]/60"
                  viewBox="0 0 100 20"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 10 Q50 20 100 10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                </svg>
              </span>
            </h1>

            {/* Slogan with Lotus Wave Line */}
            <div className="mt-4 mb-6">
              <EcgPulseLine />
            </div>

            {/* Narrative description */}
            <p className="text-lg text-zinc-600 max-w-2xl leading-relaxed">
              Welcome to <strong>Totus Massage &amp; Aesthetics</strong>—your tranquil sanctuary for
              restorative therapeutic massage, skin rejuvenation, body contouring, and luxury
              aesthetic treatments tailored to melt away tension and restore your natural glow.
            </p>

            {/* Fast Benefit Checkmarks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 mb-8 w-full max-w-lg">
              <div className="flex items-center gap-2 text-sm text-zinc-700">
                <CheckCircle2 className="w-4 h-4 text-[#E86689] flex-shrink-0" />
                <span>R200 Booking Deposit (or full fee) via PayFast</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-700">
                <CheckCircle2 className="w-4 h-4 text-[#007C89] flex-shrink-0" />
                <span>Private, serene studio &amp; mobile sessions</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-700">
                <CheckCircle2 className="w-4 h-4 text-[#E86689] flex-shrink-0" />
                <span>Immediate WhatsApp &amp; Email confirmation</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-700">
                <CheckCircle2 className="w-4 h-4 text-[#007C89] flex-shrink-0" />
                <span>Bespoke Massage &amp; Aesthetics Specialists</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={onOpenBooking}
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full font-bold text-base text-white bg-gradient-to-r from-[#135061] to-[#007C89] hover:from-[#0E3D4B] hover:to-[#005C66] shadow-lg shadow-cyan-900/20 ring-2 ring-[#E86689]/30 transition-all duration-200 active:scale-95 group"
              >
                <Calendar className="w-5 h-5 text-[#F6A5BA]" />
                <span>Book Your Session</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={onExploreServices}
                className="inline-flex items-center gap-2 px-6 py-4 rounded-full font-semibold text-base text-zinc-800 bg-white border border-[#F9D5E0] hover:border-[#E86689] hover:bg-[#FDF2F5]/50 shadow-sm transition-all duration-200"
              >
                <Sparkles className="w-4 h-4 text-[#E86689]" />
                <span>Explore Treatments</span>
              </button>
            </div>
          </div>

          {/* Right Column: High-Impact Studio Sanctuary Card */}
          <div className="lg:col-span-5">
            <div className="relative bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#F9D5E0]/80">
              {/* Teal & Lotus Pink Curved Accent Top */}
              <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-[#135061] via-[#007C89] to-[#E86689] rounded-t-3xl" />

              <div className="flex items-center gap-4 pb-6 border-b border-zinc-100">
                <div className="w-16 h-16 rounded-2xl bg-[#FDF2F5] border border-[#F9D5E0] flex items-center justify-center flex-shrink-0 shadow-inner p-2">
                  <svg
                    viewBox="0 0 120 120"
                    className="w-full h-full"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="60"
                      cy="70"
                      r="42"
                      fill="#FFFFFF"
                      stroke="#135061"
                      strokeWidth="6"
                    />
                    <path
                      d="M44 54 C40 62 43 73 53 78 C61 81 69 77 72 68 C74 62 72 55 68 51"
                      stroke="#135061"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M46 64 Q50 67 54 63 M59 61 Q63 64 67 60"
                      stroke="#135061"
                      strokeWidth="2.3"
                      strokeLinecap="round"
                    />
                    <path
                      d="M55 73 Q59 75 63 72"
                      stroke="#E86689"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M60 44 C44 38 35 24 38 12 C48 15 56 26 60 44 Z"
                      fill="#C93B67"
                      stroke="#135061"
                      strokeWidth="3.5"
                    />
                    <path
                      d="M60 44 C76 38 85 24 82 12 C72 15 64 26 60 44 Z"
                      fill="#C93B67"
                      stroke="#135061"
                      strokeWidth="3.5"
                    />
                    <path
                      d="M60 45 C42 46 26 37 22 25 C36 24 50 31 60 45 Z"
                      fill="#E86689"
                      stroke="#135061"
                      strokeWidth="3.5"
                    />
                    <path
                      d="M60 45 C78 46 94 37 98 25 C84 24 70 31 60 45 Z"
                      fill="#E86689"
                      stroke="#135061"
                      strokeWidth="3.5"
                    />
                    <path
                      d="M60 46 C47 34 47 16 60 4 C73 16 73 34 60 46 Z"
                      fill="#E86689"
                      stroke="#135061"
                      strokeWidth="3.5"
                    />
                  </svg>
                </div>
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#E86689]">
                    Wellness &amp; Beauty Sanctuary
                  </span>
                  <h3 className="text-xl font-black text-[#135061] tracking-wide">
                    TOTUS
                  </h3>
                  <p className="text-xs font-semibold text-zinc-500">
                    Massage Therapy &amp; Luxury Aesthetics
                  </p>
                </div>
              </div>

              {/* Operating Hours Card */}
              <div className="bg-zinc-50 rounded-2xl p-4 my-5 border border-zinc-100 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-500">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#E86689]" /> Studio Hours
                  </span>
                  <span className="text-[#007C89] font-bold">Open for Reservations</span>
                </div>
                <div className="space-y-1.5 text-xs text-zinc-700">
                  <div className="flex justify-between">
                    <span className="font-medium">Monday – Friday</span>
                    <span className="font-bold text-zinc-900">08:00 – 17:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Saturday</span>
                    <span className="font-bold text-zinc-900">08:00 – 17:00</span>
                  </div>
                  <div className="flex justify-between text-[#D4426E]">
                    <span className="font-medium">Sunday &amp; Public Holidays</span>
                    <span className="font-bold">By appointment</span>
                  </div>
                </div>
              </div>

              {/* Studio Location Notice */}
              <div className="flex items-start gap-3 p-3.5 bg-[#FDF2F5]/70 rounded-xl border border-[#F9D5E0] mb-5">
                <MapPin className="w-5 h-5 text-[#E86689] flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-zinc-900 block">
                    In-Studio &amp; Mobile Spa Availability:
                  </span>
                  <span className="text-zinc-600">
                    Flexible studio locations &amp; private home call-outs tailored to your schedule.
                  </span>
                </div>
              </div>

              {/* Instant Contact Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <a
                  href="tel:0790118464"
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 transition-colors"
                  title="Call Studio"
                >
                  <Phone className="w-4 h-4 text-[#007C89]" />
                  Call 079 011 8464
                </a>
                <a
                  href="https://wa.me/27790118464"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm"
                  title="WhatsApp Concierge"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
