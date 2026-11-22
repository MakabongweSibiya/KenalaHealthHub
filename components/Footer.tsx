"use client";

/**
 * Totus Massage & Aesthetics — Dynamic Location-Aware Compact Footer
 *
 * Truthful hours guarantee:
 * - Zero hardcoded/fabricated studio hours are ever displayed.
 * - When the admin has not yet configured any active locations, the Studio Hours column is omitted.
 * - As soon as locations and operating hours (or daily overrides) are added in the Admin Portal,
 *   each studio's real-time South African daily hours — or `Unavailable` if closed today — render live.
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
    // Only fetch independently when parent did not pass locations
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
    <footer className="bg-white text-zinc-900 pt-6 pb-3.5 border-t border-zinc-200/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`grid grid-cols-1 ${
            hasStudioHours ? "md:grid-cols-3" : "md:grid-cols-2"
          } gap-6 pb-5 border-b border-zinc-200/80`}
        >
          {/* Brand Column */}
          <div className="space-y-1.5">
            <BrandLogo size="sm" />
            <p className="text-xs text-zinc-600 leading-relaxed max-w-sm">
              Dedicated to holistic relaxation, therapeutic bodywork, facial rejuvenation,
              and bespoke aesthetic treatments crafted for deep serenity.
            </p>
            <div className="pt-0.5">
              <EcgPulseLine />
            </div>
          </div>

          {/* Direct Reservations Column */}
          <div className={`space-y-1.5 ${!hasStudioHours ? "md:justify-self-end md:min-w-[240px]" : ""}`}>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#135061]">
              Direct Reservations
            </h4>
            <div className="space-y-1.5 text-xs text-zinc-700">
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
                      className="flex items-start justify-between gap-3 border-b border-zinc-100 pb-1.5 last:border-b-0 last:pb-0"
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
