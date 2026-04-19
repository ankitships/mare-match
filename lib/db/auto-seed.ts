// ============================================================================
// Auto-seed — first call on Vercel ensures the three demo prospects exist.
// No-op locally once seed has been run.
// ============================================================================

import fs from "node:fs/promises";
import path from "node:path";
import { store } from "./store";
import { analyzeProspect } from "@/lib/orchestration/analyze";
import { generateMicrosite } from "@/lib/orchestration/microsite";
import { generateOutreach } from "@/lib/orchestration/outreach";

let seeded: Promise<void> | null = null;

async function seedOnce() {
  const existing = await store.listProspects();
  if (existing.length >= 3) return;

  const fixDir = path.join(process.cwd(), "data", "fixtures");
  let files: string[] = [];
  try {
    files = (await fs.readdir(fixDir)).filter((f) => f.endsWith(".json"));
  } catch {
    return;
  }

  // Force fixture mode during seed so we don't burn tokens / crawl credits
  const prev = process.env.USE_FIXTURES;
  process.env.USE_FIXTURES = "1";
  try {
    for (const f of files) {
      const raw = await fs.readFile(path.join(fixDir, f), "utf8");
      const parsed = JSON.parse(raw) as {
        prospect: {
          name: string;
          website_url: string;
          instagram_url?: string;
          city?: string;
          state?: string;
          notes?: string;
        };
      };
      const existing = await store.getProspectBySlug(
        parsed.prospect.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
      );
      if (existing) continue;

      const result = await analyzeProspect({
        website_url: parsed.prospect.website_url,
        name: parsed.prospect.name,
        instagram_url: parsed.prospect.instagram_url,
        city: parsed.prospect.city,
        state: parsed.prospect.state,
        notes: parsed.prospect.notes,
      });
      const score = await store.getLatestScore(result.prospect.id);
      if (!score) continue;
      const microsite = await generateMicrosite({ prospect: result.prospect, score });
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      await generateOutreach({
        prospect: result.prospect,
        score,
        micrositeUrl: `${appUrl}/partner/${microsite.slug}`,
      });
    }
  } finally {
    if (prev === undefined) delete process.env.USE_FIXTURES;
    else process.env.USE_FIXTURES = prev;
  }
}

export function ensureSeeded(): Promise<void> {
  if (!seeded) seeded = seedOnce().catch((err) => {
    console.warn("[auto-seed] failed:", err);
  });
  return seeded;
}
