"use client";

/**
 * Totus Massage & Aesthetics — Seamless Dynamic Location-Aware Footer
 *
 * Design & truthful hours guarantees:
 * - Uses the exact same `#FAF9F6` ivory canvas as the Hero and Treatments sections (zero harsh contrast strip)
 * - Meditative metallic-silver breathing glow applied to `TOTUS — MASSAGE & AESTHETICS —` wordmark
 * - Zero hardcoded/fabricated studio hours; automatically displays live South African hours (or `Unavailable`)
 *   per active Studio Location once configured by the Admin
 */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BrandLogo, EcgPulseLine } from "./BrandLogo";
import { Phone, MessageCircle, MapPin } from "lucide-react";
import {
  LocationItem,
  getLocationAvailabilityForDate,
  getTodaySouthAfricaIsoDate,
} from "@/lib/schedule";

interface FooterProps {
  locations?: LocationItem[];
}

export function Footer({ locations: propLocations }: FooterProps) {
  const [fetchedLocations, setFetchedLocations] = useState<LocationItem[]>([]);

  useEffect(() => {
    if (propLocations !== undefined) return;
    let active = true;
    async function load() {
      try {
        const res = await fetch("/api/admin/locations", { cache: "no-store" });
        const data = await res.json();
        if (active && Array.isArray(data.locations)) {
          setFetchedLocations(data.locations);
        }
      } catch {
        // Keep empty gracefully
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [propLocations]);

  const rawLocations = propLocations !== undefined ? propLocations : fetchedLocations;
  const activeLocations = rawLocations.filter((loc) => loc.isActive);
  const hasStudioHours = activeLocations.length > 0;
  const todayIso = getTodaySouthAfricaIsoDate();

  return (
    <footer className="bg-[#FAF9F6] text-zinc-900 pt-10 pb-5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`grid grid-cols-1 ${
            hasStudioHours ? "md:grid-cols-3" : "md:grid-cols-2"
          } gap-8 pb-6 border-b border-zinc-200/60`}
        >
          {/* Brand Column with matching subtle breathing glow on TOTUS — MASSAGE & AESTHETICS — */}
          <div className="space-y-2">
            <BrandLogo size="sm" breathingGlow />
            <p className="text-xs text-zinc-600 leading-relaxed max-w-sm">
              Dedicated to holistic relaxation, therapeutic bodywork, facial rejuvenation,
              and bespoke aesthetic treatments crafted for deep serenity.
            </p>
            <div className="pt-0.5">
              <EcgPulseLine />
            </div>
          </div>

          {/* Direct Reservations Column */}
          <div
            className={`space-y-2 ${
              !hasStudioHours ? "md:justify-self-end md:min-w-[240px]" : ""
            }`}
          >
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#135061]">
              Direct Reservations
            </h4>
            <div className="space-y-2 text-xs text-zinc-700">
              <p className="font-bold text-zinc-900 uppercase tracking-wider">
                TOTUS MASSAGE THERAPIST
              </p>
              <a
                href="tel:0790118464"
                className="flex items-center gap-2 py-0.5 hover:text-[#135061] transition-colors font-medium"
                title="Call Totus Massage Therapist"
              >
                <Phone className="w-3.5 h-3.5 text-[#135061]" />
                079 011 8464 (Calls)
              </a>
              <a
                href="https://wa.me/27790118464"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 py-0.5 hover:text-[#135061] transition-colors font-medium"
                title="WhatsApp Totus Massage Therapist"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#135061]" />
                079 011 8464 (WhatsApp)
              </a>
            </div>
          </div>

          {/* Dynamic Studio Hours Column — Only rendered once Admin configures live locations */}
          {hasStudioHours && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#135061]">
                  Studio Hours &amp; Locations
                </h4>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Today
                </span>
              </div>

              <div className="space-y-2 text-xs text-zinc-700">
                {activeLocations.map((loc) => {
                  const availability = getLocationAvailabilityForDate(loc, todayIso);
                  return (
                    <div
                      key={loc.id}
                      className="flex items-start justify-between gap-3 border-b border-zinc-200/50 pb-1.5 last:border-b-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 font-bold text-zinc-900">
                          <MapPin className="w-3 h-3 text-[#135061] flex-shrink-0" />
                          <span className="truncate">{loc.name}</span>
                        </div>
                        {loc.address && (
                          <p className="text-[11px] text-zinc-500 truncate pl-[18px]">
                            {loc.address}
                          </p>
                        )}
                      </div>

                      <div className="flex-shrink-0 text-right">
                        {availability.isOpen ? (
                          <span className="font-bold text-[#135061] whitespace-nowrap">
                            {availability.openTime} – {availability.closeTime}
                          </span>
                        ) : (
                          <span className="font-semibold text-zinc-400 whitespace-nowrap">
                            Unavailable
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar: Centered Copyright with subtle Teal 'admin' link */}
        <div className="pt-3.5 flex flex-col sm:flex-row items-center justify-between gap-1.5 text-xs text-zinc-500">
          <div className="w-12 hidden sm:block" />
          <p className="text-center text-[11px] sm:text-xs text-zinc-600">
            Copyright © {new Date().getFullYear()} Totus Massage &amp; Aesthetics. All rights reserved.
          </p>
          <div>
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
