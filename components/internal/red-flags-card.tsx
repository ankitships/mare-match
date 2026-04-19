import { AlertTriangle } from "lucide-react";
import type { ProspectScore } from "@/lib/types";

const FLAG_LABELS: Record<string, string> = {
  mass_market_discount: "Mass-market discount positioning",
  heavy_coupon_behavior: "Heavy coupon behavior",
  low_end_aesthetic: "Low-end aesthetic",
  poor_service_presentation: "Poor service presentation",
  operational_mismatch: "Operational mismatch",
  weak_clientele_signal: "Weak clientele signal",
};

export function RedFlagsCard({ score }: { score: ProspectScore }) {
  const flags = score.hard_fail_flags;

  return (
    <div className="card-surface p-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-serif text-xl tracking-tight">Red flags</h3>
        <span className="text-[11px] uppercase tracking-[0.18em] text-charcoal-500">
          {flags.length === 0 ? "None" : `${flags.length} caught`}
        </span>
      </div>

      {flags.length === 0 ? (
        <p className="text-sm leading-relaxed text-charcoal-600">
          No hard-fail guardrails triggered. Proceed with normal review.
        </p>
      ) : (
        <ul className="space-y-3">
          {flags.map((f, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-md border border-amber-600/20 bg-amber-500/5 p-3"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              <div>
                <p className="text-sm font-medium text-amber-900">
                  {FLAG_LABELS[f.kind] ?? f.kind}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-amber-800/90">{f.detail}</p>
                {f.source_url && (
                  <a
                    href={f.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-[11px] text-amber-800/80 underline-offset-2 hover:underline"
                  >
                    source
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {score.notes && (
        <>
          <div className="hairline my-5" />
          <p className="text-[11px] uppercase tracking-[0.18em] text-charcoal-500">Analyst note</p>
          <p className="mt-1 text-sm italic leading-relaxed text-charcoal-700">{score.notes}</p>
        </>
      )}
    </div>
  );
}
