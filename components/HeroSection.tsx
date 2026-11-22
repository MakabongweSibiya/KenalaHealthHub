"use client";

/**
 * Totus Massage & Aesthetics — Editorial Welcome Hero Section
 *
 * Design details:
 * - Seamless `#FAF9F6` canvas with zero bottom border/divider so it flows directly into treatments
 * - 14s meditative metallic-silver/white breathing glow on the main headline, full stop, and pink line
 * - Matching glassmorphic bevel-up hover CTAs (`Book Your Session` & `Explore Treatments`) with subtle metallic glow
 */

import React from "react";
import { EcgPulseLine } from "./BrandLogo";
import { Calendar, ArrowRight, ArrowDown } from "lucide-react";

interface HeroSectionProps {
  onOpenBooking: () => void;
  onExploreServices: () => void;
}

export function HeroSection({ onOpenBooking, onExploreServices }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-[#FAF9F6] pt-28 sm:pt-40 pb-14 sm:pb-24">
      {/* Ultra-soft top corner ambient aura that fades cleanly into #FAF9F6 well before bottom edge */}
      <div className="absolute -top-24 -right-24 w-[24rem] h-[24rem] rounded-full bg-[#E86689]/[0.06] blur-3xl pointer-events-none" />
      <div className="absolute top-12 -left-24 w-[22rem] h-[22rem] rounded-full bg-[#007C89]/[0.06] blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center">
        {/* Main Headline with slow meditative metallic-silver/white breathing glow */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-zinc-900 tracking-tight leading-[1.12] breathing-glow-text">
          Bespoke Massage &amp; Aesthetics,{" "}
          <span className="text-[#135061] relative inline-block">
            Crafted for Serenity.
            <svg
              aria-hidden="true"
              className="absolute left-0 -bottom-2 w-full h-2.5 text-[#E86689]/60 breathing-glow-line"
              viewBox="0 0 100 20"
              preserveAspectRatio="none"
            >
              <path
                d="M0 10 Q50 20 100 10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </h1>

        {/* Serene Botanical Lotus Divider */}
        <div className="mt-7 mb-7">
          <EcgPulseLine />
        </div>

        {/* Narrative Description */}
        <p className="text-base sm:text-lg text-zinc-600 max-w-2xl leading-relaxed mb-10">
          Welcome to <strong className="text-zinc-900">Totus Massage &amp; Aesthetics</strong>—your
          tranquil sanctuary for restorative therapeutic massage, skin rejuvenation, body
          contouring, and luxury aesthetic treatments tailored to melt away tension and restore your
          natural glow.
        </p>

        {/* Identical-Size Glassmorphic Bevel-Up CTAs with subtle metallic silver/white glow */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <button
            type="button"
            onClick={onOpenBooking}
            className="glass-btn-teal w-full sm:w-64 h-14 inline-flex items-center justify-center gap-2.5 px-7 rounded-full font-bold text-base text-white group cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-white/95" />
            <span>Book Your Session</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 ease-out group-hover:translate-x-1" />
          </button>

          <button
            type="button"
            onClick={onExploreServices}
            className="glass-btn-light w-full sm:w-64 h-14 inline-flex items-center justify-center gap-2.5 px-7 rounded-full font-bold text-base text-zinc-900 group cursor-pointer"
          >
            <span>Explore Treatments</span>
            <ArrowDown className="w-4 h-4 text-[#135061] transition-transform duration-300 ease-out group-hover:translate-y-1" />
          </button>
        </div>
      </div>
    </section>
  );
}
