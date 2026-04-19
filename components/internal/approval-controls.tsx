"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Copy, ExternalLink } from "lucide-react";

import { LoadingButton } from "@/components/ui/loading-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusNotice } from "@/components/ui/status-notice";
import type { ApprovalState } from "@/lib/types";
import { cn } from "@/lib/utils";

const GATE_COPY: Record<string, { title: string; sub: string }> = {
  fit_score: { title: "Fit score", sub: "Approve the scoring and recommendation" },
  microsite: { title: "Microsite", sub: "Approve the external partner page" },
  outreach: { title: "Outreach", sub: "Approve email / DM / postcard / opener" },
};

type Gate = "fit_score" | "microsite" | "outreach";

export function ApprovalControls({
  prospectId,
  initial,
  hasMicrosite,
  hasOutreach,
  micrositePublished,
  prospectSlug,
}: {
  prospectId: string;
  initial: ApprovalState;
  hasMicrosite: boolean;
  hasOutreach: boolean;
  micrositePublished: boolean;
  prospectSlug: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<ApprovalState>(initial);
  const [pendingGate, setPendingGate] = useState<Gate | null>(null);
  const [publishPending, setPublishPending] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const allApproved = state.fit_score_approved && state.microsite_approved && state.outreach_approved;
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/partner/${prospectSlug}` : "";
  const approvedCount = Number(state.fit_score_approved) + Number(state.microsite_approved) + Number(state.outreach_approved);

  async function toggle(gate: Gate, value: boolean) {
    setPendingGate(gate);
    try {
      const res = await fetch("/api/approve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prospect_id: prospectId, gate, value }),
      });
      const json = await res.json();
      if (json.ok) {
        setState(json.approval);
        if (value) setNotice(`${GATE_COPY[gate].title} approved`);
        startTransition(() => router.refresh());
      } else {
        setNotice("Could not update approval");
      }
    } catch {
      setNotice("Could not update approval");
    } finally {
      setPendingGate(null);
    }
  }

  async function togglePublish() {
    setPublishPending(true);
    try {
      await fetch("/api/microsite", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prospect_id: prospectId, published: !micrositePublished }),
      });
      setNotice(micrositePublished ? "Microsite unpublished" : "Microsite published — shareable");
      startTransition(() => router.refresh());
    } finally {
      setPublishPending(false);
    }
  }

  async function copyShare() {
    await navigator.clipboard.writeText(shareUrl);
    setShareCopied(true);
    setNotice("Share link copied");
    setTimeout(() => setShareCopied(false), 1600);
  }

  return (
    <div className="card-surface p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="font-serif text-xl tracking-tight">Approval</h3>
        {allApproved ? (
          <Badge variant="accent">Ready to send</Badge>
        ) : (
          <Badge variant="muted">{`${approvedCount}/3`}</Badge>
        )}
      </div>

      <ul className="space-y-2">
        {(["fit_score", "microsite", "outreach"] as const).map((g) => {
          const approved = state[`${g}_approved`];
          const isPending = pendingGate === g;
          const disabled =
            (g === "microsite" && !hasMicrosite) ||
            (g === "outreach" && !hasOutreach) ||
            (pendingGate !== null && pendingGate !== g);
          return (
            <li
              key={g}
              className={cn(
                "flex items-center justify-between gap-3 rounded-md border px-3 py-2.5 transition-colors",
                approved ? "border-accent-500/30 bg-accent-500/5" : "border-border",
              )}
            >
              <div>
                <p className="text-sm font-medium text-charcoal-900">{GATE_COPY[g].title}</p>
                <p className="text-[11px] text-charcoal-500">{GATE_COPY[g].sub}</p>
              </div>
              <LoadingButton
                size="sm"
                variant={approved ? "accent" : "outline"}
                loading={isPending}
                loadingText={approved ? "Undoing" : "Approving"}
                disabled={disabled}
                onClick={() => toggle(g, !approved)}
              >
                {approved ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Approved
                  </>
                ) : (
                  "Approve"
                )}
              </LoadingButton>
            </li>
          );
        })}
      </ul>

      {hasMicrosite && (
        <>
          <div className="hairline my-5" />
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-charcoal-500">Private microsite</p>
            <div className="flex flex-wrap gap-2">
              <Link href={`/partner/${prospectSlug}`} target="_blank">
                <Button variant="outline" size="sm">
                  Preview <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={copyShare}
                disabled={!allApproved && !micrositePublished}
              >
                {shareCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {shareCopied ? "Copied" : "Copy share link"}
              </Button>
              <LoadingButton
                variant={micrositePublished ? "accent" : "default"}
                size="sm"
                loading={publishPending}
                loadingText={micrositePublished ? "Unpublishing" : "Publishing"}
                onClick={togglePublish}
                disabled={!state.microsite_approved}
              >
                {micrositePublished ? "Published" : "Publish"}
              </LoadingButton>
            </div>
            {!state.microsite_approved && (
              <p className="text-[11px] text-charcoal-500">Approve the microsite to enable publishing.</p>
            )}
          </div>
        </>
      )}

      {allApproved && (
        <div className="mt-5 rounded-md border border-accent-500/30 bg-accent-500/5 p-3 fade-in">
          <p className="text-sm font-medium text-accent-600">All three gates approved.</p>
          <p className="mt-1 text-xs leading-relaxed text-charcoal-700">
            Copy the share link above, or hand off to the partnerships team. Nothing is auto-sent.
          </p>
        </div>
      )}

      <StatusNotice open={!!notice} onClose={() => setNotice(null)} message={notice ?? ""} />
    </div>
  );
}
