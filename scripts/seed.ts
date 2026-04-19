// Seed the file-based store with the three fixtures so a fresh demo
// has prospects, scores, microsites, and outreach ready to browse.
//
// Usage: npm run seed

import fs from "node:fs/promises";
import path from "node:path";
import { analyzeProspect } from "../lib/orchestration/analyze";
import { generateMicrosite } from "../lib/orchestration/microsite";
import { generateOutreach } from "../lib/orchestration/outreach";
import { store } from "../lib/db";

process.env.USE_FIXTURES = "1";

async function seedOne(fixturePath: string) {
  const raw = await fs.readFile(fixturePath, "utf8");
  const parsed = JSON.parse(raw) as { prospect: { name: string; website_url: string; instagram_url?: string; city?: string; state?: string; notes?: string } };

  const result = await analyzeProspect({
    website_url: parsed.prospect.website_url,
    name: parsed.prospect.name,
    instagram_url: parsed.prospect.instagram_url,
    city: parsed.prospect.city,
    state: parsed.prospect.state,
    notes: parsed.prospect.notes,
  });

  const score = await store.getLatestScore(result.prospect.id);
  if (!score) return;

  const microsite = await generateMicrosite({ prospect: result.prospect, score });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  await generateOutreach({
    prospect: result.prospect,
    score,
    micrositeUrl: `${appUrl}/partner/${microsite.slug}`,
  });

  console.log(`✓ Seeded ${parsed.prospect.name} — score ${score.total} (${score.recommendation})`);
}

async function main() {
  const fixDir = path.join(process.cwd(), "data", "fixtures");
  const files = (await fs.readdir(fixDir)).filter((f) => f.endsWith(".json"));
  for (const f of files) {
    await seedOne(path.join(fixDir, f));
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
