"use client";

import React from "react";
import { EcgPulseLine } from "./BrandLogo";
import { Calendar, ArrowRight, ArrowDown } from "lucide-react";

interface HeroSectionProps {
  onOpenBooking: () => void;
  onExploreServices: () => void;
}

export function HeroSection({ onOpenBooking, onExploreServices }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FAF9F6] via-[#FDF2F5]/30 to-[#F0F9FA]/50 pt-28 sm:pt-36 pb-16 sm:pb-24 border-b border-zinc-200/80">
      {/* Subtle Teal & Lotus Rose Ambient Glows */}
      <div className="absolute top-0 right-0 -mr-24 -mt-24 w-[28rem] h-[28rem] rounded-full bg-[#E86689]/12 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-[26rem] h-[26rem] rounded-full bg-[#007C89]/12 blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center">
        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-zinc-900 tracking-tight leading-[1.12]">
          Bespoke Massage &amp; Aesthetics,{" "}
          <span className="text-[#135061] relative inline-block">
            Crafted for Serenity.
            <svg
              className="absolute left-0 -bottom-2 w-full h-2.5 text-[#E86689]/55"
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

        {/* Serene Botanical Lotus Divider */}
        <div className="mt-6 mb-7">
          <EcgPulseLine />
        </div>

        {/* Narrative Description */}
        <p className="text-base sm:text-lg text-zinc-600 max-w-2xl leading-relaxed mb-10">
          Welcome to <strong className="text-zinc-900">Totus Massage &amp; Aesthetics</strong>—your
          tranquil sanctuary for restorative therapeutic massage, skin rejuvenation, body
          contouring, and luxury aesthetic treatments tailored to melt away tension and restore your
          natural glow.
        </p>

        {/* Identical-Size CTAs (Deep Teal + Crisp White) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <button
            onClick={onOpenBooking}
            className="w-full sm:w-64 h-14 inline-flex items-center justify-center gap-2.5 px-7 rounded-full font-bold text-base text-white bg-[#135061] hover:bg-[#007C89] shadow-lg shadow-[#135061]/20 hover:shadow-xl transition-all duration-200 active:scale-95 group"
          >
            <Calendar className="w-4 h-4 text-white" />
            <span>Book Your Session</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>

          <button
            onClick={onExploreServices}
            className="w-full sm:w-64 h-14 inline-flex items-center justify-center gap-2.5 px-7 rounded-full font-bold text-base text-zinc-900 bg-white border border-zinc-200 hover:border-[#135061] hover:bg-zinc-50 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 group"
          >
            <span>Explore Treatments</span>
            <ArrowDown className="w-4 h-4 text-[#135061] transition-transform group-hover:translate-y-0.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
