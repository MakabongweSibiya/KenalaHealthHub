"use client";

import React from "react";
import {
  Clock,
  ArrowRight,
  Info,
  ShoppingBag,
  Heart,
} from "lucide-react";

export interface ServiceItem {
  id: string;
  name: string;
  slug: string;
  itemType?: string; // "SERVICE" or "PRODUCT"
  category: string;
  shortDescription: string;
  fullDescription: string;
  price: number;
  retainerPercentage: number;
  durationMinutes: number;
  icon: string;
  imageUrl?: string | null;
  prepInstructions?: string | null;
  isActive: boolean;
}

interface ServiceCardProps {
  service: ServiceItem;
  onOpenDetails: (service: ServiceItem) => void;
  onSelectForBooking: (service: ServiceItem) => void;
}

export function ServiceCard({
  service,
  onOpenDetails,
  onSelectForBooking,
}: ServiceCardProps) {
  const isProduct = service.itemType === "PRODUCT";
  const retainerAmount = 200;

  return (
    <div className="group relative flex flex-col justify-between glass-card glass-card-hover rounded-3xl overflow-hidden">
      {/* Optional Image Header (Products or Services) */}
      {service.imageUrl && (
        <div className="relative w-full h-48 bg-zinc-100 overflow-hidden border-b border-zinc-100">
          <img
            src={service.imageUrl}
            alt={service.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}

      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          {/* Type/Category & Duration */}
          <div className="flex items-center justify-between gap-2 mb-3.5">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                isProduct
                  ? "bg-zinc-100 text-zinc-800 border-zinc-200"
                  : "bg-[#F0F9FA] text-[#135061] border-[#B2E2E6]"
              }`}
            >
              {isProduct ? "Product" : service.category || "Treatment"}
            </span>
            {!isProduct && service.durationMinutes > 0 && (
              <span className="flex items-center gap-1 text-xs text-zinc-500 font-medium">
                <Clock className="w-3.5 h-3.5 text-[#135061]" />
                {service.durationMinutes} mins
              </span>
            )}
          </div>

          {/* Icon (if no image) & Title */}
          <div className="flex items-start gap-3 mb-2.5">
            {!service.imageUrl && (
              <div className="w-10 h-10 rounded-xl bg-[#F0F9FA] text-[#135061] border border-[#B2E2E6]/60 flex items-center justify-center flex-shrink-0 group-hover:bg-[#135061] group-hover:text-white transition-colors duration-300">
                {isProduct ? (
                  <ShoppingBag className="w-5 h-5" />
                ) : (
                  <Heart className="w-5 h-5" />
                )}
              </div>
            )}
            <h3 className="font-bold text-lg text-zinc-900 group-hover:text-[#135061] transition-colors leading-snug">
              {service.name}
            </h3>
          </div>

          {/* Short Description */}
          <p className="text-xs text-zinc-600 line-clamp-3 leading-relaxed mb-5">
            {service.shortDescription}
          </p>
        </div>

        {/* Pricing & CTA Actions */}
        <div className="pt-4 border-t border-zinc-100">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <span className="text-xs text-zinc-500 block">
                {isProduct ? "Product Price" : "Full Treatment"}
              </span>
              <span className="text-xl font-extrabold text-zinc-900">
                R{service.price.toFixed(0)}
              </span>
            </div>

            {!isProduct && (
              <div className="text-right">
                <span className="text-[10px] font-bold text-[#135061] uppercase tracking-wider block">
                  Booking Deposit
                </span>
                <span className="text-sm font-extrabold text-[#135061]">
                  R{retainerAmount}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onOpenDetails(service)}
              className="glass-btn-light flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-full text-xs font-semibold text-zinc-800"
            >
              <Info className="w-3.5 h-3.5 text-[#135061]" />
              Details
            </button>

            <button
              type="button"
              onClick={() => onSelectForBooking(service)}
              className="glass-btn-teal flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-full text-xs font-bold text-white"
            >
              {isProduct ? "Order Now" : "Book Slot"}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
