"use client";

import React, { useState, useEffect, useRef } from "react";
import { ServiceItem } from "./ServiceCard";
import { validateSouthAfricanPhone, formatPhoneAsYouType } from "@/lib/phone";
import {
  FIXED_DEPOSIT_AMOUNT,
  CLINIC_OPTIONS,
  MOBILE_AREAS,
  validateFullName,
  validatePhysicalAddress,
  getGoogleMapsUrl,
} from "@/lib/validation";
import {
  LocationItem,
  getLocationAvailabilityForDate,
} from "@/lib/schedule";
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Navigation,
  Building2,
  Home,
  CheckCircle2,
} from "lucide-react";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: ServiceItem[];
  preselectedService?: ServiceItem | null;
  onBookingSuccess: (bookingData: any) => void;
}

interface AddressSuggestion {
  display_name: string;
  short_address: string;
  suburb?: string;
}

const DEFAULT_TIME_SLOTS = [
  "08:00 - 09:00",
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
  "12:00 - 13:00",
  "13:00 - 14:00",
  "14:00 - 15:00",
  "15:00 - 16:00",
  "16:00 - 17:00",
];

export function BookingModal({
  isOpen,
  onClose,
  services,
  preselectedService,
  onBookingSuccess,
}: BookingModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Dynamic Locations loaded from Admin Portal
  const [dbLocations, setDbLocations] = useState<LocationItem[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");

  // Form Fields
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [appointmentDate, setAppointmentDate] = useState<string>("");
  const [timeSlot, setTimeSlot] = useState<string>("09:00 - 10:00");
  const [patientName, setPatientName] = useState<string>("");
  const [patientPhone, setPatientPhone] = useState<string>("");
  const [patientEmail, setPatientEmail] = useState<string>("");

  // Fallback static Location Mode when no admin locations configured yet
  const [locationMode, setLocationMode] = useState<string>("nellmapius_clinic");
  const [area, setArea] = useState<string>("Pretoria East");
  const [patientAddress, setPatientAddress] = useState<string>(
    CLINIC_OPTIONS[0].defaultAddress
  );

  // Live Address Autocomplete State
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [isLocatingGps, setIsLocatingGps] = useState<boolean>(false);
  const [isAddressVerified, setIsAddressVerified] = useState<boolean>(true);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [medicalNotes, setMedicalNotes] = useState<string>("");
  const [paymentChoice, setPaymentChoice] = useState<"RETAINER_30" | "FULL_100">("RETAINER_30");

  // Errors & Shake state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shakingField, setShakingField] = useState<string | null>(null);
  const [isRedirectingPayFast, setIsRedirectingPayFast] = useState(false);

  // Fetch active admin-configured Locations whenever modal opens
  useEffect(() => {
    if (!isOpen) return;
    async function loadLocations() {
      try {
        const res = await fetch("/api/admin/locations", { cache: "no-store" });
        const data = await res.json();
        if (data.locations && Array.isArray(data.locations)) {
          const active = data.locations.filter((l: LocationItem) => l.isActive);
          setDbLocations(active);
          if (active.length > 0) {
            const first = active[0];
            setSelectedLocationId(first.id);
            setArea(first.name);
            if (first.type === "STUDIO") {
              setPatientAddress(first.address);
              setIsAddressVerified(true);
            } else {
              setPatientAddress("");
              setIsAddressVerified(false);
            }
          }
        }
      } catch {
        // Fallback smoothly
      }
    }
    loadLocations();
  }, [isOpen]);

  // Set default date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrow.getDate()).padStart(2, "0");
    setAppointmentDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  // Sync preselected service
  useEffect(() => {
    if (preselectedService) {
      setSelectedServiceId(preselectedService.id);
      if (preselectedService.itemType === "PRODUCT") {
        setPaymentChoice("FULL_100");
      } else {
        setPaymentChoice("RETAINER_30");
      }
    } else if (services.length > 0 && !selectedServiceId) {
      setSelectedServiceId(services[0].id);
    }
  }, [preselectedService, services]);

  // Reset loading state on step transition or modal open
  useEffect(() => {
    setIsRedirectingPayFast(false);
  }, [isOpen, step]);

  // Handle browser back-forward cache restoration
  useEffect(() => {
    const handlePageShow = () => {
      setIsRedirectingPayFast(false);
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  // Compute dynamic availability for chosen DB location + appointmentDate
  const activeDbLocation = dbLocations.find((l) => l.id === selectedLocationId) || null;
  const availability =
    activeDbLocation && appointmentDate
      ? getLocationAvailabilityForDate(activeDbLocation, appointmentDate)
      : {
          isOpen: true,
          openTime: "08:00",
          closeTime: "17:00",
          slots: DEFAULT_TIME_SLOTS,
          reason: undefined,
        };

  // Keep selected timeSlot synced with available dynamic slots
  useEffect(() => {
    if (availability.slots.length > 0 && !availability.slots.includes(timeSlot)) {
      setTimeSlot(availability.slots[0]);
    }
  }, [selectedLocationId, appointmentDate, availability.slots.join(",")]);

  // Handle dynamic DB location selection
  const handleSelectDbLocation = (loc: LocationItem) => {
    setSelectedLocationId(loc.id);
    setArea(loc.name);
    setErrors((prev) => ({ ...prev, patientAddress: "", date: "" }));
    if (loc.type === "STUDIO") {
      setPatientAddress(loc.address);
      setIsAddressVerified(true);
      setShowSuggestions(false);
    } else {
      setPatientAddress("");
      setIsAddressVerified(false);
    }
  };

  // Fallback Location Mode switches (when no DB locations exist yet)
  const handleSelectLocationMode = (modeId: string) => {
    setLocationMode(modeId);
    setErrors((prev) => ({ ...prev, patientAddress: "" }));
    const found = CLINIC_OPTIONS.find((c) => c.id === modeId);
    if (found && found.type === "CLINIC") {
      setArea(found.area);
      setPatientAddress(found.defaultAddress);
      setIsAddressVerified(true);
      setShowSuggestions(false);
    } else {
      setArea("Pretoria East");
      setPatientAddress("");
      setIsAddressVerified(false);
    }
  };

  // Search South African addresses for autocomplete
  const handleAddressInputChange = (val: string) => {
    setPatientAddress(val);
    setIsAddressVerified(false);

    if (errors.patientAddress) {
      const check = validatePhysicalAddress(val);
      if (check.isValid) {
        setErrors((prev) => ({ ...prev, patientAddress: "" }));
      }
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (val.trim().length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSearchingAddress(true);
        const query = `${val.trim()}, South Africa`;
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=za&q=${encodeURIComponent(query)}`;
        const res = await fetch(url, {
          headers: { "Accept-Language": "en" },
        });
        if (res.ok) {
          const data = await res.json();
          const mapped: AddressSuggestion[] = data.map((item: any) => {
            const addr = item.address || {};
            const road = addr.road || addr.pedestrian || addr.suburb || "";
            const houseNumber = addr.house_number ? `${addr.house_number} ` : "";
            const suburb = addr.suburb || addr.neighbourhood || addr.town || addr.city_district || area;
            const city = addr.city || addr.town || "Pretoria";
            const short = road
              ? `${houseNumber}${road}, ${suburb}, ${city}`
              : item.display_name.split(",").slice(0, 3).join(",").trim();
            return {
              display_name: item.display_name,
              short_address: short,
              suburb: addr.suburb || addr.neighbourhood,
            };
          });
          setAddressSuggestions(mapped);
          setShowSuggestions(mapped.length > 0);
        }
      } catch {
        // Fallback silently if offline
      } finally {
        setIsSearchingAddress(false);
      }
    }, 350);
  };

  // Use Browser GPS to auto-fill current street address
  const handleUseCurrentGps = () => {
    if (!navigator.geolocation) {
      triggerShake("patientAddress", "Geolocation is not supported by your browser.");
      return;
    }
    setIsLocatingGps(true);
    setErrors((prev) => ({ ...prev, patientAddress: "" }));
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { "Accept-Language": "en" } }
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const road = addr.road || addr.pedestrian || "";
            const houseNumber = addr.house_number ? `${addr.house_number} ` : "";
            const suburb = addr.suburb || addr.neighbourhood || addr.city_district || area;
            const formattedAddr = road
              ? `${houseNumber}${road}, ${suburb}`
              : data.display_name?.split(",").slice(0, 3).join(",").trim();

            if (formattedAddr) {
              setPatientAddress(formattedAddr);
              setIsAddressVerified(true);
              setShowSuggestions(false);
            }
          }
        } catch {
          triggerShake("patientAddress", "Could not resolve GPS coordinates. Please type your street address.");
        } finally {
          setIsLocatingGps(false);
        }
      },
      () => {
        setIsLocatingGps(false);
        triggerShake("patientAddress", "Location permission denied. Please type your street address below.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  if (!isOpen) return null;

  const currentService = services.find((s) => s.id === selectedServiceId) || services[0];
  const isProduct = currentService?.itemType === "PRODUCT";
  const totalAmount = currentService ? currentService.price : 450;
  const retainerAmount = isProduct ? totalAmount : Math.min(FIXED_DEPOSIT_AMOUNT, totalAmount);
  const amountToPayNow =
    isProduct || paymentChoice === "FULL_100" ? totalAmount : retainerAmount;
  const balanceDueLater =
    isProduct || paymentChoice === "FULL_100"
      ? 0
      : Math.max(0, totalAmount - retainerAmount);

  const isMobileLocationSelected = activeDbLocation
    ? activeDbLocation.type === "MOBILE"
    : locationMode === "mobile_visit";

  const triggerShake = (fieldName: string, message: string) => {
    setErrors((prev) => ({ ...prev, [fieldName]: message }));
    setShakingField(fieldName);
    setTimeout(() => {
      setShakingField(null);
    }, 500);
  };

  const handleStep1Next = () => {
    const newErrors: Record<string, string> = {};
    if (!selectedServiceId) newErrors.service = "Please choose a treatment or product";
    if (!appointmentDate) newErrors.date = "Please pick a date";
    if (!isProduct && activeDbLocation && !availability.isOpen) {
      newErrors.date =
        availability.reason || "This location is closed on the chosen date. Please pick another date or location.";
    }
    if (!isProduct && !timeSlot) newErrors.timeSlot = "Please choose an available time slot";

    if (Object.keys(newErrors).length > 0) {
      const firstKey = Object.keys(newErrors)[0];
      triggerShake(firstKey, newErrors[firstKey]);
      return;
    }
    setErrors({});
    setStep(2);
  };

  const handleStep2Next = () => {
    const newErrors: Record<string, string> = {};

    const nameCheck = validateFullName(patientName);
    if (!nameCheck.isValid) {
      newErrors.patientName =
        nameCheck.error || "Please enter both your first name and surname (e.g. Lerato Khumalo)";
    } else {
      setPatientName(nameCheck.formatted);
    }

    const phoneCheck = validateSouthAfricanPhone(patientPhone);
    if (!phoneCheck.isValid) {
      newErrors.patientPhone =
        phoneCheck.error || "Please enter a valid South African phone number (e.g. 079 011 8464)";
    } else {
      setPatientPhone(phoneCheck.formatted);
    }

    const trimmedEmail = patientEmail.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      newErrors.patientEmail = "Please enter a valid email address (e.g. client@example.co.za)";
    }

    if (isMobileLocationSelected || isProduct) {
      const addrCheck = validatePhysicalAddress(patientAddress);
      if (!addrCheck.isValid) {
        newErrors.patientAddress =
          addrCheck.error || "Please enter a real, verifiable street address.";
      } else {
        setPatientAddress(addrCheck.formatted);
      }
    }

    if (Object.keys(newErrors).length > 0) {
      const firstKey = Object.keys(newErrors)[0];
      triggerShake(firstKey, newErrors[firstKey]);
      return;
    }
    setErrors({});
    setStep(3);
  };

  const handleSubmitBooking = async () => {
    const nameCheck = validateFullName(patientName);
    if (!nameCheck.isValid) {
      triggerShake("patientName", nameCheck.error || "Please enter your full name and surname");
      setStep(2);
      return;
    }

    const phoneCheck = validateSouthAfricanPhone(patientPhone);
    if (!phoneCheck.isValid) {
      triggerShake("patientPhone", phoneCheck.error || "Invalid phone number format");
      setStep(2);
      return;
    }

    setIsRedirectingPayFast(true);
    setErrors((prev) => ({ ...prev, submit: "" }));
    try {
      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedServiceId,
          patientName: nameCheck.formatted,
          patientPhone: phoneCheck.formatted,
          patientEmail,
          patientAddress,
          area,
          appointmentDate,
          timeSlot: isProduct ? "Product Order" : timeSlot,
          paymentChoice: isProduct ? "FULL_100" : paymentChoice,
          medicalNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create booking");

      setTimeout(() => {
        setIsRedirectingPayFast(false);
      }, 8000);

      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.payfastUrl;

      Object.entries(data.payfastData).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = String(val);
          form.appendChild(input);
        }
      });

      document.body.appendChild(form);
      form.submit();
    } catch (err: any) {
      setIsRedirectingPayFast(false);
      triggerShake("submit", err.message || "Failed to process booking");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Frosted Dark Backdrop */}
      <div
        className="fixed inset-0 bg-zinc-950/45 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Glassmorphic Modal Dialog Card with subtle metallic silver/white rim glow */}
      <div className="relative w-full max-w-2xl max-h-[92dvh] flex flex-col glass-modal-card rounded-3xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-white/35 backdrop-blur-md text-zinc-900 p-5 sm:p-6 border-b border-zinc-200/60 relative flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close booking modal"
            className="absolute top-4 right-4 sm:top-5 sm:right-5 w-9 h-9 inline-flex items-center justify-center rounded-full text-zinc-500 hover:text-zinc-900 hover:bg-zinc-900/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#135061] block mb-1.5">
            Step {step} of 3
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 pr-10 leading-snug breathing-glow-text">
            {step === 1 && (isProduct ? "Select Product & Date" : "Select Treatment, Location & Time")}
            {step === 2 && "Your Contact Details"}
            {step === 3 && "Payment & Confirmation"}
          </h2>
          <p className="text-xs text-zinc-600 mt-1">
            Totus Massage &amp; Aesthetics — Massage Therapist (079 011 8464)
          </p>

          {/* Stepper Progress Bar */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className={`h-1.5 rounded-full transition-colors ${step >= 1 ? "bg-[#135061]" : "bg-zinc-300/60"}`} />
            <div className={`h-1.5 rounded-full transition-colors ${step >= 2 ? "bg-[#135061]" : "bg-zinc-300/60"}`} />
            <div className={`h-1.5 rounded-full transition-colors ${step >= 3 ? "bg-[#135061]" : "bg-zinc-300/60"}`} />
          </div>
        </div>

        {/* Modal Form Body (smoothly scrollable on mobile while keeping Header & Footer anchored) */}
        <div className="p-5 sm:p-6 flex-1 overflow-y-auto space-y-5">
          {/* STEP 1: SERVICE/PRODUCT, LOCATION & SCHEDULE */}
          {step === 1 && (
            <div className="space-y-5">
              {/* Service/Product Select */}
              <div className={`${shakingField === "service" ? "animate-shake" : ""}`}>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Treatment or Product *
                </label>
                {services.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-zinc-200 text-xs text-zinc-700">
                    <strong className="text-[#135061] block mb-1">
                      Menu Currently Being Updated
                    </strong>
                    No treatments or products are listed yet. As soon as our therapist publishes
                    items in the Admin Portal, they will appear here immediately.
                  </div>
                ) : (
                  <select
                    value={selectedServiceId}
                    onChange={(e) => {
                      setSelectedServiceId(e.target.value);
                      const picked = services.find((s) => s.id === e.target.value);
                      if (picked?.itemType === "PRODUCT") {
                        setPaymentChoice("FULL_100");
                      } else {
                        setPaymentChoice("RETAINER_30");
                      }
                    }}
                    className={`w-full p-3.5 rounded-xl border text-sm font-semibold bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#135061] ${
                      errors.service ? "border-red-500 bg-red-50" : "border-zinc-300"
                    }`}
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — R{s.price}{" "}
                        {s.itemType === "PRODUCT"
                          ? "(Product)"
                          : `(R${FIXED_DEPOSIT_AMOUNT} Deposit)`}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Dynamic Locations Selector (if Admin created Locations) */}
              {!isProduct && dbLocations.length > 0 && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                    Select Available Location *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {dbLocations.map((loc) => {
                      const isSel = selectedLocationId === loc.id;
                      return (
                        <button
                          key={loc.id}
                          type="button"
                          onClick={() => handleSelectDbLocation(loc)}
                          className={`p-3.5 rounded-xl border text-left transition-all ${
                            isSel
                              ? "border-[#135061] bg-[#F0F9FA] ring-1 ring-[#135061]"
                              : "border-zinc-200 bg-zinc-50 hover:border-zinc-300"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-900">
                              {loc.type === "STUDIO" ? (
                                <Building2 className="w-3.5 h-3.5 text-[#135061]" />
                              ) : (
                                <Home className="w-3.5 h-3.5 text-[#135061]" />
                              )}
                              {loc.name}
                            </span>
                            {isSel && <CheckCircle2 className="w-4 h-4 text-[#135061]" />}
                          </div>
                          <span className="text-[11px] text-zinc-500 block line-clamp-1">
                            {loc.address}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Date & Time Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={`${shakingField === "date" ? "animate-shake" : ""}`}>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    {isProduct ? "Preferred Collection / Delivery Date *" : "Appointment Date *"}
                  </label>
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => {
                      setAppointmentDate(e.target.value);
                      setErrors((prev) => ({ ...prev, date: "" }));
                    }}
                    className={`w-full p-3.5 rounded-xl border text-sm font-medium bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#135061] ${
                      errors.date || (!isProduct && !availability.isOpen)
                        ? "border-red-500 bg-red-50"
                        : "border-zinc-300"
                    }`}
                  />
                  {(errors.date || (!isProduct && !availability.isOpen)) && (
                    <p className="text-xs font-bold text-red-600 mt-1.5 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      {errors.date || availability.reason}
                    </p>
                  )}
                </div>

                {!isProduct && (
                  <div className={`${shakingField === "timeSlot" ? "animate-shake" : ""}`}>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                      Available Time Slot *
                    </label>
                    {!availability.isOpen || availability.slots.length === 0 ? (
                      <div className="w-full p-3.5 rounded-xl border border-zinc-200 bg-zinc-100 text-xs font-semibold text-zinc-500">
                        No open slots on this date
                      </div>
                    ) : (
                      <select
                        value={timeSlot}
                        onChange={(e) => setTimeSlot(e.target.value)}
                        className="w-full p-3.5 rounded-xl border border-zinc-300 text-sm font-medium bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#135061]"
                      >
                        {availability.slots.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                    )}
                    {availability.isOpen && activeDbLocation && (
                      <span className="text-[11px] text-[#135061] font-medium mt-1 block">
                        Hours for {activeDbLocation.name}: {availability.openTime} –{" "}
                        {availability.closeTime}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Price Summary Pill */}
              {currentService && (
                <div className="p-4 rounded-2xl bg-[#F0F9FA] border border-[#B2E2E6] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-zinc-500 block">
                      {isProduct ? "Selected Product:" : "Selected Treatment:"}
                    </span>
                    <strong className="text-sm text-zinc-900">{currentService.name}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-zinc-500 block">Total: R{currentService.price}</span>
                    {!isProduct && (
                      <span className="font-bold text-[#135061]">
                        Booking Deposit: R{retainerAmount}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: CLIENT CONTACT & LOCATION */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Full Name */}
              <div className={`${shakingField === "patientName" ? "animate-shake" : ""}`}>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Full Name (First Name &amp; Surname) *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="e.g. Lerato Khumalo"
                    value={patientName}
                    onChange={(e) => {
                      setPatientName(e.target.value);
                      if (errors.patientName) {
                        const check = validateFullName(e.target.value);
                        if (check.isValid) {
                          setErrors((prev) => ({ ...prev, patientName: "" }));
                        }
                      }
                    }}
                    onBlur={() => {
                      if (patientName.trim()) {
                        const check = validateFullName(patientName);
                        if (!check.isValid) {
                          setErrors((prev) => ({
                            ...prev,
                            patientName: check.error || "Please enter both first name and surname",
                          }));
                        } else {
                          setErrors((prev) => ({ ...prev, patientName: "" }));
                          setPatientName(check.formatted);
                        }
                      }
                    }}
                    className={`w-full pl-10 pr-3.5 py-3 rounded-xl border text-sm bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#135061] ${
                      errors.patientName ? "border-red-500 bg-red-50" : "border-zinc-300"
                    }`}
                  />
                </div>
                {errors.patientName && (
                  <p className="text-xs font-bold text-red-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> {errors.patientName}
                  </p>
                )}
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={`${shakingField === "patientPhone" ? "animate-shake" : ""}`}>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    WhatsApp / Cell Phone *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                    <input
                      type="tel"
                      placeholder="e.g. 079 011 8464"
                      value={patientPhone}
                      onChange={(e) => {
                        const formatted = formatPhoneAsYouType(e.target.value);
                        setPatientPhone(formatted);
                        if (errors.patientPhone) {
                          const check = validateSouthAfricanPhone(formatted);
                          if (check.isValid) {
                            setErrors((prev) => ({ ...prev, patientPhone: "" }));
                          }
                        }
                      }}
                      onBlur={() => {
                        if (patientPhone.trim()) {
                          const check = validateSouthAfricanPhone(patientPhone);
                          if (!check.isValid) {
                            setErrors((prev) => ({
                              ...prev,
                              patientPhone: check.error || "Invalid phone number",
                            }));
                          } else {
                            setErrors((prev) => ({ ...prev, patientPhone: "" }));
                            setPatientPhone(check.formatted);
                          }
                        }
                      }}
                      className={`w-full pl-10 pr-3.5 py-3 rounded-xl border text-sm bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#135061] ${
                        errors.patientPhone ? "border-red-500 bg-red-50" : "border-zinc-300"
                      }`}
                    />
                  </div>
                  {errors.patientPhone && (
                    <p className="text-xs font-bold text-red-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> {errors.patientPhone}
                    </p>
                  )}
                </div>

                <div className={`${shakingField === "patientEmail" ? "animate-shake" : ""}`}>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                    <input
                      type="email"
                      placeholder="e.g. client@example.co.za"
                      value={patientEmail}
                      onChange={(e) => setPatientEmail(e.target.value)}
                      className={`w-full pl-10 pr-3.5 py-3 rounded-xl border text-sm bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#135061] ${
                        errors.patientEmail ? "border-red-500 bg-red-50" : "border-zinc-300"
                      }`}
                    />
                  </div>
                  {errors.patientEmail && (
                    <p className="text-xs font-bold text-red-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> {errors.patientEmail}
                    </p>
                  )}
                </div>
              </div>

              {/* Location Confirmation or Mobile/Delivery Street Address */}
              {!activeDbLocation && !isProduct && (
                <div className="space-y-2.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700">
                    Session Location *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {CLINIC_OPTIONS.map((opt) => {
                      const isSel = locationMode === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectLocationMode(opt.id)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            isSel
                              ? "border-[#135061] bg-[#F0F9FA] ring-1 ring-[#135061]"
                              : "border-zinc-200 bg-zinc-50 hover:border-zinc-300"
                          }`}
                        >
                          <div className="text-xs font-bold text-zinc-900">
                            {opt.id === "nellmapius_clinic" && "Studio Option 1"}
                            {opt.id === "moreleta_clinic" && "Studio Option 2"}
                            {opt.id === "mobile_visit" && "Mobile Home Visit"}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {!isMobileLocationSelected && !isProduct ? (
                <div className="p-3.5 rounded-xl bg-[#F0F9FA] border border-[#B2E2E6] flex items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-[#135061] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[11px] font-bold text-[#135061] uppercase tracking-wider block">
                        Selected Studio ({area})
                      </span>
                      <p className="text-xs font-semibold text-zinc-900 mt-0.5">
                        {patientAddress}
                      </p>
                    </div>
                  </div>
                  <a
                    href={getGoogleMapsUrl(patientAddress, area)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#B2E2E6] text-[11px] font-bold text-[#135061] hover:bg-zinc-50 flex-shrink-0 shadow-sm"
                  >
                    <img src="/google-maps-icon.png" alt="Maps" className="w-3.5 h-3.5" />
                    <span>Maps</span>
                  </a>
                </div>
              ) : (
                <div
                  className={`relative ${
                    shakingField === "patientAddress" ? "animate-shake" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700">
                      {isProduct
                        ? "Delivery / Collection Street Address *"
                        : "Your Mobile Visit Street Address *"}
                    </label>
                    <button
                      type="button"
                      onClick={handleUseCurrentGps}
                      disabled={isLocatingGps}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#135061] hover:underline disabled:opacity-50"
                    >
                      {isLocatingGps ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Locating...</span>
                        </>
                      ) : (
                        <>
                          <Navigation className="w-3 h-3" />
                          <span>Use My GPS</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Start typing street number & street name..."
                      value={patientAddress}
                      onChange={(e) => handleAddressInputChange(e.target.value)}
                      onFocus={() => {
                        if (addressSuggestions.length > 0) setShowSuggestions(true);
                      }}
                      className={`w-full pl-10 pr-9 py-3 rounded-xl border text-sm bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#135061] ${
                        errors.patientAddress ? "border-red-500 bg-red-50" : "border-zinc-300"
                      }`}
                    />
                    {isSearchingAddress && (
                      <Loader2 className="absolute right-3 top-3.5 w-4 h-4 text-[#135061] animate-spin" />
                    )}
                  </div>

                  {showSuggestions && addressSuggestions.length > 0 && (
                    <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-zinc-100">
                      {addressSuggestions.map((sug, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setPatientAddress(sug.short_address);
                            setIsAddressVerified(true);
                            setShowSuggestions(false);
                            setErrors((prev) => ({ ...prev, patientAddress: "" }));
                          }}
                          className="w-full text-left px-3.5 py-2.5 hover:bg-[#F0F9FA] transition-colors flex items-start gap-2"
                        >
                          <MapPin className="w-3.5 h-3.5 text-[#135061] flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs font-bold text-zinc-900">
                              {sug.short_address}
                            </div>
                            <div className="text-[10px] text-zinc-500 line-clamp-1">
                              {sug.display_name}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {errors.patientAddress && (
                    <p className="text-xs font-bold text-red-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />{" "}
                      {errors.patientAddress}
                    </p>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Special Requests or Notes (Optional)
                </label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
                  <textarea
                    rows={2}
                    placeholder="Briefly note any preferences, focus areas, or delivery instructions..."
                    value={medicalNotes}
                    onChange={(e) => setMedicalNotes(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-[#135061]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW & PAYMENT SELECTION */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Summary Box */}
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2.5 text-xs">
                <div className="flex justify-between font-medium">
                  <span className="text-zinc-500">
                    {isProduct ? "Product:" : "Treatment:"}
                  </span>
                  <span className="font-bold text-zinc-900">{currentService?.name}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-zinc-500">Date &amp; Time:</span>
                  <span className="font-bold text-zinc-900">
                    {appointmentDate}
                    {!isProduct ? ` at ${timeSlot}` : ""}
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-zinc-500">Client:</span>
                  <span className="font-bold text-zinc-900">
                    {patientName} ({patientPhone})
                  </span>
                </div>
                <div className="flex justify-between items-start font-medium gap-4">
                  <span className="text-zinc-500 flex-shrink-0">Location:</span>
                  <div className="text-right">
                    <span className="font-bold text-zinc-900 block">{patientAddress}</span>
                    <a
                      href={getGoogleMapsUrl(patientAddress, area)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#135061] hover:underline mt-0.5"
                    >
                      <img src="/google-maps-icon.png" alt="Maps" className="w-3 h-3" />
                      <span>Open in Google Maps</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Payment Choice Options (Services allow R200 Deposit or Full 100%; Products are Full 100%) */}
              {!isProduct && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                    Select Payment Option *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => setPaymentChoice("RETAINER_30")}
                      className={`cursor-pointer p-4 rounded-2xl border-2 transition-all ${
                        paymentChoice === "RETAINER_30"
                          ? "border-[#135061] bg-[#F0F9FA] shadow-md"
                          : "border-zinc-200 hover:border-zinc-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#135061]">
                          R200 Booking Deposit
                        </span>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            paymentChoice === "RETAINER_30"
                              ? "border-[#135061] bg-[#135061]"
                              : "border-zinc-400"
                          }`}
                        >
                          {paymentChoice === "RETAINER_30" && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                      </div>
                      <div className="text-xl font-extrabold text-zinc-900">
                        R{retainerAmount.toFixed(2)}
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                        Secures your slot immediately. Balance of R
                        {Math.max(0, totalAmount - retainerAmount).toFixed(2)} payable at visit.
                      </p>
                    </div>

                    <div
                      onClick={() => setPaymentChoice("FULL_100")}
                      className={`cursor-pointer p-4 rounded-2xl border-2 transition-all ${
                        paymentChoice === "FULL_100"
                          ? "border-[#135061] bg-[#F0F9FA] shadow-md"
                          : "border-zinc-200 hover:border-zinc-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-800">
                          Full Settle Upfront (100%)
                        </span>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            paymentChoice === "FULL_100"
                              ? "border-[#135061] bg-[#135061]"
                              : "border-zinc-400"
                          }`}
                        >
                          {paymentChoice === "FULL_100" && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                      </div>
                      <div className="text-xl font-extrabold text-zinc-900">
                        R{totalAmount.toFixed(2)}
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                        Pay the complete fee now. Zero balance required at your session.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Total Breakdown */}
              <div className="bg-[#135061] text-white rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-cyan-100/80 uppercase tracking-widest block">
                    Amount to process via PayFast:
                  </span>
                  <span className="text-2xl font-black text-white">
                    R{amountToPayNow.toFixed(2)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-white font-bold block">
                    {balanceDueLater === 0
                      ? "Fully Settled"
                      : `Balance Due at Visit: R${balanceDueLater.toFixed(2)}`}
                  </span>
                  <span className="text-[10px] text-cyan-100/80">Encrypted via PayFast ZA</span>
                </div>
              </div>

              {errors.submit && (
                <p className="text-xs font-bold text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> {errors.submit}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 sm:p-6 bg-white/40 backdrop-blur-md border-t border-zinc-200/60 flex items-center justify-between gap-3 flex-shrink-0">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => {
                setIsRedirectingPayFast(false);
                setStep((prev) => (prev - 1) as any);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold text-zinc-700 hover:bg-zinc-900/5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-full text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-900/5 transition-colors"
            >
              Cancel
            </button>
          )}

          {step === 1 && (
            <button
              type="button"
              onClick={handleStep1Next}
              disabled={services.length === 0 || (!isProduct && !availability.isOpen)}
              className="glass-btn-teal inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-xs font-bold text-white group"
            >
              <span>Continue to Details</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 ease-out group-hover:translate-x-0.5" />
            </button>
          )}

          {step === 2 && (
            <button
              type="button"
              onClick={handleStep2Next}
              className="glass-btn-teal inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-xs font-bold text-white group"
            >
              <span>Review &amp; Payment</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 ease-out group-hover:translate-x-0.5" />
            </button>
          )}

          {step === 3 && (
            <button
              type="button"
              onClick={handleSubmitBooking}
              disabled={isRedirectingPayFast}
              className="glass-btn-teal inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3.5 rounded-full text-xs font-bold text-white"
            >
              {isRedirectingPayFast ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting PayFast...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Pay with PayFast (R{amountToPayNow.toFixed(2)})</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
