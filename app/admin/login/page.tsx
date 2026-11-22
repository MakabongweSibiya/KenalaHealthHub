"use client";

/**
 * Totus Massage & Aesthetics — Hardened Glassmorphic Admin Sign-In Portal
 *
 * Matches the flagship KREDO storefront design system:
 * - Floating glassmorphic Dynamic Island navbar with metallic silver rim glow & breathing wordmark
 * - Glassmorphic Sign-In card (no harsh top color bar) with subtle hover elevation & breathing title
 * - Glassmorphic bevel-up `Sign In to Admin Portal` and `Return to Website` buttons
 * - Backed by 3-attempt Neon-persistent brute-force lockout & constant-time bcrypt verification
 */

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import {
  Mail,
  Lock,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Redirect automatically if already authenticated with a valid HttpOnly session
  useEffect(() => {
    async function checkExistingSession() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.ok) {
          router.replace("/admin/dashboard");
        }
      } catch {
        // Not logged in
      }
    }
    checkExistingSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setIsShaking(true);
        setIsLockedOut(res.status === 429 || Boolean(data.lockedOut));
        setErrorMsg(
          data.error || "Invalid credentials. Please verify your email and password."
        );
        setTimeout(() => {
          setIsShaking(false);
        }, 500);
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      setShowSuccessModal(true);
    } catch {
      setIsShaking(true);
      setErrorMsg("Network error. Please verify your internet connection and try again.");
      setTimeout(() => {
        setIsShaking(false);
      }, 500);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-zinc-900 flex flex-col justify-between relative overflow-hidden">
      {/* Ultra-soft ambient corner glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#E86689]/[0.06] blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-[#007C89]/[0.06] blur-3xl pointer-events-none" />

      {/* Floating Glassmorphic Dynamic Island Navbar (Identical to Client Storefront) */}
      <header className="fixed top-3 sm:top-4 left-0 right-0 z-40 px-3 sm:px-6 pointer-events-none">
        <nav
          aria-label="Admin Portal Navigation"
          className="pointer-events-auto max-w-7xl mx-auto rounded-full glass-island-nav px-3.5 sm:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4"
        >
          <Link href="/" className="flex items-center min-w-0 focus:outline-none">
            <BrandLogo size="md" breathingGlow />
          </Link>
          <Link
            href="/"
            className="glass-btn-light flex-shrink-0 inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full text-[11px] sm:text-sm font-bold text-zinc-900 whitespace-nowrap"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#135061]" />
            <span className="hidden xs:inline sm:inline">Return to Website</span>
            <span className="sm:hidden">Website</span>
          </Link>
        </nav>
      </header>

      {/* Main Centered Glassmorphic Login Card (No harsh top teal stripe) */}
      <main className="flex-1 flex items-center justify-center px-4 pt-28 pb-12 relative z-10">
        <div className="max-w-md w-full glass-modal-card glass-card-hover rounded-3xl p-7 sm:p-9 relative overflow-hidden">
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight mb-6 breathing-glow-text">
            Totus Admin Portal
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5">
                Administrator Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Enter admin email address"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-300/80 bg-white/80 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#135061] transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className={`${isShaking ? "animate-shake" : ""}`}>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="••••••••••••"
                  className={`w-full pl-10 pr-11 py-3 rounded-xl border text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none transition-all ${
                    errorMsg
                      ? "border-red-500 bg-red-50/90 text-red-900 focus:ring-2 focus:ring-red-500"
                      : "border-zinc-300/80 bg-white/80 focus:ring-2 focus:ring-[#135061]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-800 transition-colors p-0.5"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {errorMsg && (
                <div
                  className={`flex items-start gap-2 text-xs font-bold mt-2.5 p-3 rounded-xl border animate-in fade-in duration-200 ${
                    isLockedOut
                      ? "text-amber-800 bg-amber-50/90 border-amber-200"
                      : "text-red-700 bg-red-50/90 border-red-200"
                  }`}
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            {/* Glassmorphic Bevel-Up Submit CTA */}
            <button
              type="submit"
              disabled={isLoading}
              className="glass-btn-teal w-full mt-3 inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-full font-bold text-sm text-white group cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Admin Portal</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 ease-out group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Seamless #FAF9F6 Footer */}
      <footer className="text-center text-xs text-zinc-500 py-5 bg-[#FAF9F6] relative z-10">
        Totus Massage &amp; Aesthetics • Authorised Management Only
      </footer>

      {/* Glassmorphic Confirmation Modal on Successful Sign-In */}
      <ConfirmationModal
        isOpen={showSuccessModal}
        title="Signed In Successfully"
        message="Welcome back to the Totus Admin Portal. Loading your workspace..."
        durationMs={1600}
        onClose={() => {
          setShowSuccessModal(false);
          router.push("/admin/dashboard");
        }}
      />
    </div>
  );
}
