"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { ServiceCard, ServiceItem } from "@/components/ServiceCard";
import { ServiceDetailModal } from "@/components/ServiceDetailModal";
import { BookingModal } from "@/components/BookingModal";
import { SuccessModal } from "@/components/SuccessModal";
import { Footer } from "@/components/Footer";
import {
  Phone,
  MessageCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function HomePage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loadingServices, setLoadingServices] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isServicesExpanded, setIsServicesExpanded] = useState<boolean>(false);

  // Modals state
  const [detailService, setDetailService] = useState<ServiceItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [bookingService, setBookingService] = useState<ServiceItem | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Fetch services on load
  useEffect(() => {
    async function loadServices() {
      try {
        setLoadingServices(true);
        const res = await fetch("/api/admin/services");
        const data = await res.json();
        if (data.services) {
          setServices(data.services.filter((s: ServiceItem) => s.isActive !== false));
        }
      } catch (err) {
        console.error("Failed to load services:", err);
      } finally {
        setLoadingServices(false);
      }
    }
    loadServices();
  }, []);

  // Filter services by category
  const categories = ["All", ...Array.from(new Set(services.map((s) => s.category)))];
  const filteredServices =
    selectedCategory === "All"
      ? services
      : services.filter((s) => s.category === selectedCategory);

  // When 'All' is active, show only top 6 unless expanded
  const displayedServices =
    selectedCategory === "All" && !isServicesExpanded
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
      <Navbar onOpenBooking={() => handleOpenBookingModal()} />

      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection
          onOpenBooking={() => handleOpenBookingModal()}
          onExploreServices={() => {
            const el = document.getElementById("services-section");
            el?.scrollIntoView({ behavior: "smooth" });
          }}
        />

        {/* Services Catalog Section */}
        <section
          id="services-section"
          aria-labelledby="services-heading"
          className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full"
        >
          {/* Section Title (Clean, No Tacky Tag Above) */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2
              id="services-heading"
              className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight"
            >
              Curated Massage &amp; Aesthetics Treatments
            </h2>
            <p className="text-sm text-zinc-600 mt-3 leading-relaxed">
              Reserve your massage or aesthetic session seamlessly online. Every appointment
              requires only a <strong className="text-[#135061]">R200 booking deposit</strong> to
              secure your slot, with the balance settled comfortably during your visit.
            </p>
          </div>

          {/* Category Filters (Only show when services exist) */}
          {services.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setIsServicesExpanded(false);
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    selectedCategory === cat
                      ? "bg-[#135061] text-white shadow-md"
                      : "bg-white text-zinc-600 border border-zinc-200 hover:border-[#135061] hover:text-[#135061]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Services Grid or Clean Empty State */}
          {loadingServices ? (
            <div className="py-16 text-center text-sm text-zinc-500 font-medium">
              Loading treatment menu...
            </div>
          ) : services.length === 0 ? (
            <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 sm:p-10 border border-zinc-200/80 shadow-sm text-center">
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
                Our signature massage and aesthetics treatments are currently being updated by our
                therapist. Please check back shortly or contact our massage therapist directly on
                WhatsApp for bespoke bookings.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                <a
                  href="https://wa.me/27790118464"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold text-white bg-[#135061] hover:bg-[#007C89] transition-all shadow-sm"
                >
                  <MessageCircle className="w-4 h-4 text-white" />
                  <span>WhatsApp Therapist</span>
                </a>
                <a
                  href="tel:0790118464"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-xs font-bold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 transition-all"
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

              {/* Expand / Collapse Button (Top 6 toggle on 'All') */}
              {selectedCategory === "All" && filteredServices.length > 6 && (
                <div className="mt-10 flex justify-center">
                  <button
                    onClick={() => setIsServicesExpanded(!isServicesExpanded)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold text-zinc-900 bg-white border border-zinc-200 hover:border-[#135061] hover:bg-zinc-50 shadow-sm transition-all duration-200 active:scale-95 group"
                  >
                    <span>
                      {isServicesExpanded
                        ? "Show Less"
                        : `See All (${filteredServices.length})`}
                    </span>
                    {isServicesExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[#135061] transition-transform group-hover:-translate-y-0.5" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#135061] transition-transform group-hover:translate-y-0.5" />
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* Feature Sanctuary Banner / Why Totus Massage & Aesthetics */}
        <section className="py-16 bg-white border-y border-zinc-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-[#111111] rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden border border-zinc-800">
              {/* Ambient Teal & Subtle Lotus Glow */}
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-[#E86689]/15 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-[#00A3AD]/15 blur-3xl pointer-events-none" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                <div className="lg:col-span-8">
                  <span className="text-xs font-extrabold tracking-widest text-[#00A3AD] uppercase">
                    TOTUS • MASSAGE &amp; AESTHETICS
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold mt-2 text-white">
                    Where Deep Relaxation Meets Radiant Aesthetics
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-300 mt-3 max-w-2xl leading-relaxed">
                    Every session at Totus is tailored around your body, skin goals, and personal
                    comfort. Whether you visit our tranquil studio or book a private mobile session,
                    experience unhurried luxury and restorative care.
                  </p>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-3 justify-center items-start lg:items-end">
                  <button
                    onClick={() => handleOpenBookingModal()}
                    className="w-full sm:w-56 inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-bold text-sm text-white bg-[#135061] hover:bg-[#007C89] shadow-lg transition-all active:scale-95"
                  >
                    <Calendar className="w-4 h-4 text-white" />
                    <span>Reserve Your Session</span>
                  </button>

                  <a
                    href="https://wa.me/27790118464"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-56 inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-semibold text-xs text-white bg-zinc-800 hover:bg-zinc-700 transition-colors border border-zinc-700"
                  >
                    <MessageCircle className="w-4 h-4 text-[#00A3AD]" />
                    <span>WhatsApp Therapist</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />

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
