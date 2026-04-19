"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function IntakeForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        website_url: String(formData.get("website_url") || "").trim(),
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
        return;
      }
      router.push(`/prospects/${json.slug}`);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="website_url">Website URL *</Label>
        <Input
          id="website_url"
          name="website_url"
          type="url"
          required
          placeholder="https://example-salon.com"
          defaultValue=""
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
        <Button type="submit" disabled={loading} size="lg">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Analyzing
            </>
          ) : (
            <>
              Analyze prospect <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
        <p className="text-[11px] uppercase tracking-[0.18em] text-charcoal-500">
          Private · Human-in-the-loop
        </p>
      </div>
    </form>
  );
}
