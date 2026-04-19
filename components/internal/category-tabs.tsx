"use client";

import { useState } from "react";
import { ExternalLink, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABELS, type ProspectScore, type ScoreCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CategoryTabs({ score }: { score: ProspectScore }) {
  const [active, setActive] = useState<ScoreCategory>(score.scored_categories[0].category);
  const current = score.scored_categories.find((c) => c.category === active)!;

  return (
    <div className="card-surface">
      <div className="flex items-baseline justify-between px-6 pt-6">
        <h2 className="font-serif text-xl tracking-tight">Evidence</h2>
        <p className="text-[11px] uppercase tracking-[0.18em] text-charcoal-500">
          Traced to source
        </p>
      </div>

      <div className="mt-4 overflow-x-auto border-b border-border">
        <div className="flex min-w-max px-6">
          {score.scored_categories.map((c) => (
            <button
              key={c.category}
              onClick={() => setActive(c.category)}
              className={cn(
                "relative shrink-0 px-3 py-3 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors",
                active === c.category
                  ? "text-charcoal-900"
                  : "text-charcoal-500 hover:text-charcoal-900",
              )}
            >
              <span className="mr-2 inline-block w-5 text-right font-mono text-[10px] tabular-nums text-charcoal-500">
                {c.raw_subscore.toFixed(1)}
              </span>
              {CATEGORY_LABELS[c.category].split(" ")[0]}
              {active === c.category && (
                <span className="absolute inset-x-3 bottom-[-1px] h-[2px] bg-charcoal-900" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h3 className="font-serif text-2xl tracking-tight text-charcoal-900">
              {CATEGORY_LABELS[current.category]}
            </h3>
            <p className="mt-1 text-xs text-charcoal-500">
              Subscore · {current.raw_subscore.toFixed(1)}/10 · weight {current.weight} · confidence {current.confidence}
            </p>
          </div>
          <Badge variant={current.confidence === "high" ? "accent" : current.confidence === "medium" ? "muted" : "outline"}>
            {current.confidence} confidence
          </Badge>
        </div>

        {current.missing_data_note && (
          <div className="mb-4 flex items-start gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-charcoal-700">
            <Minus className="mt-0.5 h-3 w-3 shrink-0 text-charcoal-500" />
            <span>{current.missing_data_note}</span>
          </div>
        )}

        {current.evidence.length === 0 ? (
          <p className="text-sm text-charcoal-600">No evidence extracted for this category.</p>
        ) : (
          <ul className="space-y-4">
            {current.evidence.map((e, i) => (
              <li key={i} className="group relative border-l-2 border-accent-500/40 pl-4">
                <p className="text-sm leading-relaxed text-charcoal-900">{e.claim}</p>
                {e.excerpt && (
                  <p className="mt-1 text-sm italic leading-relaxed text-charcoal-600">“{e.excerpt}”</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-charcoal-500">
                  <span className="uppercase tracking-[0.14em]">{e.source_type.replace(/_/g, " ")}</span>
                  <span className="uppercase tracking-[0.14em]">conf · {e.confidence}</span>
                  {e.source_url && (
                    <a
                      href={e.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:text-charcoal-900"
                    >
                      view source <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
