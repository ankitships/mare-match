// ============================================================================
// Scoring Engine
// ----------------------------------------------------------------------------
// The LLM returns per-category evidence + a 0–10 score_hint. This engine
// turns that into a deterministic, inspectable 0–100 total score in code.
//
// Rubric weights (sum = 100):
//   A premium_aesthetic       20
//   B service_sophistication  12
//   C retail_sophistication   10
//   D wellness_adjacency      12
//   E clientele_affluence     12
//   F operational_fit         10
//   G scale_signals           10
//   H revenue_likelihood       8
//   I exclusivity_fit          6
//
// Hard-fail flags cap the total score (spec §6):
//   - mass_market_discount        -> cap at 40
//   - heavy_coupon_behavior       -> cap at 40
//   - low_end_aesthetic           -> cap at 45
//   - poor_service_presentation   -> cap at 50
//   - operational_mismatch        -> cap at 55
//   - weak_clientele_signal       -> cap at 55
// ============================================================================

import {
  CATEGORY_WEIGHTS,
  SCORE_CATEGORIES,
  type CategoryEvidence,
  type Confidence,
  type HardFailFlag,
  type ProspectScore,
  type Recommendation,
  type RevenueBand,
  type ScoreCategory,
  type ScoredCategory,
} from "@/lib/types";
import type { EvidencePayload } from "@/lib/schemas/evidence";

const HARD_FAIL_CAPS: Record<HardFailFlag["kind"], number> = {
  mass_market_discount: 40,
  heavy_coupon_behavior: 40,
  low_end_aesthetic: 45,
  poor_service_presentation: 50,
  operational_mismatch: 55,
  weak_clientele_signal: 55,
};

function clamp(v: number, lo = 0, hi = 10): number {
  return Math.min(hi, Math.max(lo, v));
}

function aggregateConfidence(cs: Confidence[]): Confidence {
  if (!cs.length) return "low";
  const score = cs.reduce((s, c) => s + (c === "high" ? 3 : c === "medium" ? 2 : 1), 0) / cs.length;
  if (score >= 2.5) return "high";
  if (score >= 1.7) return "medium";
  return "low";
}

function pickRevenueBand(
  scored: ScoredCategory[],
  revenueLikelihoodRaw: number,
): { band: RevenueBand; confidence: Confidence } {
  const rev = scored.find((s) => s.category === "revenue_likelihood");
  const scale = scored.find((s) => s.category === "scale_signals");
  const aff = scored.find((s) => s.category === "clientele_affluence");

  const conf = aggregateConfidence([rev?.confidence ?? "low", scale?.confidence ?? "low", aff?.confidence ?? "low"]);

  if (rev && rev.confidence === "low") {
    return { band: "insufficient_evidence", confidence: "low" };
  }
  if (revenueLikelihoodRaw >= 7.5 && (scale?.raw_subscore ?? 0) >= 6 && (aff?.raw_subscore ?? 0) >= 7) {
    return { band: "likely_above_1m", confidence: conf };
  }
  if (revenueLikelihoodRaw >= 6 && (aff?.raw_subscore ?? 0) >= 6) {
    return { band: "possibly_above_1m", confidence: conf };
  }
  if (revenueLikelihoodRaw >= 4) {
    return { band: "insufficient_evidence", confidence: conf };
  }
  return { band: "likely_below_target", confidence: conf };
}

function pickRecommendation(
  total: number,
  hasHardFails: boolean,
  aggregate: Confidence,
): Recommendation {
  if (hasHardFails) return "not_a_fit";
  if (total >= 75 && aggregate !== "low") return "strong_fit";
  if (total >= 55) return "worth_reviewing";
  return "not_a_fit";
}

// ----------------------------------------------------------------------------
// Public — compute a full score from an EvidencePayload
// ----------------------------------------------------------------------------
export function computeScore(payload: EvidencePayload): ProspectScore {
  // Ensure every category is represented (fill missing with a zero-confidence stub)
  const byCategory = new Map<ScoreCategory, CategoryEvidence>();
  for (const c of payload.categories) byCategory.set(c.category, c);

  const scoredCategories: ScoredCategory[] = SCORE_CATEGORIES.map((cat) => {
    const existing = byCategory.get(cat);
    const raw = clamp(existing?.score_hint ?? 0);
    const weight = CATEGORY_WEIGHTS[cat];
    return {
      category: cat,
      score_hint: existing?.score_hint ?? 0,
      confidence: existing?.confidence ?? "low",
      evidence: existing?.evidence ?? [],
      missing_data_note:
        existing?.missing_data_note ||
        (existing ? undefined : "No evidence extracted for this category."),
      raw_subscore: raw,
      weighted_subscore: (raw * weight) / 10,
      weight,
    };
  });

  const preCapTotal = scoredCategories.reduce((s, c) => s + c.weighted_subscore, 0);

  const caps = payload.hard_fail_flags.map((f) => HARD_FAIL_CAPS[f.kind] ?? 100);
  const hardCap = caps.length ? Math.min(...caps) : 100;
  const cappedTotal = Math.min(preCapTotal, hardCap);

  // Low confidence penalty: if aggregate confidence is low, penalize 5 points
  const allConfidences = scoredCategories.map((c) => c.confidence);
  const aggConf = aggregateConfidence(allConfidences);
  const confPenalty = aggConf === "low" ? 5 : 0;

  const total = Math.max(0, Math.round((cappedTotal - confPenalty) * 10) / 10);

  const revenueLikelihoodRaw =
    scoredCategories.find((c) => c.category === "revenue_likelihood")?.raw_subscore ?? 0;
  const { band, confidence: revConfidence } = pickRevenueBand(scoredCategories, revenueLikelihoodRaw);

  const recommendation = pickRecommendation(total, payload.hard_fail_flags.length > 0, aggConf);

  return {
    total,
    recommendation,
    revenue_band: band,
    revenue_confidence: revConfidence,
    scored_categories: scoredCategories,
    hard_fail_flags: payload.hard_fail_flags,
    confidence: aggConf,
    notes: payload.summary_note,
  };
}

// For UI: explain caps and adjustments so internal reviewers trust the math
export function explainScore(score: ProspectScore): string[] {
  const notes: string[] = [];
  notes.push(
    `Category-weighted sum: ${score.scored_categories
      .reduce((s, c) => s + c.weighted_subscore, 0)
      .toFixed(1)} / 100`,
  );
  if (score.hard_fail_flags.length) {
    const lowestCap = Math.min(...score.hard_fail_flags.map((f) => HARD_FAIL_CAPS[f.kind] ?? 100));
    notes.push(`Hard-fail guardrails capped total at ${lowestCap} (${score.hard_fail_flags.length} flag${score.hard_fail_flags.length > 1 ? "s" : ""}).`);
  }
  if (score.confidence === "low") {
    notes.push("Aggregate confidence is low — 5-point penalty applied.");
  }
  return notes;
}
