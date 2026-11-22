"use client";

/**
 * Totus Massage & Aesthetics — Floating Glassmorphic Dynamic Island Navbar
 *
 * Features:
 * - Frosted glass island with subtle metallic-silver/white perimeter glow (`.glass-island-nav`)
 * - Meditative breathing glow on the `TOTUS — MASSAGE & AESTHETICS —` brand wordmark
 * - Glassmorphic bevel-up hover lift + metallic rim glow on the `Book Appointment` CTA
 * - Mathematically mobile-proof layout (zero overflow or hanging menu icons down to 320px screens)
 */

import React, { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "./BrandLogo";
import { Phone, MessageCircle, Menu, X, Calendar, ArrowDown } from "lucide-react";

interface NavbarProps {
  onOpenBooking?: () => void;
  onExploreServices?: () => void;
}

export function Navbar({ onOpenBooking, onExploreServices }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-3 sm:top-4 left-0 right-0 z-40 px-3 sm:px-6 pointer-events-none">
      {/* Floating Glassmorphic Dynamic Island */}
      <nav
        aria-label="Primary Navigation"
        className="pointer-events-auto max-w-7xl mx-auto rounded-full glass-island-nav px-3.5 sm:px-8 py-2.5 sm:py-3.5 transition-all duration-300"
      >
        <div className="flex items-center justify-between gap-2 sm:gap-4 min-w-0">
          {/* Logo with synchronized breathing metallic glow */}
          <Link
            href="/"
            className="flex items-center min-w-0 flex-shrink focus:outline-none"
          >
            <BrandLogo size="md" breathingGlow />
          </Link>

          {/* Desktop Navigation Actions */}
          <div className="hidden md:flex items-center gap-7 flex-shrink-0">
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-extrabold text-[#135061] uppercase tracking-widest">
                TOTUS MASSAGE THERAPIST
              </span>
              <div className="flex items-center justify-end gap-3 mt-0.5">
                <a
                  href="tel:0790118464"
                  className="flex items-center gap-1.5 text-sm font-bold text-zinc-900 hover:text-[#135061] transition-colors"
                  title="Call Totus Massage Therapist"
                >
                  <Phone className="w-3.5 h-3.5 text-[#135061]" />
                  079 011 8464
                </a>
                <span className="text-zinc-300">|</span>
                <a
                  href="https://wa.me/27790118464"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm font-bold text-zinc-900 hover:text-[#135061] transition-colors"
                  title="Chat with Totus Massage Therapist on WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#135061]" />
                  WhatsApp
                </a>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenBooking}
              className="glass-btn-teal inline-flex items-center justify-center px-7 py-3 rounded-full font-bold text-sm text-white cursor-pointer"
            >
              Book Appointment
            </button>
          </div>

          {/* Mobile Controls — Compact & Strictly Contained Inside Pill */}
          <div className="md:hidden flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBooking?.();
              }}
              className="glass-btn-teal px-3.5 py-2 rounded-full font-bold text-[11px] leading-none text-white whitespace-nowrap"
            >
              Book
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-9 h-9 inline-flex items-center justify-center rounded-full text-zinc-800 hover:bg-zinc-900/5 active:bg-zinc-900/10 focus:outline-none transition-colors flex-shrink-0"
              aria-label="Toggle Navigation"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Floating Glassmorphic Dropdown */}
      {mobileMenuOpen && (
        <div className="pointer-events-auto md:hidden max-w-7xl mx-auto mt-2.5 rounded-3xl glass-modal-card px-5 py-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-[#135061] uppercase tracking-widest">
              TOTUS MASSAGE THERAPIST
            </span>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-semibold text-zinc-400 hover:text-zinc-700"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2.5 pt-2 border-t border-zinc-200/70">
            <a
              href="tel:0790118464"
              className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white/75 border border-zinc-200/70 text-sm font-bold text-zinc-900 active:scale-[0.99] transition-all"
            >
              <span className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#135061]" />
                Call Therapist
              </span>
              <span className="text-xs font-semibold text-[#135061]">079 011 8464</span>
            </a>

            <a
              href="https://wa.me/27790118464"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white/75 border border-zinc-200/70 text-sm font-bold text-zinc-900 active:scale-[0.99] transition-all"
            >
              <span className="flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 text-[#135061]" />
                WhatsApp Therapist
              </span>
              <span className="text-xs font-semibold text-[#135061]">Chat Now</span>
            </a>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {onExploreServices && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onExploreServices();
                }}
                className="glass-btn-light inline-flex items-center justify-center gap-1.5 py-3 px-3 rounded-full text-xs font-bold text-zinc-900"
              >
                <span>Treatments</span>
                <ArrowDown className="w-3.5 h-3.5 text-[#135061]" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBooking?.();
              }}
              className={`glass-btn-teal inline-flex items-center justify-center gap-1.5 py-3 px-3 rounded-full text-xs font-bold text-white ${
                !onExploreServices ? "col-span-2" : ""
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Book Now</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
