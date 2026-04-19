"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCw, Save, Copy, Check, AlertTriangle } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LoadingButton } from "@/components/ui/loading-button";
import { StatusNotice } from "@/components/ui/status-notice";
import { Spinner } from "@/components/ui/spinner";
import { detectBannedPhrases } from "@/lib/schemas/outreach";

export interface OutreachDraft {
  email_subject: string;
  email_body: string;
  dm_body: string;
  postcard_copy: string;
  call_opener: string;
}

export function OutreachStudio({
  prospectId,
  initial,
  version,
}: {
  prospectId: string;
  slug: string;
  initial: OutreachDraft;
  version: number;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<OutreachDraft>(initial);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function update<K extends keyof OutreachDraft>(k: K, v: string) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  const allText = [draft.email_subject, draft.email_body, draft.dm_body, draft.postcard_copy, draft.call_opener].join("\n");
  const banned = detectBannedPhrases(allText);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/outreach", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prospect_id: prospectId, ...draft }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.ok) setNotice(`Saved as version ${json.version}`);
      else setNotice("Save failed");
      startTransition(() => router.refresh());
    } finally {
      setSaving(false);
    }
  }

  async function regenerate() {
    setRegenerating(true);
    try {
      const res = await fetch("/api/outreach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prospect_id: prospectId }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.ok) setNotice(`Regenerated — now version ${json.version}`);
      else setNotice("Regeneration failed");
      startTransition(() => router.refresh());
    } finally {
      setRegenerating(false);
    }
  }

  async function copyField(label: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setNotice("Copied to clipboard");
    setTimeout(() => setCopied(null), 1600);
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="muted">{`Version ${version}`}</Badge>
        <LoadingButton
          variant="outline"
          size="sm"
          loading={regenerating}
          loadingText="Regenerating"
          disabled={saving}
          onClick={regenerate}
        >
          <RotateCw className="h-3.5 w-3.5" /> Regenerate
        </LoadingButton>
        <LoadingButton
          size="sm"
          loading={saving}
          loadingText="Saving"
          disabled={regenerating}
          onClick={save}
        >
          <Save className="h-3.5 w-3.5" /> Save draft
        </LoadingButton>
        {banned.length > 0 && (
          <Badge variant="warn">
            <AlertTriangle className="mr-1 h-3 w-3" /> {banned.length} banned phrase{banned.length > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {regenerating && (
        <p className="fade-in flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-charcoal-500">
          <Spinner className="text-accent-600" size="10px" />
          Drafting email, DM, postcard, and call opener…
        </p>
      )}

      {banned.length > 0 && (
        <div className="rounded-md border border-amber-600/30 bg-amber-500/5 p-3 text-xs text-amber-900">
          <p className="font-medium">Tone check:</p>
          <p className="mt-1">Detected: {banned.map((b) => `"${b}"`).join(", ")}. Prefer specific, restrained language.</p>
        </div>
      )}

      <Tabs defaultValue="email" className="w-full">
        <TabsList>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="dm">DM / Instagram</TabsTrigger>
          <TabsTrigger value="postcard">Postcard</TabsTrigger>
          <TabsTrigger value="call">Call opener</TabsTrigger>
        </TabsList>

        <TabsContent value="email">
          <div className="card-surface space-y-4 p-6">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="email_subject">Subject</Label>
              <CopyBtn onClick={() => copyField("email_subject", draft.email_subject)} copied={copied === "email_subject"} />
            </div>
            <Input
              id="email_subject"
              value={draft.email_subject}
              onChange={(e) => update("email_subject", e.currentTarget.value)}
            />

            <div className="flex items-baseline justify-between">
              <Label htmlFor="email_body">Body</Label>
              <CopyBtn onClick={() => copyField("email_body", draft.email_body)} copied={copied === "email_body"} />
            </div>
            <Textarea
              id="email_body"
              rows={14}
              value={draft.email_body}
              onChange={(e) => update("email_body", e.currentTarget.value)}
              className="font-[450]"
            />
          </div>
        </TabsContent>

        <TabsContent value="dm">
          <FieldCard
            label="DM / Instagram"
            rows={6}
            value={draft.dm_body}
            onChange={(v) => update("dm_body", v)}
            onCopy={() => copyField("dm", draft.dm_body)}
            copied={copied === "dm"}
          />
        </TabsContent>

        <TabsContent value="postcard">
          <FieldCard
            label="Postcard copy"
            rows={5}
            value={draft.postcard_copy}
            onChange={(v) => update("postcard_copy", v)}
            onCopy={() => copyField("postcard", draft.postcard_copy)}
            copied={copied === "postcard"}
          />
        </TabsContent>

        <TabsContent value="call">
          <FieldCard
            label="Call opener (first 15 seconds)"
            rows={4}
            value={draft.call_opener}
            onChange={(v) => update("call_opener", v)}
            onCopy={() => copyField("call", draft.call_opener)}
            copied={copied === "call"}
          />
        </TabsContent>
      </Tabs>

      <p className="text-[11px] text-charcoal-500">
        Nothing is auto-sent. Copy + paste into your sending tool of choice, or hand off to the partnerships team.
      </p>

      <StatusNotice open={!!notice} onClose={() => setNotice(null)} message={notice ?? ""} />
    </div>
  );
}

function FieldCard({
  label,
  rows,
  value,
  onChange,
  onCopy,
  copied,
}: {
  label: string;
  rows: number;
  value: string;
  onChange: (v: string) => void;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="card-surface space-y-3 p-6">
      <div className="flex items-baseline justify-between">
        <Label>{label}</Label>
        <CopyBtn onClick={onCopy} copied={copied} />
      </div>
      <Textarea rows={rows} value={value} onChange={(e) => onChange(e.currentTarget.value)} />
    </div>
  );
}

function CopyBtn({ onClick, copied }: { onClick: () => void; copied: boolean }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-sm px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-charcoal-500 transition-colors hover:text-charcoal-900"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
