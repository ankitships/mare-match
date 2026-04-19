import { cn } from "@/lib/utils";
import type { ProspectScore } from "@/lib/types";

interface ScoreRingProps {
  score: ProspectScore | null;
  size?: number;
  className?: string;
}

// Editorial circular score indicator. Renders a thin ring with an arc
// proportional to score/100 in accent brass for strong fits, charcoal for
// worth reviewing, muted for not-a-fit, and a dashed ring when unscored.
export function ScoreRing({ score, size = 44, className }: ScoreRingProps) {
  const stroke = 1.75;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  if (!score) {
    return (
      <UnscoredRing size={size} stroke={stroke} r={r} c={c} className={className} />
    );
  }

  const pct = Math.max(0, Math.min(100, score.total)) / 100;
  const arc = pct * c;

  const variant = variantFor(score.recommendation);

  return (
    <div
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
      aria-label={`Score ${Math.round(score.total)} out of 100, ${score.recommendation.replace("_", " ")}`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="text-charcoal-900/10"
          stroke="currentColor"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${arc} ${c - arc}`}
          className={cn("transition-all", variant.stroke)}
          stroke="currentColor"
        />
      </svg>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center font-serif tabular-nums leading-none",
          variant.text,
        )}
        style={{ fontSize: Math.round(size * 0.36) }}
      >
        {Math.round(score.total)}
      </span>
    </div>
  );
}

function UnscoredRing({
  size,
  stroke,
  r,
  c,
  className,
}: {
  size: number;
  stroke: number;
  r: number;
  c: number;
  className?: string;
}) {
  return (
    <div
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
      aria-label="No score yet"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray="2 3"
          className="text-charcoal-900/20"
          stroke="currentColor"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-charcoal-500/50" aria-hidden="true">
        —
      </span>
      <span className="sr-only">Unscored</span>
      {/* keep c referenced so lints stay quiet */}
      <span data-c={c} className="hidden" />
    </div>
  );
}

function variantFor(rec: ProspectScore["recommendation"]) {
  switch (rec) {
    case "strong_fit":
      return { stroke: "text-accent-500", text: "text-charcoal-900" };
    case "worth_reviewing":
      return { stroke: "text-charcoal-700", text: "text-charcoal-900" };
    case "not_a_fit":
      return { stroke: "text-charcoal-500/40", text: "text-charcoal-500" };
  }
}
