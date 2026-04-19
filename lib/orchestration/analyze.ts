// ============================================================================
// Orchestration — the analyze() pipeline
// ----------------------------------------------------------------------------
// Steps (spec §15):
//   1. intake URL            -> upsert prospect
//   2. crawl/extract pages   -> persist ProspectSource rows
//   3. (screenshots inline)
//   4. derive structured signals
//   5. LLM evidence synthesis
//   6. weighted scoring in code
//   7. recommendation + save
// ============================================================================

import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { crawlProspect, truncatePageContent } from "@/lib/crawl/firecrawl";
import { getProvider } from "@/lib/ai/provider";
import { buildEvidencePrompt } from "@/lib/prompts/evidence";
import { EvidencePayloadSchema, type EvidencePayload } from "@/lib/schemas/evidence";
import { computeScore } from "@/lib/scoring/engine";
import { store } from "@/lib/db/store";
import { slugify } from "@/lib/utils";
import type { ProspectRecord } from "@/lib/types";

export interface AnalyzeInput {
  website_url: string;
  name?: string;
  instagram_url?: string;
  city?: string;
  state?: string;
  notes?: string;
}

export interface AnalyzeResult {
  prospect: ProspectRecord;
  source_count: number;
  used_fixture: boolean;
}

// -- Fixture routing: pick a fixture by URL/name heuristics --------------------
async function loadFixtureFor(input: AnalyzeInput): Promise<EvidencePayload | null> {
  const hay = `${input.website_url} ${input.name ?? ""}`.toLowerCase();
  let file: string | null = null;
  if (/desange|luxury|miami/.test(hay)) file = "strong-fit.json";
  else if (/cutzone|express|discount/.test(hay)) file = "weak-fit.json";
  else if (/rosano|ferretti|ambiguous/.test(hay)) file = "ambiguous.json";
  else if (process.env.USE_FIXTURES === "1") file = "ambiguous.json";
  if (!file) return null;

  const raw = await fs.readFile(path.join(process.cwd(), "data", "fixtures", file), "utf8");
  const parsed = JSON.parse(raw) as { evidence_payload: EvidencePayload };
  return EvidencePayloadSchema.parse(parsed.evidence_payload);
}

async function loadFixtureProspect(input: AnalyzeInput): Promise<{
  name: string;
  slug: string;
  instagram_url?: string;
  city?: string;
  state?: string;
} | null> {
  const hay = `${input.website_url} ${input.name ?? ""}`.toLowerCase();
  let file: string | null = null;
  if (/desange|miami/.test(hay)) file = "strong-fit.json";
  else if (/cutzone|express/.test(hay)) file = "weak-fit.json";
  else if (/rosano|ferretti/.test(hay)) file = "ambiguous.json";
  if (!file) return null;
  const raw = await fs.readFile(path.join(process.cwd(), "data", "fixtures", file), "utf8");
  const parsed = JSON.parse(raw) as { prospect: { name: string; slug: string; instagram_url?: string; city?: string; state?: string } };
  return parsed.prospect;
}

// ----------------------------------------------------------------------------
export async function analyzeProspect(input: AnalyzeInput): Promise<AnalyzeResult> {
  // --- Step 1: upsert prospect --------------------------------------------
  const fixtureProspect = await loadFixtureProspect(input);
  const name = input.name?.trim() || fixtureProspect?.name || deriveNameFromUrl(input.website_url);
  const slug = slugify(name);

  const prospect = await store.upsertProspect({
    name,
    slug,
    website_url: input.website_url,
    instagram_url: input.instagram_url ?? fixtureProspect?.instagram_url,
    city: input.city ?? fixtureProspect?.city,
    state: input.state ?? fixtureProspect?.state,
    notes: input.notes,
    status: "analyzing",
  });

  // --- Steps 2–3: crawl ---------------------------------------------------
  let crawled: Awaited<ReturnType<typeof crawlProspect>> = [];
  try {
    crawled = await crawlProspect({
      website_url: input.website_url,
      instagram_url: input.instagram_url,
    });
  } catch {
    crawled = [];
  }

  if (crawled.length) {
    await store.saveSources(
      prospect.id,
      crawled.map((p) => ({
        source_type: p.source_type,
        source_url: p.url,
        raw_content: p.markdown,
        parsed_content: p.markdown.slice(0, 8000),
        screenshot_url: p.screenshot_url,
        metadata_json: { title: p.title },
      })),
    );
  }

  // --- Steps 4–5: LLM evidence extraction (or fixture) --------------------
  let evidence: EvidencePayload | null = null;
  let usedFixture = false;

  // Prefer fixtures for speed if URL matches one OR if env forces it OR if no crawl
  if (process.env.USE_FIXTURES === "1" || crawled.length === 0) {
    evidence = await loadFixtureFor(input);
    usedFixture = evidence !== null;
  }

  if (!evidence) {
    // We have crawled content — try fixtures first for known demo URLs
    const fx = await loadFixtureFor(input);
    if (fx) {
      evidence = fx;
      usedFixture = true;
    }
  }

  if (!evidence) {
    const provider = getProvider();
    if (provider.name === "mock") {
      // No keys + no fixture match — fall back to a safe "insufficient evidence" payload
      evidence = buildInsufficientEvidence();
    } else {
      const { system, user } = buildEvidencePrompt({
        prospect: {
          name: prospect.name,
          website_url: prospect.website_url,
          city: prospect.city,
          state: prospect.state,
          notes: prospect.notes,
        },
        crawled_sources: crawled.map((p) => ({
          source_type: p.source_type,
          source_url: p.url,
          content_excerpt: truncatePageContent(p),
        })),
      });
      evidence = await provider.completeJson({
        system,
        user,
        schema: EvidencePayloadSchema,
        schemaName: "EvidencePayload",
        temperature: 0.25,
        maxOutputTokens: 2800,
      });
    }
  }

  // --- Step 6: weighted scoring in code -----------------------------------
  const score = computeScore(evidence);

  // --- Step 7: persist ----------------------------------------------------
  await store.saveScore(prospect.id, score);
  await store.saveVersion({
    prospect_id: prospect.id,
    object_type: "score",
    payload_json: { score, evidence_payload: evidence },
  });
  await store.updateProspectStatus(prospect.id, "analyzed");

  return {
    prospect: { ...prospect, status: "analyzed" },
    source_count: crawled.length,
    used_fixture: usedFixture,
  };
}

// ----------------------------------------------------------------------------
function buildInsufficientEvidence(): EvidencePayload {
  return {
    categories: [
      "premium_aesthetic",
      "service_sophistication",
      "retail_sophistication",
      "wellness_adjacency",
      "clientele_affluence",
      "operational_fit",
      "scale_signals",
      "revenue_likelihood",
      "exclusivity_fit",
    ].map((category) => ({
      category: category as EvidencePayload["categories"][number]["category"],
      score_hint: 0,
      confidence: "low" as const,
      evidence: [],
      missing_data_note:
        "No evidence extracted — configure FIRECRAWL_API_KEY and an LLM key, or add this salon to fixtures.",
    })),
    hard_fail_flags: [],
    summary_note: "Insufficient evidence — analysis skipped.",
  };
}

function deriveNameFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const base = host.split(".")[0];
    return base
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return "Prospect";
  }
}

// Re-export the randomUUID for consistency
export { randomUUID };
