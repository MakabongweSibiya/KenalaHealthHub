"use client";

/**
 * Totus Massage & Aesthetics — Floating Glassmorphic Dynamic Island Navbar
 *
 * Features:
 * - Frosted glass island with minimal metallic-silver/white perimeter glow (`.glass-island-nav`)
 * - Meditative breathing glow on the `TOTUS — MASSAGE & AESTHETICS —` brand wordmark
 * - Glassmorphic bevel-up hover lift + metallic rim glow on the `Book Appointment` CTA
 */

import React, { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "./BrandLogo";
import { Phone, MessageCircle, Menu, X } from "lucide-react";

interface NavbarProps {
  onOpenBooking?: () => void;
}

export function Navbar({ onOpenBooking }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-3 sm:top-4 left-0 right-0 z-40 px-3 sm:px-6 pointer-events-none">
      {/* Floating Glassmorphic Dynamic Island with subtle metallic silver/white glow */}
      <nav
        aria-label="Primary Navigation"
        className="pointer-events-auto max-w-7xl mx-auto rounded-full glass-island-nav px-5 sm:px-8 py-3 sm:py-3.5 transition-all duration-300"
      >
        <div className="flex items-center justify-between gap-4">
          {/* Logo with synchronized breathing metallic glow */}
          <Link href="/" className="flex items-center focus:outline-none">
            <BrandLogo size="md" breathingGlow />
          </Link>

          {/* Desktop Navigation Actions */}
          <div className="hidden md:flex items-center gap-7">
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

          {/* Mobile Controls */}
          <div className="md:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenBooking}
              className="glass-btn-teal px-4 py-2 rounded-full font-bold text-xs text-white"
            >
              Book
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full text-zinc-800 hover:bg-zinc-100/80 focus:outline-none transition-colors"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Floating Glassmorphic Dropdown */}
      {mobileMenuOpen && (
        <div className="pointer-events-auto md:hidden max-w-7xl mx-auto mt-2 rounded-3xl glass-island-nav px-5 py-5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <span className="text-[11px] font-extrabold text-[#135061] uppercase tracking-widest block">
            TOTUS MASSAGE THERAPIST
          </span>
          <div className="flex flex-col gap-2.5 pt-1 border-t border-zinc-200/70">
            <a
              href="tel:0790118464"
              className="flex items-center gap-2.5 text-sm font-bold text-zinc-900 hover:text-[#135061] py-1"
            >
              <Phone className="w-4 h-4 text-[#135061]" />
              Call: 079 011 8464
            </a>
            <a
              href="https://wa.me/27790118464"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-sm font-bold text-zinc-900 hover:text-[#135061] py-1"
            >
              <MessageCircle className="w-4 h-4 text-[#135061]" />
              WhatsApp: 079 011 8464
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
