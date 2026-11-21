"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import {
  LocationItem,
  WeeklyHoursMap,
  DEFAULT_WEEKLY_HOURS,
  DAY_KEYS,
  DAY_LABELS,
} from "@/lib/schedule";
import {
  Calendar,
  Clock,
  Search,
  LogOut,
  MessageCircle,
  MapPin,
  Edit2,
  Trash2,
  Plus,
  X,
  ExternalLink,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  Building2,
  Home,
  Upload,
  Wallet,
  CalendarClock,
  Power,
  Loader2,
  AlertCircle,
} from "lucide-react";

type DashboardTab = "services" | "bookings" | "locations";

export default function AdminDashboardPage() {
  const router = useRouter();

  // Active Tab controlled by Floating Dynamic Island Admin Navbar
  const [activeTab, setActiveTab] = useState<DashboardTab>("services");

  // Core Data
  const [adminEmail, setAdminEmail] = useState<string>("totusmassages@gmail.com");
  const [metrics, setMetrics] = useState<any>({
    totalBookings: 0,
    confirmedBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalRevenueCollected: 0,
    totalRetainersCollected: 0,
    totalBalancesCollected: 0,
    totalPendingBalance: 0,
  });
  const [bookings, setBookings] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [serviceTypeFilter, setServiceTypeFilter] = useState<"ALL" | "SERVICE" | "PRODUCT">("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Universal Confirmation Modal State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message?: string;
    onAfterClose?: () => void;
  }>({ isOpen: false, title: "" });

  const showConfirmation = useCallback(
    (title: string, message?: string, onAfterClose?: () => void) => {
      setConfirmDialog({ isOpen: true, title, message, onAfterClose });
    },
    []
  );

  // --- SERVICE / PRODUCT MODAL STATE ---
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [itemType, setItemType] = useState<"SERVICE" | "PRODUCT">("SERVICE");
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemCategory, setItemCategory] = useState("");
  const [itemDuration, setItemDuration] = useState("60");
  const [itemImageUrl, setItemImageUrl] = useState("");
  const [itemPrepNotes, setItemPrepNotes] = useState("");
  const [itemActive, setItemActive] = useState(true);
  const [itemError, setItemError] = useState<string | null>(null);
  const [savingItem, setSavingItem] = useState(false);

  // --- BOOKING MANAGEMENT MODAL STATE ---
  const [viewBooking, setViewBooking] = useState<any | null>(null);

  // --- LOCATION & HOURS MODAL STATE ---
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationItem | null>(null);
  const [locName, setLocName] = useState("");
  const [locType, setLocType] = useState<"STUDIO" | "MOBILE">("STUDIO");
  const [locAddress, setLocAddress] = useState("");
  const [locActive, setLocActive] = useState(true);
  const [locWeeklyHours, setLocWeeklyHours] = useState<WeeklyHoursMap>(DEFAULT_WEEKLY_HOURS);
  const [locError, setLocError] = useState<string | null>(null);
  const [savingLocation, setSavingLocation] = useState(false);

  // --- DAILY AVAILABILITY OVERRIDE MODAL STATE ---
  const [overrideLocation, setOverrideLocation] = useState<LocationItem | null>(null);
  const [overrideDate, setOverrideDate] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;
  });
  const [overrideIsOpen, setOverrideIsOpen] = useState<boolean>(true);
  const [overrideOpenTime, setOverrideOpenTime] = useState<string>("11:00");
  const [overrideCloseTime, setOverrideCloseTime] = useState<string>("16:00");
  const [overrideNote, setOverrideNote] = useState<string>("");
  const [savingOverride, setSavingOverride] = useState<boolean>(false);

  const fetchAllData = useCallback(async () => {
    try {
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) {
        router.replace("/admin/login");
        return;
      }
      const meData = await meRes.json();
      if (meData.admin?.email) setAdminEmail(meData.admin.email);

      const [metricsRes, bookingsRes, servicesRes, locationsRes] = await Promise.all([
        fetch("/api/admin/metrics", { cache: "no-store" }),
        fetch(
          `/api/admin/bookings?status=${statusFilter}&q=${encodeURIComponent(searchQuery)}`,
          { cache: "no-store" }
        ),
        fetch("/api/admin/services", { cache: "no-store" }),
        fetch("/api/admin/locations", { cache: "no-store" }),
      ]);

      const [metricsData, bookingsData, servicesData, locationsData] = await Promise.all([
        metricsRes.json(),
        bookingsRes.json(),
        servicesRes.json(),
        locationsRes.json(),
      ]);

      if (metricsData.metrics) setMetrics(metricsData.metrics);
      if (bookingsData.bookings) setBookings(bookingsData.bookings);
      if (servicesData.services) setServices(servicesData.services);
      if (locationsData.locations) setLocations(locationsData.locations);
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }, [router, statusFilter, searchQuery]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // --- SIGN OUT ---
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    showConfirmation(
      "Signed Out Successfully",
      "Your admin session has been securely closed.",
      () => router.push("/admin/login")
    );
  };

  // --- IMAGE FILE UPLOAD HELPER (Client-side resize to crisp lightweight Data URL) ---
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 900;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL("image/jpeg", 0.82);
        setItemImageUrl(compressed);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // --- SERVICES & PRODUCTS CRUD ---
  const openAddItemModal = (defaultType: "SERVICE" | "PRODUCT" = "SERVICE") => {
    setEditingItem(null);
    setItemType(defaultType);
    setItemName("");
    setItemPrice("");
    setItemDescription("");
    setItemCategory(defaultType === "PRODUCT" ? "Products" : "Massage & Aesthetics");
    setItemDuration(defaultType === "PRODUCT" ? "0" : "60");
    setItemImageUrl("");
    setItemPrepNotes("");
    setItemActive(true);
    setItemError(null);
    setItemModalOpen(true);
  };

  const openEditItemModal = (item: any) => {
    setEditingItem(item);
    setItemType(item.itemType === "PRODUCT" ? "PRODUCT" : "SERVICE");
    setItemName(item.name || "");
    setItemPrice(String(item.price || ""));
    setItemDescription(item.shortDescription || item.fullDescription || "");
    setItemCategory(item.category || "");
    setItemDuration(String(item.durationMinutes ?? 60));
    setItemImageUrl(item.imageUrl || "");
    setItemPrepNotes(item.prepInstructions || "");
    setItemActive(item.isActive !== false);
    setItemError(null);
    setItemModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setItemError(null);

    if (!itemName.trim() || itemName.trim().length < 2) {
      setItemError("Name is compulsory.");
      return;
    }
    const parsedPrice = parseFloat(itemPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setItemError("Please enter a valid compulsory price (R).");
      return;
    }
    if (!itemDescription.trim() || itemDescription.trim().length < 5) {
      setItemError("Description is compulsory (at least 5 characters).");
      return;
    }

    setSavingItem(true);
    try {
      const method = editingItem ? "PATCH" : "POST";
      const payload: any = {
        name: itemName.trim(),
        itemType,
        price: parsedPrice,
        description: itemDescription.trim(),
        category:
          itemCategory.trim() ||
          (itemType === "PRODUCT" ? "Products" : "Massage & Aesthetics"),
        durationMinutes: itemType === "PRODUCT" ? 0 : parseInt(itemDuration, 10) || 60,
        imageUrl: itemImageUrl.trim() || null,
        prepInstructions: itemPrepNotes.trim() || null,
        isActive: itemActive,
      };
      if (editingItem) payload.id = editingItem.id;

      const res = await fetch("/api/admin/services", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setItemError(data.error || "Could not save item.");
        setSavingItem(false);
        return;
      }

      setItemModalOpen(false);
      await fetchAllData();
      showConfirmation(
        editingItem
          ? `${itemType === "PRODUCT" ? "Product" : "Service"} Updated`
          : `${itemType === "PRODUCT" ? "Product" : "Service"} Added Live`,
        `"${itemName.trim()}" is now live on the client website.`
      );
    } catch {
      setItemError("Network error saving item.");
    } finally {
      setSavingItem(false);
    }
  };

  const handleToggleItemActive = async (item: any) => {
    const nextState = !item.isActive;
    const res = await fetch("/api/admin/services", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, isActive: nextState }),
    });
    if (res.ok) {
      await fetchAllData();
      showConfirmation(
        nextState ? "Published to Website" : "Hidden from Website",
        `"${item.name}" is now ${nextState ? "visible to clients" : "hidden from clients"}.`
      );
    }
  };

  const handleDeleteItem = async (item: any) => {
    if (!window.confirm(`Permanently delete "${item.name}"?`)) return;
    const res = await fetch(`/api/admin/services?id=${encodeURIComponent(item.id)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      await fetchAllData();
      showConfirmation("Item Deleted", `"${item.name}" has been removed.`);
    }
  };

  // --- BOOKINGS & FINANCIAL ACTIONS ---
  const handleUpdateBooking = async (
    id: string,
    updates: { status?: string; balancePaid?: boolean },
    successTitle: string,
    successMsg: string
  ) => {
    const res = await fetch("/api/admin/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    if (res.ok) {
      const data = await res.json();
      await fetchAllData();
      if (viewBooking?.id === id && data.booking) {
        setViewBooking(data.booking);
      }
      showConfirmation(successTitle, successMsg);
    }
  };

  // --- LOCATIONS & TIMES CRUD ---
  const openAddLocationModal = () => {
    setEditingLocation(null);
    setLocName("");
    setLocType("STUDIO");
    setLocAddress("");
    setLocActive(true);
    setLocWeeklyHours(JSON.parse(JSON.stringify(DEFAULT_WEEKLY_HOURS)));
    setLocError(null);
    setLocationModalOpen(true);
  };

  const openEditLocationModal = (loc: LocationItem) => {
    setEditingLocation(loc);
    setLocName(loc.name);
    setLocType(loc.type === "MOBILE" ? "MOBILE" : "STUDIO");
    setLocAddress(loc.address);
    setLocActive(loc.isActive);
    setLocWeeklyHours(
      JSON.parse(JSON.stringify(loc.weeklyHours || DEFAULT_WEEKLY_HOURS))
    );
    setLocError(null);
    setLocationModalOpen(true);
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocError(null);
    if (!locName.trim() || !locAddress.trim()) {
      setLocError("Location name and address/area are required.");
      return;
    }

    setSavingLocation(true);
    try {
      const method = editingLocation ? "PATCH" : "POST";
      const payload: any = {
        name: locName.trim(),
        type: locType,
        address: locAddress.trim(),
        isActive: locActive,
        weeklyHours: locWeeklyHours,
      };
      if (editingLocation) payload.id = editingLocation.id;

      const res = await fetch("/api/admin/locations", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setLocError(data.error || "Failed to save location.");
        setSavingLocation(false);
        return;
      }

      setLocationModalOpen(false);
      await fetchAllData();
      showConfirmation(
        editingLocation ? "Location & Hours Updated" : "Location Added",
        `"${locName.trim()}" availability is now synced to the client booking calendar.`
      );
    } catch {
      setLocError("Network error saving location.");
    } finally {
      setSavingLocation(false);
    }
  };

  const handleToggleLocationActive = async (loc: LocationItem) => {
    const nextState = !loc.isActive;
    const res = await fetch("/api/admin/locations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: loc.id, isActive: nextState }),
    });
    if (res.ok) {
      await fetchAllData();
      showConfirmation(
        nextState ? "Location Activated" : "Location Paused",
        `"${loc.name}" is now ${nextState ? "open for bookings" : "paused from client bookings"}.`
      );
    }
  };

  const handleDeleteLocation = async (loc: LocationItem) => {
    if (!window.confirm(`Delete location "${loc.name}"?`)) return;
    const res = await fetch(`/api/admin/locations?id=${encodeURIComponent(loc.id)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      await fetchAllData();
      showConfirmation("Location Removed", `"${loc.name}" has been deleted.`);
    }
  };

  // --- DAILY OVERRIDE HANDLERS ---
  const openDailyOverrideModal = (loc: LocationItem) => {
    setOverrideLocation(loc);
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(today.getDate()).padStart(2, "0")}`;
    setOverrideDate(todayStr);
    const existing = loc.overrides?.find((o) => o.date === todayStr);
    if (existing) {
      setOverrideIsOpen(existing.isOpen);
      setOverrideOpenTime(existing.openTime || "11:00");
      setOverrideCloseTime(existing.closeTime || "16:00");
      setOverrideNote(existing.note || "");
    } else {
      setOverrideIsOpen(true);
      setOverrideOpenTime("11:00");
      setOverrideCloseTime("16:00");
      setOverrideNote("");
    }
  };

  const handleSaveDailyOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideLocation || !overrideDate) return;
    setSavingOverride(true);
    try {
      const res = await fetch("/api/admin/locations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: overrideLocation.id,
          override: {
            date: overrideDate,
            isOpen: overrideIsOpen,
            openTime: overrideIsOpen ? overrideOpenTime : null,
            closeTime: overrideIsOpen ? overrideCloseTime : null,
            note: overrideNote.trim() || null,
          },
        }),
      });
      if (res.ok) {
        const locLabel = overrideLocation.name;
        const msg = overrideIsOpen
          ? `${locLabel} set to ${overrideOpenTime} – ${overrideCloseTime} on ${overrideDate}.`
          : `${locLabel} marked CLOSED on ${overrideDate}.`;
        setOverrideLocation(null);
        await fetchAllData();
        showConfirmation("Daily Availability Updated", msg);
      }
    } finally {
      setSavingOverride(false);
    }
  };

  const handleDeleteOverride = async (locationId: string, date: string) => {
    const res = await fetch("/api/admin/locations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: locationId, deleteOverrideDate: date }),
    });
    if (res.ok) {
      await fetchAllData();
      showConfirmation(
        "Date Override Removed",
        `Reverted ${date} back to standard weekly operating hours.`
      );
    }
  };

  const displayedServices = services.filter((s) => {
    if (serviceTypeFilter === "ALL") return true;
    return (s.itemType || "SERVICE") === serviceTypeFilter;
  });

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-zinc-900 flex flex-col">
      {/* Floating Glassmorphic Dynamic Island Admin Navbar (Same Aesthetic as Main Site) */}
      <header className="fixed top-3 sm:top-4 left-0 right-0 z-40 px-3 sm:px-6 pointer-events-none">
        <nav className="pointer-events-auto max-w-7xl mx-auto rounded-full bg-white/82 backdrop-blur-2xl border border-white/80 shadow-[0_12px_38px_-10px_rgba(19,80,97,0.16)] ring-1 ring-zinc-900/[0.06] px-4 sm:px-7 py-2.5 sm:py-3">
          <div className="flex items-center justify-between gap-3">
            {/* Logo */}
            <Link href="/" className="flex items-center flex-shrink-0 focus:outline-none">
              <BrandLogo size="sm" />
            </Link>

            {/* Desktop Dashboard Page Tabs inside the Dynamic Island */}
            <div className="hidden lg:flex items-center gap-1.5 bg-zinc-100/80 p-1 rounded-full border border-zinc-200/60">
              <button
                onClick={() => setActiveTab("services")}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  activeTab === "services"
                    ? "bg-[#135061] text-white shadow-sm"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Services &amp; Products ({services.length})
              </button>
              <button
                onClick={() => setActiveTab("bookings")}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  activeTab === "bookings"
                    ? "bg-[#135061] text-white shadow-sm"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Bookings &amp; Appointments ({bookings.length})
              </button>
              <button
                onClick={() => setActiveTab("locations")}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  activeTab === "locations"
                    ? "bg-[#135061] text-white shadow-sm"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Locations &amp; Times ({locations.length})
              </button>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition-colors"
              >
                <span>Return to Website</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#135061]" />
              </Link>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white bg-[#135061] hover:bg-[#007C89] transition-colors shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile/Tablet Tab Switcher Pill Below Dynamic Island */}
        <div className="pointer-events-auto lg:hidden max-w-xl mx-auto mt-2 flex items-center justify-center gap-1.5 bg-white/90 backdrop-blur-xl p-1.5 rounded-full border border-zinc-200/80 shadow-md">
          <button
            onClick={() => setActiveTab("services")}
            className={`flex-1 py-2 px-2.5 rounded-full text-[11px] font-bold transition-all ${
              activeTab === "services" ? "bg-[#135061] text-white" : "text-zinc-600"
            }`}
          >
            Services ({services.length})
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={`flex-1 py-2 px-2.5 rounded-full text-[11px] font-bold transition-all ${
              activeTab === "bookings" ? "bg-[#135061] text-white" : "text-zinc-600"
            }`}
          >
            Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab("locations")}
            className={`flex-1 py-2 px-2.5 rounded-full text-[11px] font-bold transition-all ${
              activeTab === "locations" ? "bg-[#135061] text-white" : "text-zinc-600"
            }`}
          >
            Locations ({locations.length})
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 lg:pt-28 pb-16 w-full flex-1">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-zinc-500 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-[#135061]" />
            <span className="text-sm font-medium">Loading Totus Admin Workspace...</span>
          </div>
        ) : (
          <>
            {/* ================================================================= */}
            {/* TAB 1: SERVICES & PRODUCTS                                        */}
            {/* ================================================================= */}
            {activeTab === "services" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-zinc-200/80 shadow-sm">
                  <div>
                    <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
                      Services &amp; Products
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                      Add treatments or retail products below. Anything published appears live on
                      the website immediately ready for booking &amp; PayFast payment.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      onClick={() => openAddItemModal("SERVICE")}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-xs font-bold text-white bg-[#135061] hover:bg-[#007C89] shadow-md transition-all active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Service</span>
                    </button>
                    <button
                      onClick={() => openAddItemModal("PRODUCT")}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-xs font-bold text-zinc-900 bg-white border border-zinc-300 hover:border-[#135061] hover:bg-zinc-50 shadow-sm transition-all active:scale-95"
                    >
                      <ShoppingBag className="w-4 h-4 text-[#135061]" />
                      <span>Add Product</span>
                    </button>
                  </div>
                </div>

                {/* Filter Bar */}
                <div className="flex items-center gap-2">
                  {(["ALL", "SERVICE", "PRODUCT"] as const).map((typeKey) => (
                    <button
                      key={typeKey}
                      onClick={() => setServiceTypeFilter(typeKey)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                        serviceTypeFilter === typeKey
                          ? "bg-[#135061] text-white shadow-sm"
                          : "bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-300"
                      }`}
                    >
                      {typeKey === "ALL" && `All (${services.length})`}
                      {typeKey === "SERVICE" &&
                        `Services (${services.filter((s) => (s.itemType || "SERVICE") === "SERVICE").length})`}
                      {typeKey === "PRODUCT" &&
                        `Products (${services.filter((s) => s.itemType === "PRODUCT").length})`}
                    </button>
                  ))}
                </div>

                {/* Items Grid */}
                {displayedServices.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 border border-zinc-200/80 text-center">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#F0F9FA] border border-[#B2E2E6] flex items-center justify-center text-[#135061]">
                      <Plus className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-extrabold text-zinc-900">
                      No Services or Products Yet
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
                      Click <strong>Add Service</strong> or <strong>Add Product</strong> above to
                      publish your first item directly to the live website.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {displayedServices.map((s) => {
                      const isProd = s.itemType === "PRODUCT";
                      return (
                        <div
                          key={s.id}
                          className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm overflow-hidden flex flex-col justify-between hover:border-[#135061]/50 transition-all"
                        >
                          {s.imageUrl && (
                            <div className="h-40 w-full bg-zinc-100 border-b border-zinc-100 overflow-hidden">
                              <img
                                src={s.imageUrl}
                                alt={s.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          <div className="p-5 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span
                                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                                    isProd
                                      ? "bg-zinc-100 text-zinc-800 border-zinc-200"
                                      : "bg-[#F0F9FA] text-[#135061] border-[#B2E2E6]"
                                  }`}
                                >
                                  {isProd ? "Product" : "Service"}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    s.isActive
                                      ? "bg-[#F0F9FA] text-[#135061]"
                                      : "bg-zinc-100 text-zinc-500"
                                  }`}
                                >
                                  {s.isActive ? "Live on Site" : "Hidden"}
                                </span>
                              </div>

                              <h3 className="font-extrabold text-base text-zinc-900">
                                {s.name}
                              </h3>
                              <p className="text-xs text-zinc-600 mt-1 line-clamp-3 leading-relaxed">
                                {s.shortDescription}
                              </p>
                            </div>

                            <div className="mt-4 pt-3.5 border-t border-zinc-100">
                              <div className="flex items-baseline justify-between mb-3">
                                <div>
                                  <span className="text-[10px] text-zinc-400 uppercase font-bold block">
                                    Price
                                  </span>
                                  <span className="text-lg font-black text-zinc-900">
                                    R{Number(s.price).toFixed(2)}
                                  </span>
                                </div>
                                {!isProd && (
                                  <div className="text-right">
                                    <span className="text-[10px] text-zinc-400 uppercase font-bold block">
                                      Deposit / Duration
                                    </span>
                                    <span className="text-xs font-bold text-[#135061]">
                                      R200 Fixed • {s.durationMinutes}m
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="grid grid-cols-3 gap-1.5">
                                <button
                                  onClick={() => openEditItemModal(s)}
                                  className="inline-flex items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-bold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 transition-colors"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-[#135061]" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleToggleItemActive(s)}
                                  className="inline-flex items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-bold text-[#135061] bg-[#F0F9FA] hover:bg-[#e1f3f5] transition-colors"
                                >
                                  <Power className="w-3.5 h-3.5" />
                                  {s.isActive ? "Hide" : "Show"}
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(s)}
                                  className="inline-flex items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-bold text-zinc-600 bg-zinc-100 hover:bg-red-50 hover:text-red-700 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ================================================================= */}
            {/* TAB 2: BOOKINGS & APPOINTMENTS (+ DEDICATED FINANCIAL SECTION)    */}
            {/* ================================================================= */}
            {activeTab === "bookings" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Dedicated Financial Overview Section */}
                <div className="bg-white rounded-3xl p-6 border border-zinc-200/80 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Wallet className="w-5 h-5 text-[#135061]" />
                    <h2 className="text-base font-extrabold text-zinc-900">
                      Financial Overview — Retainers &amp; Visit Balances
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-[#F0F9FA] border border-[#B2E2E6]">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#135061]">
                        Retainers Paid (PayFast)
                      </span>
                      <div className="text-2xl font-black text-[#135061] mt-1.5">
                        R{(metrics.totalRetainersCollected || 0).toFixed(2)}
                      </div>
                      <span className="text-[11px] text-zinc-600 block mt-0.5">
                        Online deposits &amp; upfront settlements
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                        Balances Collected In-Person
                      </span>
                      <div className="text-2xl font-black text-zinc-900 mt-1.5">
                        R{(metrics.totalBalancesCollected || 0).toFixed(2)}
                      </div>
                      <span className="text-[11px] text-zinc-500 block mt-0.5">
                        Remaining balances marked settled
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                        Pending Balances Due
                      </span>
                      <div className="text-2xl font-black text-zinc-900 mt-1.5">
                        R{(metrics.totalPendingBalance || 0).toFixed(2)}
                      </div>
                      <span className="text-[11px] text-zinc-500 block mt-0.5">
                        Unpaid visit balances still outstanding
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#135061] text-white">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-100/80">
                        Total Collected Revenue
                      </span>
                      <div className="text-2xl font-black text-white mt-1.5">
                        R{(metrics.totalRevenueCollected || 0).toFixed(2)}
                      </div>
                      <span className="text-[11px] text-cyan-100/80 block mt-0.5">
                        {metrics.confirmedBookings} confirmed • {metrics.completedBookings} completed
                      </span>
                    </div>
                  </div>
                </div>

                {/* Unified Bookings & Appointments Table */}
                <div className="bg-white rounded-3xl p-6 border border-zinc-200/80 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h1 className="text-xl font-extrabold text-zinc-900">
                        Bookings &amp; Appointments
                      </h1>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Track every client appointment, location, retainer paid, and whether the
                        remaining balance has been settled.
                      </p>
                    </div>

                    <div className="relative w-full sm:w-72">
                      <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="Search ref, client, phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-full border border-zinc-200 text-xs bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#135061]"
                      />
                    </div>
                  </div>

                  {/* Status Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-5">
                    {["ALL", "CONFIRMED", "PENDING_PAYMENT", "COMPLETED", "CANCELLED"].map(
                      (st) => (
                        <button
                          key={st}
                          onClick={() => setStatusFilter(st)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                            statusFilter === st
                              ? "bg-[#135061] text-white"
                              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                          }`}
                        >
                          {st === "ALL" && "All"}
                          {st === "CONFIRMED" && "Confirmed"}
                          {st === "PENDING_PAYMENT" && "Pending Payment"}
                          {st === "COMPLETED" && "Completed"}
                          {st === "CANCELLED" && "Cancelled"}
                        </button>
                      )
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider">
                          <th className="py-3 px-3">Ref</th>
                          <th className="py-3 px-3">Client &amp; WhatsApp</th>
                          <th className="py-3 px-3">Treatment &amp; Place</th>
                          <th className="py-3 px-3">Date &amp; Time</th>
                          <th className="py-3 px-3">Retainer Paid</th>
                          <th className="py-3 px-3">Remaining Balance</th>
                          <th className="py-3 px-3">Balance Status</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-3 text-right">Manage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {bookings.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="text-center py-12 text-zinc-500">
                              No bookings or appointments match this filter yet.
                            </td>
                          </tr>
                        ) : (
                          bookings.map((b) => {
                            const isFullySettled = b.balanceDue <= 0 || b.balancePaid;
                            return (
                              <tr key={b.id} className="hover:bg-zinc-50/80 transition-colors">
                                <td className="py-3.5 px-3 font-bold text-[#135061]">
                                  {b.referenceCode}
                                </td>
                                <td className="py-3.5 px-3">
                                  <div className="font-bold text-zinc-900">{b.patientName}</div>
                                  <a
                                    href={`https://wa.me/${b.patientPhone
                                      .replace(/\D/g, "")
                                      .replace(/^0/, "27")}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#135061] hover:underline inline-flex items-center gap-1 font-semibold mt-0.5"
                                  >
                                    <MessageCircle className="w-3 h-3" />
                                    {b.patientPhone}
                                  </a>
                                </td>
                                <td className="py-3.5 px-3">
                                  <span className="font-bold text-zinc-900 block">
                                    {b.service?.name}
                                  </span>
                                  <span className="text-[11px] text-zinc-500">{b.area}</span>
                                </td>
                                <td className="py-3.5 px-3">
                                  <div className="font-bold text-zinc-900">
                                    {b.appointmentDate}
                                  </div>
                                  <div className="text-zinc-500 text-[11px]">{b.timeSlot}</div>
                                </td>
                                <td className="py-3.5 px-3 font-bold text-[#135061]">
                                  R{(b.amountPaid || 0).toFixed(2)}
                                </td>
                                <td className="py-3.5 px-3 font-bold text-zinc-800">
                                  R{(b.balanceDue || 0).toFixed(2)}
                                </td>
                                <td className="py-3.5 px-3">
                                  {isFullySettled ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#F0F9FA] text-[#135061] border border-[#B2E2E6]">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Paid / Settled
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        handleUpdateBooking(
                                          b.id,
                                          { balancePaid: true },
                                          "Remaining Balance Marked Paid",
                                          `Balance of R${b.balanceDue.toFixed(
                                            2
                                          )} for ${b.patientName} is now settled.`
                                        )
                                      }
                                      className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-100 hover:bg-[#135061] text-zinc-800 hover:text-white border border-zinc-200 transition-colors"
                                    >
                                      Unpaid • Mark Paid
                                    </button>
                                  )}
                                </td>
                                <td className="py-3.5 px-3">
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-800">
                                    {b.status}
                                  </span>
                                </td>
                                <td className="py-3.5 px-3 text-right">
                                  <button
                                    onClick={() => setViewBooking(b)}
                                    className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-zinc-100 hover:bg-[#135061] text-zinc-800 hover:text-white transition-colors"
                                  >
                                    Manage
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* TAB 3: LOCATIONS & TIMES (WEEKLY HOURS + DAILY OVERRIDES)         */}
            {/* ================================================================= */}
            {activeTab === "locations" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-zinc-200/80 shadow-sm">
                  <div>
                    <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
                      Locations &amp; Operating Times
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                      Add every studio or mobile service area, configure weekly operating hours,
                      and override any specific day (e.g. close today or work 11:00–16:00).
                    </p>
                  </div>

                  <button
                    onClick={openAddLocationModal}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold text-white bg-[#135061] hover:bg-[#007C89] shadow-md transition-all active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Location</span>
                  </button>
                </div>

                {locations.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 border border-zinc-200/80 text-center">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#F0F9FA] border border-[#B2E2E6] flex items-center justify-center text-[#135061]">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-extrabold text-zinc-900">
                      No Locations Added Yet
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
                      Add your studio branches or mobile service zones to control your operating
                      hours and day-by-day availability directly from here.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {locations.map((loc) => {
                      const weekly = (loc.weeklyHours || DEFAULT_WEEKLY_HOURS) as WeeklyHoursMap;
                      return (
                        <div
                          key={loc.id}
                          className="bg-white rounded-3xl p-6 border border-zinc-200/80 shadow-sm flex flex-col justify-between space-y-5"
                        >
                          <div>
                            {/* Location Header */}
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F0F9FA] text-[#135061] border border-[#B2E2E6]">
                                    {loc.type === "STUDIO" ? (
                                      <Building2 className="w-3 h-3" />
                                    ) : (
                                      <Home className="w-3 h-3" />
                                    )}
                                    {loc.type === "STUDIO" ? "In-Studio" : "Mobile Area"}
                                  </span>
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                      loc.isActive
                                        ? "bg-zinc-900 text-white"
                                        : "bg-zinc-100 text-zinc-500"
                                    }`}
                                  >
                                    {loc.isActive ? "Active" : "Paused"}
                                  </span>
                                </div>
                                <h3 className="text-lg font-extrabold text-zinc-900">
                                  {loc.name}
                                </h3>
                                <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-[#135061] flex-shrink-0" />
                                  {loc.address}
                                </p>
                              </div>

                              <button
                                onClick={() => handleToggleLocationActive(loc)}
                                className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors ${
                                  loc.isActive
                                    ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-200"
                                    : "bg-[#135061] hover:bg-[#007C89] text-white border-[#135061]"
                                }`}
                              >
                                {loc.isActive ? "Pause Location" : "Activate"}
                              </button>
                            </div>

                            {/* Weekly Schedule Summary */}
                            <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200/70 space-y-1.5">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 block mb-2">
                                Standard Weekly Operating Hours
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
                                {DAY_KEYS.map((dayKey) => {
                                  const d = weekly[dayKey] || DEFAULT_WEEKLY_HOURS[dayKey];
                                  return (
                                    <div
                                      key={dayKey}
                                      className="flex items-center justify-between py-0.5"
                                    >
                                      <span className="text-zinc-600 font-medium">
                                        {DAY_LABELS[dayKey].slice(0, 3)}
                                      </span>
                                      <span
                                        className={
                                          d.isOpen
                                            ? "font-bold text-zinc-900"
                                            : "font-semibold text-zinc-400"
                                        }
                                      >
                                        {d.isOpen ? `${d.openTime} – ${d.closeTime}` : "Closed"}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Specific Date Overrides List */}
                            {loc.overrides && loc.overrides.length > 0 && (
                              <div className="mt-4 space-y-1.5">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#135061] block">
                                  Custom Day-by-Day Overrides
                                </span>
                                {loc.overrides.map((ov) => (
                                  <div
                                    key={ov.date}
                                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#F0F9FA] border border-[#B2E2E6] text-xs"
                                  >
                                    <div>
                                      <strong className="text-zinc-900">{ov.date}</strong>
                                      <span className="text-zinc-600 ml-2">
                                        {ov.isOpen
                                          ? `Custom: ${ov.openTime} – ${ov.closeTime}`
                                          : "Closed All Day"}
                                      </span>
                                      {ov.note && (
                                        <span className="text-zinc-500 ml-1.5">({ov.note})</span>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => handleDeleteOverride(loc.id, ov.date)}
                                      className="text-zinc-400 hover:text-red-600 p-1"
                                      title="Remove override"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Card Footer Actions */}
                          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-zinc-100">
                            <button
                              onClick={() => openDailyOverrideModal(loc)}
                              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-[#135061] hover:bg-[#007C89] transition-colors"
                            >
                              <CalendarClock className="w-3.5 h-3.5" />
                              <span>Set Day Hours</span>
                            </button>
                            <button
                              onClick={() => openEditLocationModal(loc)}
                              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-[#135061]" />
                              <span>Edit Weekly</span>
                            </button>
                            <button
                              onClick={() => handleDeleteLocation(loc)}
                              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold text-zinc-600 bg-zinc-100 hover:bg-red-50 hover:text-red-700 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* ================================================================= */}
      {/* MODAL A: ADD / EDIT SERVICE OR PRODUCT                            */}
      {/* ================================================================= */}
      {itemModalOpen && (
        <div
          onClick={() => setItemModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden my-8"
          >
            <div className="px-6 py-5 border-b border-zinc-200 flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-zinc-900">
                {editingItem
                  ? `Edit ${itemType === "PRODUCT" ? "Product" : "Service"}`
                  : `Add New ${itemType === "PRODUCT" ? "Product" : "Service"}`}
              </h3>
              <button
                onClick={() => setItemModalOpen(false)}
                className="p-2 rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-zinc-100">
                <button
                  type="button"
                  onClick={() => {
                    setItemType("SERVICE");
                    if (!itemCategory || itemCategory === "Products") {
                      setItemCategory("Massage & Aesthetics");
                    }
                  }}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                    itemType === "SERVICE"
                      ? "bg-[#135061] text-white shadow-sm"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Service (Bookable)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setItemType("PRODUCT");
                    if (!itemCategory || itemCategory === "Massage & Aesthetics") {
                      setItemCategory("Products");
                    }
                  }}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                    itemType === "PRODUCT"
                      ? "bg-[#135061] text-white shadow-sm"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Product (For Sale)
                </button>
              </div>

              {/* Compulsory Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  {itemType === "PRODUCT" ? "Product Name *" : "Service Name *"}
                </label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder={
                    itemType === "PRODUCT"
                      ? "e.g. Organic Shea Body Butter"
                      : "e.g. 60-Min Deep Tissue Massage"
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-zinc-50 text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#135061]"
                />
              </div>

              {/* Compulsory Price & Optional Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1">
                    Price (ZAR) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    placeholder="e.g. 650"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-zinc-50 text-sm font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#135061]"
                  />
                </div>

                {itemType === "SERVICE" ? (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1">
                      Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      min="15"
                      step="15"
                      value={itemDuration}
                      onChange={(e) => setItemDuration(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-zinc-50 text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#135061]"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1">
                      Category (Optional)
                    </label>
                    <input
                      type="text"
                      value={itemCategory}
                      onChange={(e) => setItemCategory(e.target.value)}
                      placeholder="e.g. Body Care"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-zinc-50 text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#135061]"
                    />
                  </div>
                )}
              </div>

              {/* Compulsory Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="Describe what clients can expect from this service or product..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-zinc-50 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#135061]"
                />
              </div>

              {/* Optional Image (Upload or URL) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Image (Optional)
                </label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-[#135061] bg-[#F0F9FA] hover:bg-[#e1f3f5] border border-[#B2E2E6] flex-shrink-0 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="text"
                    value={itemImageUrl.startsWith("data:") ? "Uploaded photo ready" : itemImageUrl}
                    onChange={(e) => setItemImageUrl(e.target.value)}
                    placeholder="Or paste image URL (optional)"
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#135061]"
                  />
                  {itemImageUrl && (
                    <button
                      type="button"
                      onClick={() => setItemImageUrl("")}
                      className="p-2 text-zinc-400 hover:text-red-600"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {itemImageUrl && (
                  <div className="mt-2 h-28 rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50">
                    <img
                      src={itemImageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {itemType === "SERVICE" && (
                <div className="p-3 rounded-xl bg-[#F0F9FA] border border-[#B2E2E6] text-xs text-[#135061]">
                  <strong>Booking Deposit:</strong> Fixed at R200.00 automatically (or client can
                  choose to pay 100% upfront via PayFast).
                </div>
              )}

              <label className="flex items-center gap-2.5 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={itemActive}
                  onChange={(e) => setItemActive(e.target.checked)}
                  className="w-4 h-4 accent-[#135061] rounded"
                />
                <span className="text-xs font-bold text-zinc-800">
                  Publish live on website immediately
                </span>
              </label>

              {itemError && (
                <div className="flex items-center gap-2 text-xs font-bold text-red-700 bg-red-50 border border-red-200 p-3 rounded-xl">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{itemError}</span>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setItemModalOpen(false)}
                  className="px-5 py-2.5 rounded-full text-xs font-bold text-zinc-600 hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingItem}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#135061] hover:bg-[#007C89] shadow-md disabled:opacity-50"
                >
                  {savingItem && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingItem ? "Save Changes" : "Publish Now"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL B: MANAGE BOOKING & REMAINING BALANCE                       */}
      {/* ================================================================= */}
      {viewBooking && (
        <div
          onClick={() => setViewBooking(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-zinc-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Booking &amp; Appointment
                </span>
                <h3 className="text-xl font-extrabold text-[#135061]">
                  {viewBooking.referenceCode}
                </h3>
              </div>
              <button
                onClick={() => setViewBooking(null)}
                className="p-2 rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200 space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Client:</span>
                  <strong className="text-zinc-900">{viewBooking.patientName}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">WhatsApp / Phone:</span>
                  <a
                    href={`https://wa.me/${viewBooking.patientPhone
                      .replace(/\D/g, "")
                      .replace(/^0/, "27")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#135061] text-white font-bold"
                  >
                    <MessageCircle className="w-3 h-3" />
                    {viewBooking.patientPhone}
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Email:</span>
                  <strong className="text-zinc-900">{viewBooking.patientEmail}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Service / Product:</span>
                  <strong className="text-zinc-900">{viewBooking.service?.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Schedule:</span>
                  <strong className="text-zinc-900">
                    {viewBooking.appointmentDate} at {viewBooking.timeSlot}
                  </strong>
                </div>
                <div className="flex justify-between items-center gap-3">
                  <span className="text-zinc-500">Location:</span>
                  <div className="flex items-center gap-2 text-right">
                    <strong className="text-zinc-900">{viewBooking.patientAddress}</strong>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${viewBooking.patientAddress}, South Africa`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-white border border-zinc-200 hover:border-[#135061]"
                      title="Open in Google Maps"
                    >
                      <img src="/google-maps-icon.png" alt="Maps" className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Financial Retainer & Remaining Balance Panel */}
              <div className="rounded-2xl border border-zinc-200 overflow-hidden">
                <div className="flex justify-between px-4 py-2.5 bg-white border-b border-zinc-100">
                  <span className="text-zinc-500">Total Treatment Fee:</span>
                  <strong className="text-zinc-900">
                    R{(viewBooking.totalAmount || 0).toFixed(2)}
                  </strong>
                </div>
                <div className="flex justify-between px-4 py-2.5 bg-[#F0F9FA] border-b border-[#d5ecef]">
                  <span className="text-[#135061] font-semibold">Retainer Paid (PayFast):</span>
                  <strong className="text-[#135061] text-sm">
                    R{(viewBooking.amountPaid || 0).toFixed(2)}
                  </strong>
                </div>
                <div className="flex justify-between items-center px-4 py-3 bg-zinc-50">
                  <div>
                    <span className="text-zinc-700 font-semibold block">Remaining Balance:</span>
                    <span className="text-[11px] text-zinc-500">
                      {viewBooking.balanceDue <= 0 || viewBooking.balancePaid
                        ? "Balance has been paid in full"
                        : "Still owed by client at visit"}
                    </span>
                  </div>
                  <div className="text-right">
                    <strong className="text-zinc-900 text-sm block">
                      R{(viewBooking.balanceDue || 0).toFixed(2)}
                    </strong>
                    {viewBooking.balanceDue > 0 && (
                      <button
                        onClick={() =>
                          handleUpdateBooking(
                            viewBooking.id,
                            { balancePaid: !viewBooking.balancePaid },
                            !viewBooking.balancePaid
                              ? "Remaining Balance Paid"
                              : "Marked Balance Unpaid",
                            `Balance settlement updated for ${viewBooking.referenceCode}.`
                          )
                        }
                        className="mt-1 px-3 py-1 rounded-full text-[10px] font-bold bg-[#135061] hover:bg-[#007C89] text-white"
                      >
                        {viewBooking.balancePaid ? "Mark Unpaid" : "Mark Balance Paid"}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {viewBooking.medicalNotes && (
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                  <strong className="text-zinc-800 block mb-0.5">Client Notes:</strong>
                  <p className="text-zinc-600">{viewBooking.medicalNotes}</p>
                </div>
              )}

              {/* Appointment Status Controls */}
              <div>
                <span className="font-bold text-zinc-700 block mb-2">
                  Update Appointment Status:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() =>
                      handleUpdateBooking(
                        viewBooking.id,
                        { status: "CONFIRMED" },
                        "Appointment Confirmed",
                        `${viewBooking.referenceCode} is marked Confirmed.`
                      )
                    }
                    className="py-2.5 px-3 rounded-xl font-bold text-xs bg-[#F0F9FA] hover:bg-[#135061] text-[#135061] hover:text-white border border-[#B2E2E6] transition-colors"
                  >
                    Confirmed
                  </button>
                  <button
                    onClick={() =>
                      handleUpdateBooking(
                        viewBooking.id,
                        { status: "COMPLETED" },
                        "Appointment Completed",
                        `${viewBooking.referenceCode} is marked Completed.`
                      )
                    }
                    className="py-2.5 px-3 rounded-xl font-bold text-xs bg-zinc-900 hover:bg-zinc-700 text-white transition-colors"
                  >
                    Completed
                  </button>
                  <button
                    onClick={() =>
                      handleUpdateBooking(
                        viewBooking.id,
                        { status: "CANCELLED" },
                        "Appointment Cancelled",
                        `${viewBooking.referenceCode} has been cancelled.`
                      )
                    }
                    className="py-2.5 px-3 rounded-xl font-bold text-xs bg-zinc-100 hover:bg-red-50 text-zinc-700 hover:text-red-700 border border-zinc-200 transition-colors"
                  >
                    Cancelled
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL C: ADD / EDIT LOCATION & WEEKLY HOURS                       */}
      {/* ================================================================= */}
      {locationModalOpen && (
        <div
          onClick={() => setLocationModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden my-8"
          >
            <div className="px-6 py-5 border-b border-zinc-200 flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-zinc-900">
                {editingLocation ? "Edit Location & Weekly Hours" : "Add New Location"}
              </h3>
              <button
                onClick={() => setLocationModalOpen(false)}
                className="p-2 rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSaveLocation}
              className="p-6 space-y-4 max-h-[75vh] overflow-y-auto"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1">
                    Location Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={locName}
                    onChange={(e) => setLocName(e.target.value)}
                    placeholder="e.g. Pretoria East Studio"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-zinc-50 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#135061]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1">
                    Location Type
                  </label>
                  <select
                    value={locType}
                    onChange={(e) =>
                      setLocType(e.target.value === "MOBILE" ? "MOBILE" : "STUDIO")
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-zinc-50 text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#135061]"
                  >
                    <option value="STUDIO">In-Studio Branch</option>
                    <option value="MOBILE">Mobile Visit Area</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  {locType === "STUDIO"
                    ? "Studio Physical Address *"
                    : "Mobile Service Coverage Description *"}
                </label>
                <input
                  type="text"
                  required
                  value={locAddress}
                  onChange={(e) => setLocAddress(e.target.value)}
                  placeholder={
                    locType === "STUDIO"
                      ? "e.g. 14 Alwyn Street, Pretoria East"
                      : "e.g. Equestria, Moreleta Park, Silverlakes"
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-zinc-50 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#135061]"
                />
              </div>

              {/* Weekly Operating Hours Editor */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-2">
                  Default Weekly Operating Hours
                </label>
                <div className="space-y-2 bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200">
                  {DAY_KEYS.map((dayKey) => {
                    const dayObj = locWeeklyHours[dayKey] || DEFAULT_WEEKLY_HOURS[dayKey];
                    return (
                      <div
                        key={dayKey}
                        className="flex flex-wrap items-center justify-between gap-2 py-1 border-b border-zinc-200/60 last:border-0 text-xs"
                      >
                        <label className="flex items-center gap-2 w-28 cursor-pointer font-bold text-zinc-800">
                          <input
                            type="checkbox"
                            checked={dayObj.isOpen}
                            onChange={(e) =>
                              setLocWeeklyHours((prev) => ({
                                ...prev,
                                [dayKey]: { ...prev[dayKey], isOpen: e.target.checked },
                              }))
                            }
                            className="w-4 h-4 accent-[#135061]"
                          />
                          <span>{DAY_LABELS[dayKey]}</span>
                        </label>

                        {dayObj.isOpen ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={dayObj.openTime}
                              onChange={(e) =>
                                setLocWeeklyHours((prev) => ({
                                  ...prev,
                                  [dayKey]: { ...prev[dayKey], openTime: e.target.value },
                                }))
                              }
                              className="px-2.5 py-1.5 rounded-lg border border-zinc-300 bg-white text-xs font-semibold"
                            />
                            <span className="text-zinc-400">to</span>
                            <input
                              type="time"
                              value={dayObj.closeTime}
                              onChange={(e) =>
                                setLocWeeklyHours((prev) => ({
                                  ...prev,
                                  [dayKey]: { ...prev[dayKey], closeTime: e.target.value },
                                }))
                              }
                              className="px-2.5 py-1.5 rounded-lg border border-zinc-300 bg-white text-xs font-semibold"
                            />
                          </div>
                        ) : (
                          <span className="text-zinc-400 font-semibold pr-2">Closed</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {locError && (
                <div className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 p-3 rounded-xl">
                  {locError}
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setLocationModalOpen(false)}
                  className="px-5 py-2.5 rounded-full text-xs font-bold text-zinc-600 hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingLocation}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#135061] hover:bg-[#007C89] shadow-md disabled:opacity-50"
                >
                  {savingLocation && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Location</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL D: DAY-BY-DAY AVAILABILITY OVERRIDE                         */}
      {/* ================================================================= */}
      {overrideLocation && (
        <div
          onClick={() => setOverrideLocation(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-zinc-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#135061]">
                  Daily Schedule Override
                </span>
                <h3 className="text-lg font-extrabold text-zinc-900">
                  {overrideLocation.name}
                </h3>
              </div>
              <button
                onClick={() => setOverrideLocation(null)}
                className="p-2 rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDailyOverride} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Select Specific Date *
                </label>
                <input
                  type="date"
                  required
                  value={overrideDate}
                  onChange={(e) => setOverrideDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-zinc-50 text-sm font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#135061]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-zinc-100">
                <button
                  type="button"
                  onClick={() => setOverrideIsOpen(true)}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                    overrideIsOpen ? "bg-[#135061] text-white shadow-sm" : "text-zinc-600"
                  }`}
                >
                  Open Custom Hours
                </button>
                <button
                  type="button"
                  onClick={() => setOverrideIsOpen(false)}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                    !overrideIsOpen ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-600"
                  }`}
                >
                  Closed All Day
                </button>
              </div>

              {overrideIsOpen && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1">
                      Open From
                    </label>
                    <input
                      type="time"
                      value={overrideOpenTime}
                      onChange={(e) => setOverrideOpenTime(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 bg-zinc-50 text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1">
                      Close At
                    </label>
                    <input
                      type="time"
                      value={overrideCloseTime}
                      onChange={(e) => setOverrideCloseTime(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 bg-zinc-50 text-sm font-semibold"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Optional Note
                </label>
                <input
                  type="text"
                  value={overrideNote}
                  onChange={(e) => setOverrideNote(e.target.value)}
                  placeholder="e.g. Shortened hours today / Closed for training"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-zinc-50 text-xs text-zinc-900"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setOverrideLocation(null)}
                  className="px-5 py-2.5 rounded-full text-xs font-bold text-zinc-600 hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingOverride}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#135061] hover:bg-[#007C89] shadow-md disabled:opacity-50"
                >
                  {savingOverride && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Day Availability</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clean Light Footer */}
      <footer className="text-center py-5 text-xs text-zinc-500 border-t border-zinc-200 bg-white">
        Totus Massage &amp; Aesthetics • Admin Management ({adminEmail})
      </footer>

      {/* Universal Action Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onClose={() => {
          const cb = confirmDialog.onAfterClose;
          setConfirmDialog({ isOpen: false, title: "" });
          if (cb) cb();
        }}
      />
    </div>
  );
}
