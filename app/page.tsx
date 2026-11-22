"use client";

/**
 * Totus Massage & Aesthetics — Public Storefront Homepage
 *
 * Orchestrates:
 * - Floating Glassmorphic Dynamic Island Navbar
 * - Seamless Borderless Welcome Hero with meditative breathing glow & bevel-up glass CTAs
 * - Custom quintic inertial scroll animation from `Explore Treatments` into the catalog
 * - Real-time Neon PostgreSQL Services/Products catalog & dynamic Location-aware Footer
 */

import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { ServiceCard, ServiceItem } from "@/components/ServiceCard";
import { ServiceDetailModal } from "@/components/ServiceDetailModal";
import { BookingModal } from "@/components/BookingModal";
import { SuccessModal } from "@/components/SuccessModal";
import { Footer } from "@/components/Footer";
import { LocationItem } from "@/lib/schedule";
import {
  Phone,
  MessageCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function HomePage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loadingServices, setLoadingServices] = useState<boolean>(true);
  const [selectedFilter, setSelectedFilter] = useState<string>("All");
  const [isServicesExpanded, setIsServicesExpanded] = useState<boolean>(false);
  const [arrivePulse, setArrivePulse] = useState<boolean>(false);

  // Modals state
  const [detailService, setDetailService] = useState<ServiceItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [bookingService, setBookingService] = useState<ServiceItem | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Load active Services/Products and active Studio Locations in parallel
  useEffect(() => {
    let mounted = true;
    async function loadStorefrontData() {
      try {
        setLoadingServices(true);
        const [servicesRes, locationsRes] = await Promise.all([
          fetch("/api/admin/services", { cache: "no-store" }),
          fetch("/api/admin/locations", { cache: "no-store" }),
        ]);

        const [servicesData, locationsData] = await Promise.all([
          servicesRes.json().catch(() => ({})),
          locationsRes.json().catch(() => ({})),
        ]);

        if (!mounted) return;

        if (Array.isArray(servicesData.services)) {
          setServices(
            servicesData.services.filter((s: ServiceItem) => s.isActive !== false)
          );
        }
        if (Array.isArray(locationsData.locations)) {
          setLocations(
            locationsData.locations.filter((l: LocationItem) => l.isActive !== false)
          );
        }
      } catch (err) {
        console.error("Failed to load storefront data:", err);
      } finally {
        if (mounted) setLoadingServices(false);
      }
    }
    loadStorefrontData();
    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Instant-response smooth scroll glide to the treatments section.
   * Uses `behavior: "instant"` per rAF tick so native CSS smooth-scroll never interferes,
   * beginning motion on the very first millisecond of click and easing organically to rest.
   */
  const handleExploreTreatments = useCallback(() => {
    const target = document.getElementById("services-section");
    if (!target) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const navClearance = 92;
    const startY = window.scrollY;
    const targetY = Math.max(
      0,
      target.getBoundingClientRect().top + window.scrollY - navClearance
    );

    if (prefersReduced || Math.abs(targetY - startY) < 4) {
      window.scrollTo({ top: targetY, behavior: "instant" as ScrollBehavior });
      return;
    }

    const distance = targetY - startY;
    const duration = Math.min(760, Math.max(520, Math.abs(distance) * 0.65));
    const startTime = performance.now();

    // Smooth ease-out-quart: immediate response on click, zero stall, silk-smooth deceleration
    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const nextY = startY + distance * easeOutQuart(progress);

      window.scrollTo({ top: nextY, behavior: "instant" as ScrollBehavior });

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setArrivePulse(false);
        window.requestAnimationFrame(() => setArrivePulse(true));
      }
    };

    window.requestAnimationFrame(step);
  }, []);

  const hasProducts = services.some((s) => s.itemType === "PRODUCT");
  const hasTreatments = services.some((s) => s.itemType !== "PRODUCT");

  const filterTabs = ["All"];
  if (hasTreatments) filterTabs.push("Services");
  if (hasProducts) filterTabs.push("Products");

  const filteredServices =
    selectedFilter === "All"
      ? services
      : selectedFilter === "Products"
      ? services.filter((s) => s.itemType === "PRODUCT")
      : services.filter((s) => s.itemType !== "PRODUCT");

  const displayedServices =
    selectedFilter === "All" && !isServicesExpanded
      ? filteredServices.slice(0, 6)
      : filteredServices;

  const handleOpenDetailModal = (service: ServiceItem) => {
    setDetailService(service);
    setIsDetailModalOpen(true);
  };

  const handleOpenBookingModal = (service?: ServiceItem) => {
    if (service) {
      setBookingService(service);
    } else if (services.length > 0) {
      setBookingService(services[0]);
    }
    setIsBookingModalOpen(true);
  };

  const handleBookingSuccess = (booking: any) => {
    setConfirmedBooking(booking);
    setIsSuccessModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-zinc-900 selection:bg-[#135061] selection:text-white">
      {/* Floating Dynamic Island Navbar */}
      <Navbar
        onOpenBooking={() => handleOpenBookingModal()}
        onExploreServices={handleExploreTreatments}
      />

      <main className="flex-1 bg-[#FAF9F6]">
        {/* Seamless Welcome Hero Section (zero bottom border or seam) */}
        <HeroSection
          onOpenBooking={() => handleOpenBookingModal()}
          onExploreServices={handleExploreTreatments}
        />

        {/* Services & Products Catalog Section — Seamless #FAF9F6 continuation */}
        <section
          id="services-section"
          aria-labelledby="services-heading"
          className="pt-10 pb-20 sm:pt-14 sm:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full"
        >
          {/* Section Title with synchronized meditative metallic-silver/white breathing glow */}
          <div
            className={`text-center max-w-2xl mx-auto mb-10 ${
              arrivePulse ? "animate-section-arrive" : ""
            }`}
          >
            <h2
              id="services-heading"
              className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight breathing-glow-text"
            >
              {hasProducts
                ? "Curated Treatments & Wellness Products"
                : "Curated Massage & Aesthetics Treatments"}
            </h2>
            <p className="text-sm text-zinc-600 mt-3 leading-relaxed">
              Reserve your massage or aesthetic session seamlessly online. Every appointment
              requires only a <strong className="text-[#135061]">R200 booking deposit</strong> to
              secure your slot, with the balance settled comfortably during your visit.
            </p>
          </div>

          {/* Filter Pills (Shown automatically when both Services and Products exist) */}
          {filterTabs.length > 2 && (
            <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
              {filterTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setSelectedFilter(tab);
                    setIsServicesExpanded(false);
                  }}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                    selectedFilter === tab
                      ? "bg-[#135061] text-white shadow-md"
                      : "bg-white text-zinc-600 border border-zinc-200 hover:border-[#135061] hover:text-[#135061]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}

          {/* Services Grid or Clean Empty State */}
          {loadingServices ? (
            <div className="py-16 text-center text-sm text-zinc-500 font-medium">
              Loading menu...
            </div>
          ) : services.length === 0 ? (
            <div className="max-w-xl mx-auto glass-card rounded-3xl p-7 sm:p-10 text-center">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <img
                  src="/totus-emblem.png"
                  alt="Totus Massage & Aesthetics"
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-xl font-extrabold text-[#135061]">
                Treatment Menu Being Curated
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 mt-2 leading-relaxed">
                Our signature massage, aesthetics treatments, and wellness products are currently
                being updated by our therapist. Please check back shortly or message us directly on
                WhatsApp for bespoke bookings.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
                <a
                  href="https://wa.me/27790118464"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-btn-teal w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-xs font-bold text-white"
                >
                  <MessageCircle className="w-4 h-4 text-white" />
                  <span>WhatsApp Therapist</span>
                </a>
                <a
                  href="tel:0790118464"
                  className="glass-btn-light w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-xs font-bold text-zinc-900"
                >
                  <Phone className="w-3.5 h-3.5 text-[#135061]" />
                  <span>Call 079 011 8464</span>
                </a>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {displayedServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onOpenDetails={handleOpenDetailModal}
                    onSelectForBooking={(s) => handleOpenBookingModal(s)}
                  />
                ))}
              </div>

              {/* Expand / Collapse Button */}
              {selectedFilter === "All" && filteredServices.length > 6 && (
                <div className="mt-10 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setIsServicesExpanded(!isServicesExpanded)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold text-zinc-900 bg-white border border-zinc-200 hover:border-[#135061] hover:bg-zinc-50 shadow-sm transition-all duration-200 active:scale-95 group"
                  >
                    <span>
                      {isServicesExpanded
                        ? "Show Less"
                        : `See All (${filteredServices.length})`}
                    </span>
                    {isServicesExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[#135061]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#135061]" />
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* Clean White Dynamic Footer (shows live studio hours only when configured in Admin) */}
      <Footer locations={locations} />

      {/* Modals */}
      <ServiceDetailModal
        service={detailService}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onBookNow={(s) => handleOpenBookingModal(s)}
      />

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        services={services}
        preselectedService={bookingService}
        onBookingSuccess={handleBookingSuccess}
      />

      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        booking={confirmedBooking}
      />
    </div>
  );
}
