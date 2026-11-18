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

export function BookingModal({
  isOpen,
  onClose,
  services,
  preselectedService,
  onBookingSuccess,
}: BookingModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [appointmentDate, setAppointmentDate] = useState<string>("");
  const [timeSlot, setTimeSlot] = useState<string>("09:00 - 09:45");
  const [patientName, setPatientName] = useState<string>("");
  const [patientPhone, setPatientPhone] = useState<string>("");
  const [patientEmail, setPatientEmail] = useState<string>("");

  // Location Mode: "nellmapius_clinic" | "moreleta_clinic" | "mobile_visit"
  const [locationMode, setLocationMode] = useState<string>("nellmapius_clinic");
  const [area, setArea] = useState<string>("Nellmapius");
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

  // Time slots available (08:00 - 17:00)
  const timeSlots = [
    "08:00 - 08:45",
    "09:00 - 09:45",
    "10:00 - 10:45",
    "11:00 - 11:45",
    "12:00 - 12:45",
    "13:00 - 13:45",
    "14:00 - 14:45",
    "15:00 - 15:45",
    "16:00 - 16:45",
  ];

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
    } else if (services.length > 0 && !selectedServiceId) {
      setSelectedServiceId(services[0].id);
    }
  }, [preselectedService, services]);

  // Reset loading state on step transition or modal open
  useEffect(() => {
    setIsRedirectingPayFast(false);
  }, [isOpen, step]);

  // Handle browser back-forward navigation cache (bfcache) restoration
  useEffect(() => {
    const handlePageShow = () => {
      setIsRedirectingPayFast(false);
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  // Handle Location Mode switches
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
      setArea("Nellmapius");
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
        const query = `${val.trim()}, ${area !== "Pretoria East (Other)" ? area + ", " : ""}Pretoria, South Africa`;
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
      } catch (e) {
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
              ? `${houseNumber}${road}, ${suburb}, Pretoria`
              : data.display_name?.split(",").slice(0, 3).join(",").trim();

            if (formattedAddr) {
              setPatientAddress(formattedAddr);
              setIsAddressVerified(true);
              setShowSuggestions(false);
            }
          }
        } catch (e) {
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
  const totalAmount = currentService ? currentService.price : 450;
  const retainerAmount = FIXED_DEPOSIT_AMOUNT; // Fixed R200 Deposit across all services
  const amountToPayNow = paymentChoice === "FULL_100" ? totalAmount : retainerAmount;
  const balanceDueLater = paymentChoice === "FULL_100" ? 0 : Math.max(0, totalAmount - retainerAmount);

  const triggerShake = (fieldName: string, message: string) => {
    setErrors((prev) => ({ ...prev, [fieldName]: message }));
    setShakingField(fieldName);
    setTimeout(() => {
      setShakingField(null);
    }, 500);
  };

  const handleStep1Next = () => {
    const newErrors: Record<string, string> = {};
    if (!selectedServiceId) newErrors.service = "Please choose a clinical service";
    if (!appointmentDate) newErrors.date = "Please pick an appointment date";
    if (!timeSlot) newErrors.timeSlot = "Please choose a time slot";

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

    // 1. Patient Full Name (First Name & Surname) Validation
    const nameCheck = validateFullName(patientName);
    if (!nameCheck.isValid) {
      newErrors.patientName =
        nameCheck.error || "Please enter both your first name and surname (e.g. Lerato Khumalo)";
    } else {
      setPatientName(nameCheck.formatted);
    }

    // 2. South African Phone Validation
    const phoneCheck = validateSouthAfricanPhone(patientPhone);
    if (!phoneCheck.isValid) {
      newErrors.patientPhone =
        phoneCheck.error || "Please enter a valid South African phone number (e.g. 079 011 8464)";
    } else {
      setPatientPhone(phoneCheck.formatted);
    }

    // 3. Email Validation
    const trimmedEmail = patientEmail.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      newErrors.patientEmail = "Please enter a valid email address (e.g. client@example.co.za)";
    }

    // 4. Location / Physical Address Validation
    if (locationMode === "mobile_visit") {
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
    // Re-verify name & phone before initiating PayFast
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
          timeSlot,
          paymentChoice,
          medicalNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create booking");

      // Auto safety release after 8 seconds in case browser stays on page
      setTimeout(() => {
        setIsRedirectingPayFast(false);
      }, 8000);

      // Redirect user to PayFast checkout
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
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header (Teal & Lotus Pink Accent) */}
        <div className="bg-[#111111] text-white p-6 border-b-4 border-[#E86689] relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <span className="text-[10px] font-bold uppercase tracking-widest text-[#F6A5BA] px-2.5 py-0.5 rounded bg-[#E86689]/20 border border-[#E86689]/40 inline-block mb-1">
            Step {step} of 3
          </span>
          <h2 className="text-2xl font-extrabold text-white">
            {step === 1 && "Select Treatment & Schedule"}
            {step === 2 && "Client Details & Location"}
            {step === 3 && "Payment & Slot Confirmation"}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Totus Massage &amp; Aesthetics — Concierge (079 011 8464)
          </p>

          {/* Stepper Progress Bar */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className={`h-1.5 rounded-full ${step >= 1 ? "bg-[#007C89]" : "bg-zinc-700"}`} />
            <div className={`h-1.5 rounded-full ${step >= 2 ? "bg-[#E86689]" : "bg-zinc-700"}`} />
            <div className={`h-1.5 rounded-full ${step >= 3 ? "bg-[#007C89]" : "bg-zinc-700"}`} />
          </div>
        </div>

        {/* Modal Form Body */}
        <div className="p-6 max-h-[68vh] overflow-y-auto space-y-6">
          {/* STEP 1: SERVICE & SCHEDULE */}
          {step === 1 && (
            <div className="space-y-5">
              {/* Service Select */}
              <div className={`${shakingField === "service" ? "animate-shake" : ""}`}>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Massage or Aesthetic Treatment *
                </label>
                {services.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-[#FDF2F5] border border-[#F9D5E0] text-xs text-zinc-700">
                    <strong className="text-[#135061] block mb-1">
                      Treatment Menu Being Updated
                    </strong>
                    No treatments are currently listed for online booking. As soon as treatments are added in the Admin Portal, they will appear here automatically.
                  </div>
                ) : (
                  <select
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    className={`w-full p-3.5 rounded-xl border text-sm font-semibold bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#007C89] ${
                      errors.service ? "border-red-500 bg-red-50" : "border-zinc-300"
                    }`}
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — Full Fee: R{s.price} (R{FIXED_DEPOSIT_AMOUNT} Deposit)
                      </option>
                    ))}
                  </select>
                )}
                {errors.service && (
                  <p className="text-xs font-bold text-red-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> {errors.service}
                  </p>
                )}
              </div>

              {/* Date & Time Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Date Picker */}
                <div className={`${shakingField === "date" ? "animate-shake" : ""}`}>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Appointment Date *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      className={`w-full p-3.5 rounded-xl border text-sm font-medium bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#007C89] ${
                        errors.date ? "border-red-500 bg-red-50" : "border-zinc-300"
                      }`}
                    />
                  </div>
                  {errors.date && (
                    <p className="text-xs font-bold text-red-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> {errors.date}
                    </p>
                  )}
                </div>

                {/* Time Slot Picker */}
                <div className={`${shakingField === "timeSlot" ? "animate-shake" : ""}`}>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Preferred Time Slot *
                  </label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className={`w-full p-3.5 rounded-xl border text-sm font-medium bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#007C89] ${
                      errors.timeSlot ? "border-red-500 bg-red-50" : "border-zinc-300"
                    }`}
                  >
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Service Price Summary Pill */}
              {currentService && (
                <div className="p-4 rounded-2xl bg-[#F0F9FA] border border-[#B2E2E6] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-zinc-500 block">Selected Consultation:</span>
                    <strong className="text-sm text-zinc-900">{currentService.name}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-zinc-500 block">Total Fee: R{currentService.price}</span>
                    <span className="font-bold text-[#007C89]">
                      Booking Deposit: R{retainerAmount}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: PATIENT CONTACT & LOCATION */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Full Name (Name & Surname) */}
              <div className={`${shakingField === "patientName" ? "animate-shake" : ""}`}>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Full Name (First Name & Surname) *
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
                    className={`w-full pl-10 pr-3.5 py-3 rounded-xl border text-sm bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#007C89] ${
                      errors.patientName ? "border-red-500 bg-red-50" : "border-zinc-300"
                    }`}
                  />
                </div>
                {errors.patientName ? (
                  <p className="text-xs font-bold text-red-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> {errors.patientName}
                  </p>
                ) : (
                  <span className="text-[11px] text-zinc-500 mt-1 block">
                    Enter both your first name and surname as on your ID
                  </span>
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
                        const val = e.target.value;
                        const formatted = formatPhoneAsYouType(val);
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
                      className={`w-full pl-10 pr-3.5 py-3 rounded-xl border text-sm bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#007C89] ${
                        errors.patientPhone ? "border-red-500 bg-red-50" : "border-zinc-300"
                      }`}
                    />
                  </div>
                  {errors.patientPhone ? (
                    <p className="text-xs font-bold text-red-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> {errors.patientPhone}
                    </p>
                  ) : (
                    <span className="text-[11px] text-zinc-500 mt-1 block">
                      Standard 10-digit South African number (e.g. 079 011 8464)
                    </span>
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
                      className={`w-full pl-10 pr-3.5 py-3 rounded-xl border text-sm bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#007C89] ${
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

              {/* Consultation Location Mode Selector */}
              <div className="space-y-3 pt-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700">
                  Select Clinic or Mobile Home Visit *
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {CLINIC_OPTIONS.map((opt) => {
                    const isSelected = locationMode === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectLocationMode(opt.id)}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? "border-[#007C89] bg-[#F0F9FA] ring-1 ring-[#007C89]"
                            : "border-zinc-200 bg-zinc-50 hover:border-zinc-300"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          {opt.type === "CLINIC" ? (
                            <Building2
                              className={`w-4 h-4 ${
                                isSelected ? "text-[#007C89]" : "text-zinc-400"
                              }`}
                            />
                          ) : (
                            <Home
                              className={`w-4 h-4 ${
                                isSelected ? "text-[#007C89]" : "text-zinc-400"
                              }`}
                            />
                          )}
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-[#007C89]" />
                          )}
                        </div>
                        <div className="text-xs font-bold text-zinc-900 leading-tight">
                          {opt.id === "nellmapius_clinic" && "Nellmapius Clinic"}
                          {opt.id === "moreleta_clinic" && "Moreleta Park Clinic"}
                          {opt.id === "mobile_visit" && "Mobile Home Visit"}
                        </div>
                        <span className="text-[10px] text-zinc-500 mt-0.5 block">
                          {opt.type === "CLINIC" ? "In-Clinic Consultation" : "Nurse Comes to You"}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* If In-Clinic is chosen: Show Verified Clinic Location Card + Google Maps Link */}
                {locationMode !== "mobile_visit" ? (
                  <div className="p-3.5 rounded-xl bg-[#F0F9FA] border border-[#B2E2E6] flex items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-[#007C89] flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[11px] font-bold text-[#005C66] uppercase tracking-wider block">
                          Verified Clinic Location ({area})
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
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-[#B2E2E6] text-[11px] font-bold text-[#007C89] hover:bg-zinc-50 flex-shrink-0 shadow-sm"
                    >
                      <span>Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : (
                  /* If Mobile Home Visit is chosen: Show Suburb + Verified Street Address Autocomplete */
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                        Suburb / Area *
                      </label>
                      <select
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        className="w-full p-3 rounded-xl border border-zinc-300 text-sm bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-[#007C89]"
                      >
                        {MOBILE_AREAS.map((suburb) => (
                          <option key={suburb} value={suburb}>
                            {suburb}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div
                      className={`sm:col-span-2 relative ${
                        shakingField === "patientAddress" ? "animate-shake" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700">
                          Verified Street Address (Google Maps) *
                        </label>
                        <button
                          type="button"
                          onClick={handleUseCurrentGps}
                          disabled={isLocatingGps}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#007C89] hover:underline disabled:opacity-50"
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
                          placeholder="Start typing street number & name (e.g. 14 Alwyn Street)"
                          value={patientAddress}
                          onChange={(e) => handleAddressInputChange(e.target.value)}
                          onFocus={() => {
                            if (addressSuggestions.length > 0) setShowSuggestions(true);
                          }}
                          className={`w-full pl-10 pr-9 py-3 rounded-xl border text-sm bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#007C89] ${
                            errors.patientAddress ? "border-red-500 bg-red-50" : "border-zinc-300"
                          }`}
                        />
                        {isSearchingAddress && (
                          <Loader2 className="absolute right-3 top-3.5 w-4 h-4 text-[#007C89] animate-spin" />
                        )}
                      </div>

                      {/* Autocomplete Suggestions Dropdown */}
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
                              <MapPin className="w-3.5 h-3.5 text-[#007C89] flex-shrink-0 mt-0.5" />
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

                      {errors.patientAddress ? (
                        <p className="text-xs font-bold text-red-600 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />{" "}
                          {errors.patientAddress}
                        </p>
                      ) : (
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[11px] text-zinc-500">
                            {isAddressVerified
                              ? "✓ Verified location pin ready"
                              : "Enter street number & street name or pick from suggestions"}
                          </span>
                          {patientAddress.trim().length >= 5 && (
                            <a
                              href={getGoogleMapsUrl(patientAddress, area)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#007C89] hover:underline"
                            >
                              <span>Verify on Google Maps</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Special Requests / Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Special Requests, Pressure Preference or Notes (Optional)
                </label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
                  <textarea
                    rows={2}
                    placeholder="Briefly note any focus areas, skin sensitivities, or special requests..."
                    value={medicalNotes}
                    onChange={(e) => setMedicalNotes(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-[#007C89]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW & PAYMENT SELECTION */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Appointment Summary Box */}
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2.5 text-xs">
                <div className="flex justify-between font-medium">
                  <span className="text-zinc-500">Service:</span>
                  <span className="font-bold text-zinc-900">{currentService?.name}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-zinc-500">Date & Slot:</span>
                  <span className="font-bold text-zinc-900">
                    {appointmentDate} at {timeSlot}
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-zinc-500">Patient:</span>
                  <span className="font-bold text-zinc-900">
                    {patientName} ({patientPhone})
                  </span>
                </div>
                <div className="flex justify-between items-start font-medium gap-4">
                  <span className="text-zinc-500 flex-shrink-0">Location:</span>
                  <div className="text-right">
                    <span className="font-bold text-zinc-900 block">
                      {patientAddress}
                    </span>
                    <a
                      href={getGoogleMapsUrl(patientAddress, area)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#007C89] hover:underline mt-0.5"
                    >
                      <MapPin className="w-3 h-3" />
                      <span>Open in Google Maps ({area})</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Payment Choice Options (Fixed R200 Deposit vs 100% Full Payment) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                  Select Payment Option *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option 1: R200 Fixed Booking Deposit */}
                  <div
                    onClick={() => setPaymentChoice("RETAINER_30")}
                    className={`cursor-pointer p-4 rounded-2xl border-2 transition-all ${
                      paymentChoice === "RETAINER_30"
                        ? "border-[#007C89] bg-[#F0F9FA] shadow-md"
                        : "border-zinc-200 hover:border-zinc-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#007C89]">
                        R200 Booking Deposit
                      </span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          paymentChoice === "RETAINER_30"
                            ? "border-[#007C89] bg-[#007C89]"
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
                      Secures your appointment slot immediately. Balance of R
                      {Math.max(0, totalAmount - retainerAmount).toFixed(2)} payable at visit.
                    </p>
                  </div>

                  {/* Option 2: 100% Full Payment */}
                  <div
                    onClick={() => setPaymentChoice("FULL_100")}
                    className={`cursor-pointer p-4 rounded-2xl border-2 transition-all ${
                      paymentChoice === "FULL_100"
                        ? "border-[#007C89] bg-[#F0F9FA] shadow-md"
                        : "border-zinc-200 hover:border-zinc-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                        Full Settle Upfront (100%)
                      </span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          paymentChoice === "FULL_100"
                            ? "border-[#007C89] bg-[#007C89]"
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
                      Pay the complete consultation fee now. Zero payment required during your appointment.
                    </p>
                  </div>
                </div>
              </div>

              {/* PayFast Trust Badge & Breakdown */}
              <div className="bg-zinc-900 text-white rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-widest block">
                    Amount to process via PayFast:
                  </span>
                  <span className="text-2xl font-black text-white">
                    R{amountToPayNow.toFixed(2)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-emerald-400 font-bold block">
                    {paymentChoice === "FULL_100"
                      ? "Fully Settled"
                      : `Balance Due on Visit: R${balanceDueLater.toFixed(2)}`}
                  </span>
                  <span className="text-[10px] text-zinc-400">Encrypted via PayFast ZA</span>
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
        <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              onClick={() => {
                setIsRedirectingPayFast(false);
                setStep((prev) => (prev - 1) as any);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-500 hover:text-zinc-800 transition-colors"
            >
              Cancel
            </button>
          )}

          {step === 1 && (
            <button
              onClick={handleStep1Next}
              disabled={services.length === 0}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold text-white bg-gradient-to-r from-[#135061] to-[#007C89] hover:from-[#0E3D4B] hover:to-[#005C66] shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Continue to Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {step === 2 && (
            <button
              onClick={handleStep2Next}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold text-white bg-[#007C89] hover:bg-[#005C66] shadow-md transition-all active:scale-95"
            >
              <span>Review & Payment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {step === 3 && (
            <button
              type="button"
              onClick={handleSubmitBooking}
              disabled={isRedirectingPayFast}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-xs font-bold text-white bg-[#007C89] hover:bg-[#005C66] shadow-lg shadow-cyan-900/30 transition-all active:scale-95 disabled:opacity-75"
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
