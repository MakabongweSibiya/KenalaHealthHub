"use client";

import React, { useEffect } from "react";
import { Check } from "lucide-react";

export interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message?: string;
  durationMs?: number;
  onClose: () => void;
}

export function ConfirmationModal({
  isOpen,
  title,
  message,
  durationMs = 2000,
  onClose,
}: ConfirmationModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      onClose();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [isOpen, durationMs, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-150 cursor-pointer"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white rounded-3xl p-7 border border-zinc-200 shadow-2xl text-center animate-in zoom-in-95 duration-200 cursor-default"
      >
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#F0F9FA] border border-[#B2E2E6] flex items-center justify-center">
          <Check className="w-7 h-7 text-[#135061] stroke-[2.75]" />
        </div>
        <h3 className="text-lg font-extrabold text-zinc-900 tracking-tight">
          {title}
        </h3>
        {message && (
          <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
            {message}
          </p>
        )}
        <p className="text-[10px] text-zinc-400 mt-4">
          Click anywhere outside to dismiss
        </p>
      </div>
    </div>
  );
}
