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
    <div className="card-surface p-7">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="font-serif text-xl leading-tight tracking-tight text-mare-extra-dark">Red flags</h3>
        <span className="font-display text-[10px] uppercase tracking-[0.22em] text-mare-dark/55">
          {flags.length === 0 ? "None" : `${flags.length} caught`}
        </span>
      </div>

      {flags.length === 0 ? (
        <p className="text-[14px] leading-[1.65] text-mare-dark/75">
          No flags. Proceed with normal review.
        </p>
      ) : (
        <ul className="space-y-3">
          {flags.map((f, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-sm border border-mare-brown/20 bg-mare-brown/5 px-3.5 py-3"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-mare-brown" />
              <div>
                <p className="text-sm font-medium text-mare-brown">{FLAG_LABELS[f.kind] ?? f.kind}</p>
                <p className="mt-1 text-[13px] leading-[1.6] text-mare-dark/80">{f.detail}</p>
                {f.source_url && (
                  <a
                    href={f.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block font-display text-[10px] uppercase tracking-[0.18em] text-mare-brown/80 underline-offset-2 hover:underline"
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
          <div className="hairline my-6" />
          <p className="font-display text-[10px] uppercase tracking-[0.22em] text-mare-dark/55">
            Analyst note
          </p>
          <p className="mt-2 text-[13px] italic leading-[1.7] text-mare-dark/85">{score.notes}</p>
        </>
      )}
    </div>
  );
}
