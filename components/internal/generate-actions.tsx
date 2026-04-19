"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Sparkles, Mail, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";

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
  const [loading, setLoading] = useState<"microsite" | "outreach" | "rerun" | null>(null);
  const [, startTransition] = useTransition();

  async function call(path: string, kind: typeof loading) {
    setLoading(kind);
    try {
      await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prospect_id: prospectId }),
      });
      startTransition(() => router.refresh());
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => call("/api/microsite", "microsite")}
        disabled={loading !== null}
      >
        {loading === "microsite" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
        {hasMicrosite ? "Regenerate microsite" : "Generate microsite"}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => call("/api/outreach", "outreach")}
        disabled={loading !== null || !hasMicrosite}
      >
        {loading === "outreach" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
        {hasOutreach ? "Regenerate outreach" : "Generate outreach"}
      </Button>

      {hasOutreach && (
        <Link href={`/prospects/${slug}/outreach`}>
          <Button size="sm">
            <RotateCw className="h-3.5 w-3.5" /> Open outreach studio
          </Button>
        </Link>
      )}
    </div>
  );
}
