import React from "react";
import Link from "next/link";
import { BrandLogo, EcgPulseLine } from "./BrandLogo";
import { Phone, MessageCircle, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white text-zinc-900 pt-5 pb-3 border-t border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-4 border-b border-zinc-200/80">
          {/* Brand Col */}
          <div className="space-y-1.5">
            <BrandLogo size="sm" />
            <p className="text-xs text-zinc-600 leading-relaxed max-w-sm">
              Dedicated to holistic relaxation, therapeutic bodywork, facial rejuvenation,
              and bespoke aesthetic treatments delivered in-studio or in the comfort of your space.
            </p>
            <div className="pt-0.5">
              <EcgPulseLine />
            </div>
          </div>

          {/* Quick Contact */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#135061]">
              Direct Reservations
            </h4>
            <div className="space-y-1 text-xs text-zinc-700">
              <p className="font-bold text-zinc-900 uppercase tracking-wider">
                TOTUS MASSAGE THERAPIST
              </p>
              <a
                href="tel:0790118464"
                className="flex items-center gap-2 hover:text-[#135061] transition-colors font-medium"
                title="Call Totus Massage Therapist"
              >
                <Phone className="w-3.5 h-3.5 text-[#135061]" />
                079 011 8464 (Calls)
              </a>
              <a
                href="https://wa.me/27790118464"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-[#135061] transition-colors font-medium"
                title="WhatsApp Totus Massage Therapist"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#135061]" />
                079 011 8464 (WhatsApp)
              </a>
              <div className="flex items-start gap-2 pt-0.5 text-zinc-500">
                <MapPin className="w-3.5 h-3.5 text-[#135061] flex-shrink-0 mt-0.5" />
                <span>In-Studio &amp; Mobile Spa Sessions</span>
              </div>
            </div>
          </div>

          {/* Operating Hours */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#135061]">
              Studio Hours
            </h4>
            <div className="space-y-1 text-xs text-zinc-700">
              <div className="flex justify-between border-b border-zinc-100 pb-0.5">
                <span>Monday – Friday:</span>
                <span className="font-bold text-zinc-900">08:00 – 17:00</span>
              </div>
              <div className="flex justify-between border-b border-zinc-100 pb-0.5">
                <span>Saturday:</span>
                <span className="font-bold text-zinc-900">08:00 – 17:00</span>
              </div>
              <div className="flex justify-between text-[#135061]">
                <span>Sunday &amp; Holidays:</span>
                <span className="font-bold">By appointment</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Centered Copyright with Teal 'admin' Link */}
        <div className="pt-2.5 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500">
          <div className="w-12 hidden sm:block" />
          <p className="text-center text-[11px] sm:text-xs text-zinc-600">
            Copyright © {new Date().getFullYear()} Totus Massage &amp; Aesthetics. All rights reserved.
          </p>
          <div className="mt-1 sm:mt-0">
            <Link
              href="/admin/login"
              className="text-[11px] text-[#135061] hover:text-[#007C89] font-bold transition-colors lowercase tracking-wider select-none font-mono"
              title="Staff Access"
            >
              admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
