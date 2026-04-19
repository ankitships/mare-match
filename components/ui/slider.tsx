"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  suffix?: string;
  format?: (v: number) => string;
}

export function Slider({ label, suffix, format, className, ...props }: SliderProps) {
  const v = Number(props.value ?? props.defaultValue ?? 0);
  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-charcoal-600">{label}</span>
          <span className="font-serif text-base tabular-nums text-charcoal-900">
            {format ? format(v) : v}
            {suffix && <span className="text-charcoal-500 ml-1 text-xs">{suffix}</span>}
          </span>
        </div>
      )}
      <input
        type="range"
        className={cn(
          "h-1 w-full cursor-pointer appearance-none rounded-full bg-charcoal-900/10",
          "[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-500 [&::-webkit-slider-thumb]:shadow",
          className,
        )}
        {...props}
      />
    </div>
  );
}
