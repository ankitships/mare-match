"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

export interface ProgressPanelProps {
  steps: string[];                     // editorial phrases, in order
  active: boolean;                     // false = panel is hidden; true = cycling
  cycleMs?: number;                    // pace of step rotation when under way
  detail?: string;                     // small subtitle, e.g. domain being crawled
  className?: string;
}

// An inline editorial progress panel — rotates through `steps` while `active`
// is true, shows a hairline indeterminate bar, and keeps looping on the last
// step if the real work outlasts the step list.
export function ProgressPanel({ steps, active, cycleMs = 2200, detail, className }: ProgressPanelProps) {
  const [stepIdx, setStepIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active) {
      setStepIdx(0);
      setElapsed(0);
      return;
    }
    const startedAt = Date.now();
    const tick = setInterval(() => {
      setElapsed(Math.round((Date.now() - startedAt) / 1000));
    }, 500);
    const advance = setInterval(() => {
      setStepIdx((i) => Math.min(steps.length - 1, i + 1));
    }, cycleMs);
    return () => {
      clearInterval(tick);
      clearInterval(advance);
    };
  }, [active, cycleMs, steps.length]);

  if (!active) return null;

  return (
    <div className={cn("card-surface fade-in p-6", className)}>
      <div className="flex items-center gap-3">
        <Spinner className="text-accent-600" size="14px" />
        <p className="font-serif text-xl leading-tight text-charcoal-900">{steps[stepIdx]}</p>
      </div>

      {detail && (
        <p className="mt-1.5 pl-[26px] text-[11px] uppercase tracking-[0.18em] text-charcoal-500">
          {detail}
        </p>
      )}

      <div className="indeterminate-bar mt-5" />

      <ol className="mt-4 space-y-1 text-[11px] uppercase tracking-[0.16em]">
        {steps.map((s, i) => (
          <li
            key={i}
            className={cn(
              "flex items-center gap-2 transition-colors",
              i < stepIdx ? "text-charcoal-600" : i === stepIdx ? "text-charcoal-900" : "text-charcoal-500/50",
            )}
          >
            <span className="inline-flex h-3 w-3 items-center justify-center">
              {i < stepIdx ? (
                <Check className="h-3 w-3 text-accent-600" />
              ) : (
                <span
                  className={cn(
                    "h-1 w-1 rounded-full",
                    i === stepIdx ? "bg-accent-500" : "bg-charcoal-500/30",
                  )}
                />
              )}
            </span>
            <span className="truncate">{s}</span>
          </li>
        ))}
      </ol>

      <p className="mt-4 pl-[20px] font-mono text-[10px] tabular-nums text-charcoal-500">
        {String(elapsed).padStart(2, "0")}s elapsed · typically 8–15s
      </p>
    </div>
  );
}
