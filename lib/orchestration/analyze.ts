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

import { crawlProspect, truncatePageContent } from "@/lib/crawl/firecrawl";
import { getProvider } from "@/lib/ai/provider";
import { buildEvidencePrompt } from "@/lib/prompts/evidence";
import { EvidencePayloadSchema, type EvidencePayload } from "@/lib/schemas/evidence";
import { computeScore } from "@/lib/scoring/engine";
import { store } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { pickFixture, type FixtureFile } from "@/lib/fixtures";
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
function loadFixtureFor(input: AnalyzeInput): EvidencePayload | null {
  const hay = `${input.website_url} ${input.name ?? ""}`;
  let fx = pickFixture(hay);
  if (!fx && process.env.USE_FIXTURES === "1") fx = pickFixture("ambiguous");
  if (!fx) return null;
  return EvidencePayloadSchema.parse(fx.evidence_payload);
}

function loadFixtureProspect(input: AnalyzeInput): FixtureFile["prospect"] | null {
  const fx = pickFixture(`${input.website_url} ${input.name ?? ""}`);
  return fx?.prospect ?? null;
}

// ----------------------------------------------------------------------------
export async function analyzeProspect(input: AnalyzeInput): Promise<AnalyzeResult> {
  // --- Step 1: upsert prospect --------------------------------------------
  const fixtureProspect = loadFixtureProspect(input);
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
  // Short-circuit: known fixture URLs never need a network crawl. This is
  // what makes the three demo salons resolve in ~1 second end-to-end.
  const hasFixtureMatch = !!pickFixture(`${input.website_url} ${input.name ?? ""}`);
  let crawled: Awaited<ReturnType<typeof crawlProspect>> = [];
  if (!hasFixtureMatch && process.env.USE_FIXTURES !== "1") {
    try {
      crawled = await crawlProspect({
        website_url: input.website_url,
        instagram_url: input.instagram_url,
      });
    } catch {
      crawled = [];
    }
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
    evidence = loadFixtureFor(input);
    usedFixture = evidence !== null;
  }

  if (!evidence) {
    // We have crawled content — try fixtures first for known demo URLs
    const fx = loadFixtureFor(input);
    if (fx) {
      evidence = fx;
      usedFixture = true;
    }
  }

  if (!evidence) {
    const provider = getProvider();
    // If we have neither crawl content nor a fixture match nor an LLM, the
    // only defensible answer is "insufficient evidence" — don't waste an
    // LLM roundtrip on an empty prompt.
    if (crawled.length === 0) {
      evidence = buildInsufficientEvidence();
    } else if (provider.name === "mock") {
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
      // Resilient: if the LLM output fails schema or the call throws, degrade
      // to insufficient_evidence rather than 500-ing the whole analyze flow.
      try {
        evidence = await provider.completeJson({
          system,
          user,
          schema: EvidencePayloadSchema,
          schemaName: "EvidencePayload",
          // Evidence extraction is structured and factual — use the fast model
          // (Haiku 4.5 for Anthropic) so analyze stays under ~12s end-to-end.
          // Sonnet is reserved for the creative microsite + outreach writing.
          model: process.env.LLM_MODEL_FAST || "claude-haiku-4-5-20251001",
          temperature: 0.25,
          // Haiku 4.5 is chatty when describing 9 categories of evidence.
          // 2800 tokens often truncated mid-object for richer salons.
          maxOutputTokens: 5000,
        });
      } catch (err) {
        console.warn("[analyze] evidence LLM failed, falling back:", err);
        evidence = buildInsufficientEvidence();
      }
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
