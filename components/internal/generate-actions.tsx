"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Mail, RotateCw } from "lucide-react";

import { LoadingButton } from "@/components/ui/loading-button";
import { Button } from "@/components/ui/button";
import { StatusNotice } from "@/components/ui/status-notice";
import { Spinner } from "@/components/ui/spinner";

type Kind = "microsite" | "outreach" | null;

const STATUS_COPY: Record<Exclude<Kind, null>, { working: string; done: string }> = {
  microsite: {
    working: "Writing the microsite — composing hero, why selected, system points, implementation…",
    done: "Microsite regenerated",
  },
  outreach: {
    working: "Drafting outreach — email, DM, postcard, call opener…",
    done: "Outreach regenerated",
  },
};

export function GenerateActions({
  prospectId,
  slug,
  hasMicrosite,
  hasOutreach,
}: {
  prospectId: string;
  slug: string;
  hasMicrosite: boolean;
  hasOutreach: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<Kind>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function call(path: string, kind: Exclude<Kind, null>) {
    setLoading(kind);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prospect_id: prospectId }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setNotice(`Could not regenerate — ${json?.error ?? res.status}`);
      } else {
        setNotice(STATUS_COPY[kind].done);
      }
      startTransition(() => router.refresh());
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex w-full flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <LoadingButton
          variant="outline"
          size="sm"
          onClick={() => call("/api/microsite", "microsite")}
          loading={loading === "microsite"}
          loadingText={hasMicrosite ? "Regenerating" : "Generating"}
          disabled={loading !== null && loading !== "microsite"}
        >
          <Sparkles className="h-3.5 w-3.5" />
          {hasMicrosite ? "Regenerate microsite" : "Generate microsite"}
        </LoadingButton>

        <LoadingButton
          variant="outline"
          size="sm"
          onClick={() => call("/api/outreach", "outreach")}
          loading={loading === "outreach"}
          loadingText={hasOutreach ? "Regenerating" : "Generating"}
          disabled={(loading !== null && loading !== "outreach") || !hasMicrosite}
        >
          <Mail className="h-3.5 w-3.5" />
          {hasOutreach ? "Regenerate outreach" : "Generate outreach"}
        </LoadingButton>

        {hasOutreach && (
          <Link href={`/prospects/${slug}/outreach`}>
            <Button size="sm" disabled={loading !== null}>
              <RotateCw className="h-3.5 w-3.5" /> Open outreach studio
            </Button>
          </Link>
        )}
      </div>

      {loading && (
        <p className="fade-in flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-charcoal-500">
          <Spinner className="text-accent-600" size="10px" />
          {STATUS_COPY[loading].working}
        </p>
      )}

      <StatusNotice open={!!notice} onClose={() => setNotice(null)} message={notice ?? ""} />
    </div>
  );
}
