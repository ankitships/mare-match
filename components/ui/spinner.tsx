import { cn } from "@/lib/utils";

// A restrained, editorial spinner: thin ring with a short accent arc.
// Scales with the text it sits next to via `em` sizing.
export function Spinner({ className, size = "1em" }: { className?: string; size?: string | number }) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn("inline-block animate-spin", className)}
      style={{ width: s, height: s }}
    >
      <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

// Animated ellipsis — for inline text like "Analyzing…".
// Mark as inert to screen readers since the sibling text conveys the state.
export function TypingDots({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("inline-flex gap-[2px]", className)}>
      <span className="h-[3px] w-[3px] rounded-full bg-current opacity-60 animate-[mare-dot_1.2s_ease-in-out_infinite]" />
      <span className="h-[3px] w-[3px] rounded-full bg-current opacity-60 animate-[mare-dot_1.2s_ease-in-out_infinite_200ms]" />
      <span className="h-[3px] w-[3px] rounded-full bg-current opacity-60 animate-[mare-dot_1.2s_ease-in-out_infinite_400ms]" />
    </span>
  );
}
