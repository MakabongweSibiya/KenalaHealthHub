"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import {
  ShieldCheck,
  Mail,
  Lock,
  AlertCircle,
  Loader2,
  ArrowRight,
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

  // If already authenticated with a valid JWT session, redirect directly to dashboard
  useEffect(() => {
    async function checkExistingSession() {
      try {
        const res = await fetch("/api/auth/me");
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

      // Successful login -> Redirect to admin dashboard
      router.push("/admin/dashboard");
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
    <div className="min-h-screen bg-[#111111] text-white flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden">
      {/* Subtle Ambient Teal & Lotus Pink Glows */}
      <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 rounded-full bg-[#E86689]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-96 h-96 rounded-full bg-[#007C89]/10 blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between py-4 relative z-10">
        <Link href="/">
          <BrandLogo size="sm" isDark />
        </Link>
        <Link
          href="/"
          className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          ← Return to Client Website
        </Link>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md mx-auto w-full my-auto relative z-10">
        <div className="bg-zinc-900/95 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Top Teal & Lotus Pink Gradient Bar */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#135061] via-[#007C89] to-[#E86689]" />

          {/* Security Badge */}
          <div className="w-12 h-12 rounded-2xl bg-[#E86689]/15 border border-[#E86689]/30 text-[#F6A5BA] flex items-center justify-center mb-6">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight">
            Totus Admin Portal
          </h1>
          <p className="text-xs text-zinc-400 mt-1 mb-6">
            Encrypted JWT &amp; Rate-Limited Owner Authentication
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Administrator Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
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
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800/90 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#E86689] transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className={`${isShaking ? "animate-shake" : ""}`}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
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
                  className={`w-full pl-10 pr-11 py-3 rounded-xl border text-sm text-white placeholder-zinc-500 focus:outline-none transition-all ${
                    errorMsg
                      ? "border-red-500 bg-red-950/40 text-red-200 focus:ring-2 focus:ring-red-500"
                      : "border-zinc-700 bg-zinc-800/90 focus:ring-2 focus:ring-[#E86689]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-zinc-400 hover:text-white transition-colors p-0.5"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Error / Rate-Limit Lockout Banner */}
              {errorMsg && (
                <div
                  className={`flex items-start gap-2 text-xs font-bold mt-2.5 p-3 rounded-xl border animate-in fade-in duration-200 ${
                    isLockedOut
                      ? "text-amber-300 bg-amber-950/70 border-amber-700/80"
                      : "text-red-400 bg-red-950/60 border-red-800/80"
                  }`}
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#135061] to-[#007C89] hover:from-[#0E3D4B] hover:to-[#005C66] ring-2 ring-[#E86689]/30 shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Admin Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security Footer Notice */}
          <div className="mt-6 pt-5 border-t border-zinc-800/80 text-[11px] text-zinc-500 text-center">
            Protected with HS256 JWT, Bcrypt Cost-12 &amp; Brute-Force Lockout Protection.
          </div>
        </div>
      </div>

      {/* Mini Footer */}
      <div className="text-center text-xs text-zinc-500 py-4 relative z-10">
        Totus Massage &amp; Aesthetics • Authorised Management Only
      </div>
    </div>
  );
}
