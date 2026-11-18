"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "./BrandLogo";
import { Phone, MessageCircle, Clock, MapPin, Menu, X, Sparkles } from "lucide-react";

interface NavbarProps {
  onOpenBooking?: () => void;
}

export function Navbar({ onOpenBooking }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200 shadow-sm transition-all duration-200">
      {/* Top Banner (Hours & Studio notice) */}
      <div className="bg-[#111111] text-white text-xs py-1.5 px-4 hidden sm:block border-b border-[#E86689]/30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 text-zinc-300">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-[#E86689]" />
              Mon – Sat: 08:00 – 17:00 | Sun: By appointment
            </span>
            <span className="text-zinc-500">•</span>
            <span className="flex items-center gap-1.5 text-zinc-300">
              <MapPin className="w-3.5 h-3.5 text-[#00A3AD] flex-shrink-0" />
              In-Studio &amp; Mobile Aesthetics Sanctuary
            </span>
          </div>
          <div className="flex items-center gap-2 text-zinc-300 text-[11px]">
            <Sparkles className="w-3 h-3 text-[#E86689]" />
            <span>Massage Therapy • Facials • Body &amp; Skin Aesthetics</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center focus:outline-none">
            <BrandLogo size="md" />
          </Link>

          {/* Desktop Nav Actions */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-extrabold text-[#E86689] uppercase tracking-widest">
                TOTUS CONCIERGE
              </span>
              <div className="flex items-center gap-3 mt-0.5">
                <a
                  href="tel:0790118464"
                  className="flex items-center gap-1.5 text-sm font-bold text-zinc-900 hover:text-[#007C89] transition-colors"
                  title="Call Totus Massage & Aesthetics"
                >
                  <Phone className="w-3.5 h-3.5 text-[#007C89]" />
                  079 011 8464
                </a>
                <span className="text-zinc-300">|</span>
                <a
                  href="https://wa.me/27790118464"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                  title="Chat on WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  WhatsApp
                </a>
              </div>
            </div>

            <button
              onClick={onOpenBooking}
              className="inline-flex items-center justify-center px-6 py-3 rounded-full font-bold text-sm text-white bg-gradient-to-r from-[#135061] to-[#007C89] hover:from-[#0E3D4B] hover:to-[#005C66] shadow-md hover:shadow-lg ring-2 ring-[#E86689]/25 transition-all duration-200 active:scale-95"
            >
              Book Appointment
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={onOpenBooking}
              className="px-4 py-2 rounded-full font-bold text-xs text-white bg-[#135061] hover:bg-[#007C89] transition-all"
            >
              Book
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-zinc-700 hover:text-zinc-900 focus:outline-none"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-zinc-200 px-4 pt-3 pb-6 space-y-4 shadow-xl">
          <div className="flex flex-col gap-2 pt-2 border-t border-zinc-100">
            <span className="text-xs font-bold text-[#E86689] uppercase tracking-wider">
              TOTUS CONCIERGE:
            </span>
            <a
              href="tel:0790118464"
              className="flex items-center gap-2 text-sm font-bold text-zinc-800 hover:text-[#007C89]"
            >
              <Phone className="w-4 h-4 text-[#007C89]" />
              Call: 079 011 8464
            </a>
            <a
              href="https://wa.me/27790118464"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-bold text-emerald-600"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp: 079 011 8464
            </a>
            <div className="flex items-center gap-1.5 text-xs text-zinc-600 mt-2">
              <MapPin className="w-3.5 h-3.5 text-[#E86689] flex-shrink-0" />
              Studio &amp; Mobile Spa Sessions Available
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-600">
              <Clock className="w-3.5 h-3.5 text-[#007C89] flex-shrink-0" />
              Mon – Sat: 08:00 – 17:00
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
