import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABELS, type ProspectScore } from "@/lib/types";
import { cn } from "@/lib/utils";

const RECOMMENDATION_LABEL: Record<string, string> = {
  strong_fit: "Strong fit",
  worth_reviewing: "Worth reviewing",
  not_a_fit: "Not a fit",
};

const REVENUE_LABEL: Record<string, string> = {
  likely_above_1m: "Likely above $1M",
  possibly_above_1m: "Possibly above $1M",
  insufficient_evidence: "Insufficient evidence",
  likely_below_target: "Likely below target",
};

export function ScoreHero({ score, explain }: { score: ProspectScore; explain: string[] }) {
  return (
    <section className="card-surface overflow-hidden">
      <div className="grid gap-8 p-8 md:grid-cols-[auto,1fr] md:p-10">
        {/* Big number */}
        <div className="flex min-w-[220px] flex-col justify-between">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-charcoal-500">
            Luxury fit score
          </p>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-[96px] leading-none tracking-tighter text-charcoal-900 tabular-nums">
              {Math.round(score.total)}
            </span>
            <span className="font-serif text-3xl text-charcoal-500">/100</span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant={score.recommendation === "strong_fit" ? "accent" : score.recommendation === "worth_reviewing" ? "default" : "outline"}>
              {RECOMMENDATION_LABEL[score.recommendation]}
            </Badge>
            <Badge variant="muted">Confidence · {score.confidence}</Badge>
          </div>
        </div>

        {/* Subcategory bar chart */}
        <div>
          <div className="mb-5 flex items-baseline justify-between">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-charcoal-500">
              Category breakdown
            </p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-charcoal-500">Weighted · 0–100</p>
          </div>

          <ul className="space-y-3">
            {score.scored_categories.map((c) => {
              const pct = (c.weighted_subscore / c.weight) * 100; // 0..100 within its own cap
              return (
                <li key={c.category} className="grid grid-cols-[1fr,auto,48px] items-center gap-4 text-sm">
                  <span className="truncate text-charcoal-700">{CATEGORY_LABELS[c.category]}</span>
                  <div className="relative h-[6px] w-44 overflow-hidden rounded-full bg-charcoal-900/8">
                    <div
                      className={cn(
                        "absolute left-0 top-0 h-full rounded-full",
                        c.raw_subscore >= 7 ? "bg-accent-500" : c.raw_subscore >= 4 ? "bg-charcoal-600" : "bg-charcoal-800/30",
                      )}
                      style={{ width: `${Math.max(3, Math.min(100, pct))}%` }}
                    />
                  </div>
                  <span className="text-right font-mono text-xs tabular-nums text-charcoal-900">
                    {c.weighted_subscore.toFixed(1)}/{c.weight}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="hairline my-6" />

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-charcoal-500">Revenue band</p>
              <p className="mt-1 font-serif text-xl text-charcoal-900">{REVENUE_LABEL[score.revenue_band]}</p>
              <p className="mt-1 text-xs text-charcoal-500">Confidence · {score.revenue_confidence}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-charcoal-500">How this was computed</p>
              <ul className="mt-1 space-y-0.5 text-xs leading-relaxed text-charcoal-600">
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
