"use client";

import { useEffect } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusNoticeProps {
  open: boolean;
  onClose: () => void;
  message: string;
  tone?: "success" | "error";
  ttlMs?: number;
}

// Bottom-right status notice. Disappears after ttlMs. Editorial, not a modal.
export function StatusNotice({ open, onClose, message, tone = "success", ttlMs = 2600 }: StatusNoticeProps) {
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(onClose, ttlMs);
    return () => clearTimeout(id);
  }, [open, ttlMs, onClose]);

  if (!open) return null;

  return (
    <div
      role="status"
      className={cn(
        "fade-in fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-md border bg-card px-4 py-3 premium-shadow",
        tone === "success" ? "border-accent-500/30" : "border-amber-600/30",
      )}
    >
      <span
        className={cn(
          "inline-flex h-5 w-5 items-center justify-center rounded-full",
          tone === "success" ? "bg-accent-500/10 text-accent-600" : "bg-amber-500/10 text-amber-700",
        )}
      >
        {tone === "success" ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      </span>
      <p className="text-sm text-charcoal-900">{message}</p>
    </div>
  );
}
