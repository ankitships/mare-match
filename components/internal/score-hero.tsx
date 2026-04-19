import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABELS, type ProspectScore } from "@/lib/types";
import { cn } from "@/lib/utils";

const RECOMMENDATION_LABEL: Record<string, string> = {
  strong_fit: "Strong fit",
  worth_reviewing: "Worth reviewing",
  not_a_fit: "Not a fit",
};

const REVENUE_BANDS: Record<string, { label: string; sentence: string }> = {
  likely_above_1m: { label: "Likely above $1M", sentence: "Revenue likely above the $1M target." },
  possibly_above_1m: { label: "Possibly above $1M", sentence: "Revenue may reach the $1M target." },
  insufficient_evidence: { label: "Insufficient evidence", sentence: "Too little signal to call it yet." },
  likely_below_target: { label: "Likely below target", sentence: "Revenue likely below the $1M target." },
};

export function ScoreHero({ score, explain }: { score: ProspectScore; explain: string[] }) {
  const band = REVENUE_BANDS[score.revenue_band] ?? REVENUE_BANDS.insufficient_evidence;

  return (
    <section className="card-surface overflow-hidden">
      <div className="grid gap-10 p-10 lg:grid-cols-[260px,1fr] lg:gap-14 lg:p-12">
        {/* Big number */}
        <div className="flex flex-col justify-between">
          <p className="font-display text-[10px] font-medium uppercase tracking-[0.26em] text-mare-dark/60">
            Fit score
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif text-[104px] font-medium leading-[0.85] tracking-tight text-mare-extra-dark tabular-nums">
              {Math.round(score.total)}
            </span>
            <span className="font-serif text-3xl text-mare-dark/40">/100</span>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Badge
              variant={
                score.recommendation === "strong_fit"
                  ? "accent"
                  : score.recommendation === "worth_reviewing"
                  ? "default"
                  : "outline"
              }
            >
              {RECOMMENDATION_LABEL[score.recommendation]}
            </Badge>
            <Badge variant="muted">Confidence · {score.confidence}</Badge>
          </div>
        </div>

        {/* Subcategory breakdown */}
        <div>
          <div className="mb-6 flex items-baseline justify-between">
            <p className="font-display text-[10px] font-medium uppercase tracking-[0.26em] text-mare-dark/60">
              Category breakdown
            </p>
            <p className="font-display text-[10px] font-medium uppercase tracking-[0.22em] text-mare-dark/45">
              Weighted · 0–100
            </p>
          </div>

          <ul className="space-y-3.5">
            {score.scored_categories.map((c) => {
              const pct = (c.weighted_subscore / c.weight) * 100;
              return (
                <li key={c.category} className="grid grid-cols-[1fr,11rem,56px] items-center gap-4 text-sm">
                  <span className="truncate text-mare-dark/85">{CATEGORY_LABELS[c.category]}</span>
                  <div className="relative h-[5px] w-full overflow-hidden rounded-full bg-mare-extra-dark/5">
                    <div
                      className={cn(
                        "absolute left-0 top-0 h-full rounded-full transition-all",
                        c.raw_subscore >= 7
                          ? "bg-mare-key"
                          : c.raw_subscore >= 4
                          ? "bg-mare-dark/50"
                          : "bg-mare-extra-dark/15",
                      )}
                      style={{ width: `${Math.max(3, Math.min(100, pct))}%` }}
                    />
                  </div>
                  <span className="text-right font-display text-[11px] tabular-nums text-mare-extra-dark">
                    {c.weighted_subscore.toFixed(1)}/{c.weight}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="hairline my-8" />

          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <p className="font-display text-[10px] font-medium uppercase tracking-[0.24em] text-mare-dark/60">
                Revenue
              </p>
              <p className="mt-2 font-serif text-xl leading-tight tracking-tight text-mare-extra-dark">
                {band.sentence}
              </p>
              <p className="mt-2 font-display text-[10px] uppercase tracking-[0.2em] text-mare-dark/50">
                Confidence · {score.revenue_confidence}
              </p>
            </div>
            <div>
              <p className="font-display text-[10px] font-medium uppercase tracking-[0.24em] text-mare-dark/60">
                How this was computed
              </p>
              <ul className="mt-2 space-y-1 text-[12px] leading-relaxed text-mare-dark/75">
                {explain.map((e, i) => (
                  <li key={i}>· {e}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
