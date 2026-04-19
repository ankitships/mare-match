import { MARE_SYSTEM_CONTEXT } from "./voice";

export interface EvidencePromptInput {
  prospect: {
    name: string;
    website_url: string;
    city?: string;
    state?: string;
    notes?: string;
  };
  crawled_sources: Array<{
    source_type: string;
    source_url?: string;
    content_excerpt: string;          // already truncated upstream
  }>;
}

export function buildEvidencePrompt({ prospect, crawled_sources }: EvidencePromptInput) {
  const system = `
You are a senior MaRe partnerships analyst. Your job is to extract structured
evidence from what we know about a salon prospect, so the team can decide
whether they are a good MaRe partner.

${MARE_SYSTEM_CONTEXT}

You will output strict JSON matching this structure:

{
  "categories": [
    {
      "category": "premium_aesthetic" | "service_sophistication" | "retail_sophistication" | "wellness_adjacency" | "clientele_affluence" | "operational_fit" | "scale_signals" | "revenue_likelihood" | "exclusivity_fit",
      "score_hint": <number 0-10>,
      "confidence": "high" | "medium" | "low",
      "evidence": [
        {
          "claim": "<one-sentence observation>",
          "source_type": "homepage" | "services_page" | "pricing_page" | "about_page" | "contact_page" | "reviews" | "instagram" | "screenshot" | "metadata" | "other",
          "source_url": "<optional url>",
          "excerpt": "<optional short quote/paraphrase>",
          "confidence": "high" | "medium" | "low"
        }
      ],
      "missing_data_note": "<optional — what would need to be confirmed>"
    }
  ],
  "hard_fail_flags": [
    {
      "kind": "mass_market_discount" | "heavy_coupon_behavior" | "low_end_aesthetic" | "poor_service_presentation" | "operational_mismatch" | "weak_clientele_signal",
      "detail": "<short explanation>",
      "source_url": "<optional>"
    }
  ],
  "summary_note": "<one paragraph>"
}

Rules:
- Include ALL nine categories, in order above.
- score_hint is 0-10 (10 = best). Be calibrated — do not inflate.
- confidence reflects EVIDENCE strength, not intuition. If evidence is missing, say "low" and populate missing_data_note.
- Evidence items must reference the crawled source. Never fabricate quotes or URLs.
- Only emit hard_fail_flags when the evidence clearly supports them.
- Do not output the final weighted total — the scoring engine computes that.
- No markdown, no commentary, JSON only.
`.trim();

  const user = `
PROSPECT
Name: ${prospect.name}
Website: ${prospect.website_url}
Location: ${[prospect.city, prospect.state].filter(Boolean).join(", ") || "unknown"}
Internal notes: ${prospect.notes || "(none)"}

CRAWLED SOURCES
${crawled_sources
  .map(
    (s, i) =>
      `--- Source ${i + 1} | type=${s.source_type}${s.source_url ? ` | url=${s.source_url}` : ""} ---\n${s.content_excerpt.slice(0, 4000)}`,
  )
  .join("\n\n")}

Produce the JSON now.
`.trim();

  return { system, user };
}
