import React from "react";

interface BrandLogoProps {
  variant?: "full" | "icon-only" | "light";
  className?: string;
  size?: "sm" | "md" | "lg";
  isDark?: boolean;
}

export function BrandLogo({
  variant = "full",
  className = "",
  size = "md",
  isDark = false,
}: BrandLogoProps) {
  const isDarkMode = isDark || variant === "light";
  const iconSizes = {
    sm: "w-10 h-10",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const titleSizes = {
    sm: "text-xl tracking-[0.14em]",
    md: "text-2xl tracking-[0.16em]",
    lg: "text-3xl tracking-[0.18em]",
  };

  const subSizes = {
    sm: "text-[8px] tracking-[0.18em]",
    md: "text-[10px] tracking-[0.22em]",
    lg: "text-xs tracking-[0.25em]",
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Totus Lotus + Zen Medallion + Serene Spa Face & Hands Emblem */}
      <div
        className={`relative ${iconSizes[size]} flex-shrink-0 flex items-center justify-center`}
      >
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full drop-shadow-sm transition-transform duration-300 hover:scale-105"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Zen Medallion Circle */}
          <circle
            cx="60"
            cy="70"
            r="43"
            fill="#FFFFFF"
            stroke="#135061"
            strokeWidth="5.5"
          />
          {/* Concentric Brush Stroke Arcs */}
          <path
            d="M22 62 A38 38 0 0 0 60 108 A38 38 0 0 0 98 62"
            stroke="#135061"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <path
            d="M27 77 A34 34 0 0 0 93 77"
            stroke="#007C89"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Serene Sleeping Woman's Face & Hands Line Art */}
          {/* Face contour & cheek */}
          <path
            d="M44 54 C40 62 43 73 53 78 C61 81 69 77 72 68 C74 62 72 55 68 51"
            stroke="#135061"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Brows & peaceful closed eyes */}
          <path
            d="M45 60 Q49 57 53 59"
            stroke="#135061"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
          <path
            d="M58 56 Q63 54 67 57"
            stroke="#135061"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
          <path
            d="M46 64 Q50 67 54 63"
            stroke="#135061"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          <path
            d="M59 61 Q63 64 67 60"
            stroke="#135061"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          {/* Nose & serene rose-tinted lips */}
          <path
            d="M56 63 Q54 68 57 69"
            stroke="#135061"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M55 73 Q59 75 63 72"
            stroke="#E86689"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Resting hands & delicate fingers */}
          <path
            d="M35 83 Q48 80 68 88"
            stroke="#135061"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M52 82 L66 89 M50 86 L63 92 M48 90 L60 95"
            stroke="#135061"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
          <path
            d="M84 62 Q78 72 72 83 M87 67 Q81 76 76 85 M89 72 Q84 80 80 87"
            stroke="#135061"
            strokeWidth="1.9"
            strokeLinecap="round"
          />

          {/* Top 5-Petal Pink Lotus Crown */}
          <path
            d="M60 44 C44 38 35 24 38 12 C48 15 56 26 60 44 Z"
            fill="#C93B67"
            stroke="#135061"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          <path
            d="M60 44 C76 38 85 24 82 12 C72 15 64 26 60 44 Z"
            fill="#C93B67"
            stroke="#135061"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          <path
            d="M60 45 C42 46 26 37 22 25 C36 24 50 31 60 45 Z"
            fill="#E86689"
            stroke="#135061"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          <path
            d="M60 45 C78 46 94 37 98 25 C84 24 70 31 60 45 Z"
            fill="#E86689"
            stroke="#135061"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          <path
            d="M60 46 C47 34 47 16 60 4 C73 16 73 34 60 46 Z"
            fill="#E86689"
            stroke="#135061"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          <path
            d="M60 12 C56 22 56 32 60 41"
            stroke="#F6A5BA"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {variant !== "icon-only" && (
        <div className="flex flex-col leading-none">
          <div className="flex items-baseline">
            <span
              className={`font-black uppercase ${
                isDarkMode ? "text-[#00A3AD]" : "text-[#135061]"
              } ${titleSizes[size]}`}
            >
              TOTUS
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={`h-[1.5px] w-3.5 rounded-full ${
                isDarkMode ? "bg-[#E86689]" : "bg-[#135061]"
              }`}
            />
            <span
              className={`font-extrabold uppercase ${
                isDarkMode ? "text-white" : "text-zinc-900"
              } ${subSizes[size]}`}
            >
              MASSAGE <span className="text-[#E86689]">&amp;</span> AESTHETICS
            </span>
            <span
              className={`h-[1.5px] w-3.5 rounded-full ${
                isDarkMode ? "bg-[#E86689]" : "bg-[#135061]"
              }`}
            />
          </div>
        </div>
      )}
    </div>
  );
}

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
        className="w-40 h-7"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Serene Botanical Wave & Mini Lotus Accent */}
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
        {/* Mini Center Lotus Motif */}
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
      <div className="flex flex-col">
        <span
          className={`font-serif italic text-sm ${
            isDark ? "text-zinc-200" : "text-zinc-700"
          } leading-tight`}
        >
          Serenity, Beauty &amp;
        </span>
        <span className="font-black text-xs tracking-wider text-[#E86689] uppercase leading-tight">
          PURE REJUVENATION.
        </span>
      </div>
    </div>
  );
}
