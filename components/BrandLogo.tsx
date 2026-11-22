/**
 * Totus Massage & Aesthetics — Brand Logo & Botanical Lotus Divider Components
 *
 * Uses the authentic transparent `/totus-emblem.png` mark paired with responsive brand typography
 * tuned mathematically to fit cleanly inside the mobile Dynamic Island navbar down to 320px width.
 * Supports an optional slow metallic-silver/white `breathingGlow` prop for Navbar and Footer wordmarks.
 */

import React from "react";

interface BrandLogoProps {
  variant?: "full" | "icon-only" | "light";
  className?: string;
  size?: "sm" | "md" | "lg";
  isDark?: boolean;
  breathingGlow?: boolean;
}

export function BrandLogo({
  variant = "full",
  className = "",
  size = "md",
  isDark = false,
  breathingGlow = false,
}: BrandLogoProps) {
  const isDarkMode = isDark || variant === "light";

  const iconSizes = {
    sm: "w-8 h-8 sm:w-9 sm:h-9",
    md: "w-8 h-8 sm:w-11 sm:h-11",
    lg: "w-12 h-12 sm:w-14 sm:h-14",
  };

  const titleSizes = {
    sm: "text-base sm:text-lg tracking-[0.12em] sm:tracking-[0.14em]",
    md: "text-base sm:text-2xl tracking-[0.12em] sm:tracking-[0.16em]",
    lg: "text-2xl sm:text-3xl tracking-[0.16em] sm:tracking-[0.18em]",
  };

  const subSizes = {
    sm: "text-[7px] tracking-[0.14em] sm:tracking-[0.18em]",
    md: "text-[7px] sm:text-[10px] tracking-[0.09em] sm:tracking-[0.2em]",
    lg: "text-[10px] sm:text-xs tracking-[0.18em] sm:tracking-[0.24em]",
  };

  const barWidths = {
    sm: "w-2 sm:w-3",
    md: "w-2 sm:w-3",
    lg: "w-2.5 sm:w-3.5",
  };

  const glowClass = breathingGlow ? "breathing-glow-text" : "";

  return (
    <div className={`flex items-center gap-2 sm:gap-3 min-w-0 select-none ${className}`}>
      {/* Authentic Totus Lotus + Zen Medallion Emblem */}
      <div
        className={`relative ${iconSizes[size]} flex-shrink-0 flex items-center justify-center`}
      >
        <img
          src="/totus-emblem.png"
          alt="Totus Massage & Aesthetics Logo"
          className="w-full h-full object-contain drop-shadow-sm transition-transform duration-300 hover:scale-105"
        />
      </div>

      {variant !== "icon-only" && (
        <div className="flex flex-col leading-none min-w-0">
          <div className="flex items-baseline">
            <span
              className={`font-black uppercase ${
                isDarkMode ? "text-[#00A3AD]" : "text-[#135061]"
              } ${titleSizes[size]} ${glowClass}`}
            >
              TOTUS
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 mt-0.5 sm:mt-1">
            <span
              className={`h-[1.5px] ${barWidths[size]} flex-shrink-0 rounded-full ${
                isDarkMode ? "bg-zinc-400" : "bg-[#135061]"
              }`}
            />
            <span
              className={`font-extrabold uppercase whitespace-nowrap ${
                isDarkMode ? "text-white" : "text-zinc-900"
              } ${subSizes[size]} ${glowClass}`}
            >
              MASSAGE <span className="text-[#E86689]">&amp;</span> AESTHETICS
            </span>
            <span
              className={`h-[1.5px] ${barWidths[size]} flex-shrink-0 rounded-full ${
                isDarkMode ? "bg-zinc-400" : "bg-[#135061]"
              }`}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Serene Botanical Lotus Divider displayed in the Hero and Footer sections.
 */
export function EcgPulseLine({
  className = "",
  isDark = false,
}: {
  className?: string;
  isDark?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        viewBox="0 0 220 36"
        className="w-32 sm:w-40 h-7 flex-shrink-0"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 18 Q40 8 85 18"
          stroke="#007C89"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M135 18 Q180 28 220 18"
          stroke="#007C89"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M110 26 C100 26 93 20 92 14 C98 14 105 18 110 26 Z"
          fill="#E86689"
        />
        <path
          d="M110 26 C120 26 127 20 128 14 C122 14 115 18 110 26 Z"
          fill="#E86689"
        />
        <path
          d="M110 26 C103 19 103 10 110 4 C117 10 117 19 110 26 Z"
          fill="#D4426E"
        />
      </svg>
      <div className="flex flex-col text-left">
        <span
          className={`font-serif italic text-sm ${
            isDark ? "text-zinc-200" : "text-zinc-700"
          } leading-tight`}
        >
          Serenity, Beauty &amp;
        </span>
        <span className="font-black text-xs tracking-wider text-[#135061] uppercase leading-tight">
          PURE REJUVENATION.
        </span>
      </div>
    </div>
  );
}
