import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "./score-ring";
import { DeleteProspectButton } from "./delete-prospect-button";
import type { ProspectRecord, ProspectScore } from "@/lib/types";

const STATUS_LABELS: Record<string, string> = {
  new: "Queued",
  analyzing: "Analyzing",
  analyzed: "Analyzed",
  approved: "Approved",
  sent: "Sent",
};

export interface ProspectRowProps {
  prospect: ProspectRecord & { score: ProspectScore | null };
  showStatus?: boolean;
  /** Show a hover-reveal delete icon at the right edge. Default false. */
  showDelete?: boolean;
}

// Two-layer row so the inner Link doesn't swallow the delete button's clicks.
export function ProspectRow({ prospect: p, showStatus = true, showDelete = false }: ProspectRowProps) {
  return (
    <div className="group relative flex items-center gap-4 pr-2 transition-colors hover:bg-muted/50">
      <Link
        href={`/prospects/${p.slug}`}
        className="flex flex-1 items-center gap-4 px-6 py-4"
      >
        <ScoreRing score={p.score} />
        <div className="min-w-0 flex-1">
          <div className="font-serif text-lg tracking-tight text-charcoal-900 truncate">{p.name}</div>
          <div className="mt-0.5 truncate text-xs text-charcoal-500">
            {[p.city, p.state].filter(Boolean).join(", ") || "—"}
            {" · "}
            {p.website_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
          </div>
        </div>
        {showStatus && (
          <Badge
            variant={p.status === "approved" ? "accent" : p.status === "analyzing" ? "warn" : "muted"}
            className="shrink-0"
          >
            {STATUS_LABELS[p.status] ?? p.status}
          </Badge>
        )}
      </Link>
      {showDelete && (
        <DeleteProspectButton
          prospectId={p.id}
          prospectName={p.name}
          variant="icon"
          redirectTo="/prospects"
        />
      )}
    </div>
  );
}
