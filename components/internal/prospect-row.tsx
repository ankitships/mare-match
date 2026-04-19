import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "./score-ring";
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
}

export function ProspectRow({ prospect: p, showStatus = true }: ProspectRowProps) {
  return (
    <Link
      href={`/prospects/${p.slug}`}
      className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/50"
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
  );
}
