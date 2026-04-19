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
      <div className="flex items-baseline justify-between px-8 pt-8">
        <h2 className="font-serif text-2xl leading-tight tracking-tight text-mare-extra-dark">Evidence</h2>
        <p className="font-display text-[10px] font-medium uppercase tracking-[0.24em] text-mare-dark/55">
          Traced to source
        </p>
      </div>

      <div className="mt-5 overflow-x-auto border-b border-mare-light">
        <div className="flex min-w-max px-8">
          {score.scored_categories.map((c) => (
            <button
              key={c.category}
              onClick={() => setActive(c.category)}
              className={cn(
                "relative shrink-0 px-3 py-3.5 font-display text-[10px] font-medium uppercase tracking-[0.16em] transition-colors",
                active === c.category ? "text-mare-extra-dark" : "text-mare-dark/50 hover:text-mare-extra-dark",
              )}
            >
              <span className="mr-2 inline-block w-5 text-right font-mono text-[10px] tabular-nums text-mare-dark/60">
                {c.raw_subscore.toFixed(1)}
              </span>
              {CATEGORY_LABELS[c.category].split(" ")[0]}
              {active === c.category && (
                <span className="absolute inset-x-3 bottom-[-1px] h-[2px] bg-mare-extra-dark" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-8">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <h3 className="font-serif text-[26px] leading-tight tracking-tight text-mare-extra-dark">
              {CATEGORY_LABELS[current.category]}
            </h3>
            <p className="mt-2 font-display text-[11px] uppercase tracking-[0.2em] text-mare-dark/55">
              Subscore · {current.raw_subscore.toFixed(1)}/10 · weight {current.weight} · confidence {current.confidence}
            </p>
          </div>
          <Badge
            variant={
              current.confidence === "high" ? "accent" : current.confidence === "medium" ? "muted" : "outline"
            }
          >
            {current.confidence} confidence
          </Badge>
        </div>

        {current.missing_data_note && (
          <div className="mb-6 flex items-start gap-2 rounded-sm border border-mare-light bg-mare-light/30 px-4 py-3 text-[13px] text-mare-dark/85">
            <Minus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mare-dark/60" />
            <span>{current.missing_data_note}</span>
          </div>
        )}

        {current.evidence.length === 0 ? (
          <p className="text-sm text-mare-dark/70">No signals for this category yet.</p>
        ) : (
          <ul className="space-y-6">
            {current.evidence.map((e, i) => (
              <li key={i} className="group relative border-l-2 border-mare-key/35 pl-5">
                <p className="text-[15px] leading-[1.65] text-mare-extra-dark">{e.claim}</p>
                {e.excerpt && (
                  <p className="mt-1.5 text-[14px] italic leading-[1.7] text-mare-dark/75">"{e.excerpt}"</p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-display text-[10px] uppercase tracking-[0.18em] text-mare-dark/55">
                  <span>{e.source_type.replace(/_/g, " ")}</span>
                  <span>conf · {e.confidence}</span>
                  {e.source_url && (
                    <a
                      href={e.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-mare-key hover:text-mare-brown"
                    >
                      source <ExternalLink className="h-3 w-3" />
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
