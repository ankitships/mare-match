"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingButton } from "@/components/ui/loading-button";
import { ProgressPanel } from "@/components/ui/progress-panel";

const ANALYZE_STEPS = [
  "Reading the site…",
  "Noting aesthetic and service cues…",
  "Weighing nine categories against the rubric…",
  "Composing the private partner page…",
];

function domainOf(url: string): string | undefined {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

export function IntakeForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setLoading(true);
    setError(null);
    const website_url = String(formData.get("website_url") || "").trim();
    setDetail(domainOf(website_url));

    try {
      const payload = {
        website_url,
        name: String(formData.get("name") || "").trim() || undefined,
        instagram_url: String(formData.get("instagram_url") || "").trim() || undefined,
        city: String(formData.get("city") || "").trim() || undefined,
        state: String(formData.get("state") || "").trim() || undefined,
        notes: String(formData.get("notes") || "").trim() || undefined,
      };

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Something went wrong");
        setLoading(false);
        return;
      }
      // Keep the progress panel mounted during client-side nav so the user
      // doesn't see a blank frame before the review page renders.
      router.push(`/prospects/${json.slug}`);
    } catch (err) {
      setError(String(err));
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className={loading ? "pointer-events-none opacity-60 transition-opacity" : "space-y-5"}>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="website_url">Website URL *</Label>
            <Input
              id="website_url"
              name="website_url"
              type="url"
              required
              placeholder="https://example-salon.com"
              autoComplete="off"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Salon name (optional)</Label>
              <Input id="name" name="name" placeholder="Desange Miami" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram_url">Instagram URL (optional)</Label>
              <Input id="instagram_url" name="instagram_url" placeholder="https://instagram.com/…" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" placeholder="Miami" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State / Region</Label>
              <Input id="state" name="state" placeholder="FL" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Internal notes (optional)</Label>
            <Textarea id="notes" name="notes" rows={3} placeholder="Anything we know — a referral, a sighting, a rumor." />
          </div>

          {error && (
            <div className="rounded-md border border-amber-600/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <LoadingButton type="submit" loading={loading} loadingText="Analyzing" size="lg">
              Analyze prospect <ArrowRight className="h-4 w-4" />
            </LoadingButton>
            <p className="text-[11px] uppercase tracking-[0.18em] text-charcoal-500">
              Private · Human-in-the-loop
            </p>
          </div>
        </div>
      </form>

      <ProgressPanel steps={ANALYZE_STEPS} active={loading} detail={detail} />
    </div>
  );
}
