"use client";

import React from "react";
import { ServiceItem } from "./ServiceCard";
import { X, Clock, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";

interface ServiceDetailModalProps {
  service: ServiceItem | null;
  isOpen: boolean;
  onClose: () => void;
  onBookNow: (service: ServiceItem) => void;
}

export function ServiceDetailModal({
  service,
  isOpen,
  onClose,
  onBookNow,
}: ServiceDetailModalProps) {
  if (!isOpen || !service) return null;

  const isProduct = service.itemType === "PRODUCT";
  const retainerAmount = isProduct ? service.price : Math.min(200, service.price);
  const balanceDue = isProduct ? 0 : Math.max(0, service.price - retainerAmount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {service.imageUrl && (
          <div className="w-full h-52 bg-zinc-100 border-b border-zinc-100 overflow-hidden relative">
            <img
              src={service.imageUrl}
              alt={service.name}
              className="w-full h-full object-cover"
            />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/90 text-zinc-700 hover:text-zinc-900 shadow-md"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Clean White Header */}
        <div className="bg-white text-zinc-900 px-6 pt-6 pb-4 border-b border-zinc-100 relative">
          {!service.imageUrl && (
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <span className="text-[10px] font-bold uppercase tracking-widest text-[#135061] px-2.5 py-0.5 rounded-full bg-[#F0F9FA] border border-[#B2E2E6] inline-block mb-2">
            {isProduct ? "Product" : service.category}
          </span>
          <h2 className="text-2xl font-extrabold text-zinc-900 pr-8">
            {service.name}
          </h2>
          {!isProduct && service.durationMinutes > 0 && (
            <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-500">
              <Clock className="w-3.5 h-3.5 text-[#135061]" />
              <span>Estimated Session Duration: {service.durationMinutes} Minutes</span>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
              {isProduct ? "Product Details" : "Treatment Overview"}
            </h4>
            <p className="text-sm text-zinc-700 leading-relaxed">
              {service.fullDescription || service.shortDescription}
            </p>
          </div>

          {service.prepInstructions && (
            <div className="p-4 rounded-2xl bg-[#F0F9FA] border border-[#B2E2E6] flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#135061] flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-[#135061] block mb-0.5">
                  Session Preparation Notes
                </span>
                <p className="text-xs text-zinc-700 leading-normal">
                  {service.prepInstructions}
                </p>
              </div>
            </div>
          )}

          {/* Fee Breakdown */}
          <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600 mb-3">
              {isProduct ? "Pricing" : "Fee & Deposit Breakdown"}
            </h4>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center text-zinc-700">
                <span>{isProduct ? "Product Price:" : "Total Treatment Fee:"}</span>
                <span className="font-bold text-zinc-900">R{service.price.toFixed(2)}</span>
              </div>

              {!isProduct && (
                <>
                  <div className="flex justify-between items-center py-2 px-3 rounded-xl bg-[#F0F9FA] text-[#135061] font-semibold border border-[#B2E2E6]">
                    <span className="flex items-center gap-1.5 text-xs sm:text-sm">
                      <CheckCircle className="w-4 h-4" />
                      Booking Deposit (to secure slot):
                    </span>
                    <span className="font-extrabold text-sm sm:text-base">
                      R{retainerAmount.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs text-zinc-500 px-1 pt-1">
                    <span>Remaining Balance (payable at appointment):</span>
                    <span className="font-semibold text-zinc-700">
                      R{balanceDue.toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 bg-zinc-50 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 transition-colors"
          >
            Close
          </button>

          <button
            onClick={() => {
              onClose();
              onBookNow(service);
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-xs font-bold text-white bg-[#135061] hover:bg-[#007C89] shadow-md transition-all active:scale-95"
          >
            <span>{isProduct ? "Proceed to Order & Pay" : "Proceed to Book This Treatment"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
