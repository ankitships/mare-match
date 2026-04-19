"use client";

import { useMemo, useState } from "react";
import { ProspectRow } from "./prospect-row";
import type { ProspectRecord, ProspectScore, Recommendation } from "@/lib/types";
import { cn } from "@/lib/utils";

type ProspectWithScore = ProspectRecord & { score: ProspectScore | null };
type SortMode = "recent" | "score_desc" | "score_asc";
type FitFilter = "all" | Recommendation | "unscored";

const SORT_OPTIONS: Array<{ id: SortMode; label: string }> = [
  { id: "recent", label: "Recent" },
  { id: "score_desc", label: "Score ↓" },
  { id: "score_asc", label: "Score ↑" },
];

const FIT_OPTIONS: Array<{ id: FitFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "strong_fit", label: "Strong" },
  { id: "worth_reviewing", label: "Worth reviewing" },
  { id: "not_a_fit", label: "Not a fit" },
  { id: "unscored", label: "Unscored" },
];

function bucketOf(p: ProspectWithScore): FitFilter {
  if (!p.score) return "unscored";
  return p.score.recommendation;
}

export function ProspectsList({ rows }: { rows: ProspectWithScore[] }) {
  const [sort, setSort] = useState<SortMode>("recent");
  const [fit, setFit] = useState<FitFilter>("all");

  const counts = useMemo(() => {
    const c: Record<FitFilter, number> = {
      all: rows.length,
      strong_fit: 0,
      worth_reviewing: 0,
      not_a_fit: 0,
      unscored: 0,
    };
    for (const r of rows) c[bucketOf(r)]++;
    return c;
  }, [rows]);

  const visible = useMemo(() => {
    const filtered = fit === "all" ? rows : rows.filter((p) => bucketOf(p) === fit);
    const sorted = [...filtered];
    if (sort === "score_desc" || sort === "score_asc") {
      const dir = sort === "score_desc" ? -1 : 1;
      sorted.sort((a, b) => {
        const as = a.score?.total ?? null;
        const bs = b.score?.total ?? null;
        if (as === null && bs === null) return 0;
        if (as === null) return 1;     // unscored sinks to bottom in both directions
        if (bs === null) return -1;
        return (as - bs) * dir;
      });
    } else {
      sorted.sort((a, b) => (a.created_at > b.created_at ? -1 : 1));
    }
    return sorted;
  }, [rows, sort, fit]);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-x-8 gap-y-3">
        <ControlGroup label="Sort">
          {SORT_OPTIONS.map((o) => (
            <Pill key={o.id} active={sort === o.id} onClick={() => setSort(o.id)}>
              {o.label}
            </Pill>
          ))}
        </ControlGroup>

        <ControlGroup label="Fit">
          {FIT_OPTIONS.map((o) => {
            const count = counts[o.id];
            if (o.id !== "all" && count === 0) return null;
            return (
              <Pill key={o.id} active={fit === o.id} onClick={() => setFit(o.id)}>
                {o.label}
                <span className="ml-1.5 text-charcoal-500/70 tabular-nums">{count}</span>
              </Pill>
            );
          })}
        </ControlGroup>
      </div>

      <div className="card-surface">
        {visible.length === 0 ? (
          <div className="p-10 text-sm text-charcoal-600 fade-in">No prospects in this view.</div>
        ) : (
          <ul className="divide-y divide-border fade-in">
            {visible.map((p) => (
              <li key={p.id}>
                <ProspectRow prospect={p} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function ControlGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-[0.22em] text-charcoal-500">{label}</span>
      <div className="flex items-center gap-0.5">{children}</div>
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative rounded-sm px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] transition-colors",
        active ? "text-charcoal-900" : "text-charcoal-500 hover:text-charcoal-900",
      )}
    >
      {children}
      <span
        className={cn(
          "absolute inset-x-2.5 -bottom-[1px] h-[1px] transition-opacity",
          active ? "bg-charcoal-900 opacity-100" : "opacity-0",
        )}
      />
    </button>
  );
}
