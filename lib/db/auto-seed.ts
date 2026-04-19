// ============================================================================
// Auto-seed — first call ensures the three demo prospects exist on a cold
// Vercel instance. No-op locally once seed has been run.
// ============================================================================

import { store } from "./store";
import { analyzeProspect } from "@/lib/orchestration/analyze";
import { generateMicrosite } from "@/lib/orchestration/microsite";
import { generateOutreach } from "@/lib/orchestration/outreach";
import { FIXTURES } from "@/lib/fixtures";
import { slugify } from "@/lib/utils";

let seeded: Promise<void> | null = null;

async function seedOnce() {
  const existing = await store.listProspects();
  if (existing.length >= FIXTURES.length) return;

  const prev = process.env.USE_FIXTURES;
  process.env.USE_FIXTURES = "1";
  try {
    for (const fx of FIXTURES) {
      const slug = slugify(fx.prospect.name);
      if (await store.getProspectBySlug(slug)) continue;

      const result = await analyzeProspect({
        website_url: fx.prospect.website_url,
        name: fx.prospect.name,
        instagram_url: fx.prospect.instagram_url,
        city: fx.prospect.city,
        state: fx.prospect.state,
        notes: fx.prospect.notes,
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
