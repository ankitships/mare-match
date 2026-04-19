// ============================================================================
// MaRe Match — shared domain types
// ----------------------------------------------------------------------------
// The scoring rubric is the source of truth — categories here mirror §6 of the
// product spec. Weighted math happens in lib/scoring; the LLM only produces
// evidence + per-category rationale.
// ============================================================================

export type Confidence = "high" | "medium" | "low";

export type Recommendation = "strong_fit" | "worth_reviewing" | "not_a_fit";

export type RevenueBand =
  | "likely_above_1m"
  | "possibly_above_1m"
  | "insufficient_evidence"
  | "likely_below_target";

export const SCORE_CATEGORIES = [
  "premium_aesthetic",
  "service_sophistication",
  "retail_sophistication",
  "wellness_adjacency",
  "clientele_affluence",
  "operational_fit",
  "scale_signals",
  "revenue_likelihood",
  "exclusivity_fit",
] as const;

export type ScoreCategory = (typeof SCORE_CATEGORIES)[number];

// Category weights sum to 100 (spec §6)
export const CATEGORY_WEIGHTS: Record<ScoreCategory, number> = {
  premium_aesthetic: 20,
  service_sophistication: 12,
  retail_sophistication: 10,
  wellness_adjacency: 12,
  clientele_affluence: 12,
  operational_fit: 10,
  scale_signals: 10,
  revenue_likelihood: 8,
  exclusivity_fit: 6,
};

export const CATEGORY_LABELS: Record<ScoreCategory, string> = {
  premium_aesthetic: "Premium aesthetic & brand presentation",
  service_sophistication: "Service sophistication",
  retail_sophistication: "Retail sophistication",
  wellness_adjacency: "Wellness & scalp adjacency",
  clientele_affluence: "Clientele affluence",
  operational_fit: "Operational fit for install",
  scale_signals: "Scale signals",
  revenue_likelihood: "Revenue band likelihood",
  exclusivity_fit: "Exclusivity & brand-fit guardrail",
};

// A single evidence item sourced from crawl/extraction
export interface EvidenceItem {
  claim: string;
  source_type:
    | "homepage"
    | "services_page"
    | "pricing_page"
    | "about_page"
    | "contact_page"
    | "reviews"
    | "instagram"
    | "screenshot"
    | "metadata"
    | "other";
  source_url?: string;
  excerpt?: string;
  confidence: Confidence;
}

// The LLM returns evidence grouped by category
export interface CategoryEvidence {
  category: ScoreCategory;
  score_hint: number;           // 0..10 suggested by LLM
  confidence: Confidence;
  evidence: EvidenceItem[];
  missing_data_note?: string;
}

// Once run through the code-weighted engine
export interface ScoredCategory extends CategoryEvidence {
  raw_subscore: number;         // 0..10
  weighted_subscore: number;    // raw * weight / 10
  weight: number;               // from CATEGORY_WEIGHTS
}

export interface HardFailFlag {
  kind:
    | "mass_market_discount"
    | "heavy_coupon_behavior"
    | "low_end_aesthetic"
    | "poor_service_presentation"
    | "operational_mismatch"
    | "weak_clientele_signal";
  detail: string;
  source_url?: string;
}

export interface ProspectScore {
  total: number;                // 0..100
  recommendation: Recommendation;
  revenue_band: RevenueBand;
  revenue_confidence: Confidence;
  scored_categories: ScoredCategory[];
  hard_fail_flags: HardFailFlag[];
  confidence: Confidence;        // aggregate
  notes?: string;
}

export interface ProspectRecord {
  id: string;
  name: string;
  slug: string;
  website_url: string;
  instagram_url?: string;
  city?: string;
  state?: string;
  notes?: string;
  status: "new" | "analyzing" | "analyzed" | "approved" | "sent";
  created_at: string;
  updated_at: string;
}

export interface ProspectSource {
  id: string;
  prospect_id: string;
  source_type: EvidenceItem["source_type"];
  source_url?: string;
  raw_content?: string;
  parsed_content?: string;
  screenshot_url?: string;
  metadata_json?: Record<string, unknown>;
  created_at: string;
}

// ----------------------------------------------------------------------------
// Microsite (external)
// ----------------------------------------------------------------------------

export interface MicrositeReason {
  headline: string;
  body: string;
}

export interface MicrositeMareSystemPoint {
  pillar: "MaRe Eye" | "MaRe Capsule" | "Philip Martin's" | "Ritual System" | "Training & Support";
  body: string;
}

export interface MicrositeImplementationItem {
  requirement: string;
  detail: string;
}

export interface MicrositeRecord {
  id: string;
  prospect_id: string;
  slug: string;
  hero_title: string;
  hero_subtitle: string;
  why_selected_json: MicrositeReason[];
  mare_system_json: MicrositeMareSystemPoint[];
  implementation_json: MicrositeImplementationItem[];
  next_step_json: { cta_label: string; message: string; contact_name?: string; contact_email?: string };
  theme_json: { accent_hex?: string; logo_url?: string; prospect_images?: string[] };
  why_different_body: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------------------
// Outreach
// ----------------------------------------------------------------------------

export interface OutreachAssets {
  id: string;
  prospect_id: string;
  email_subject: string;
  email_body: string;
  dm_body: string;
  postcard_copy: string;
  call_opener: string;
  version_number: number;
  created_at: string;
}

// ----------------------------------------------------------------------------
// Approval
// ----------------------------------------------------------------------------

export interface ApprovalState {
  prospect_id: string;
  fit_score_approved: boolean;
  microsite_approved: boolean;
  outreach_approved: boolean;
  approved_by?: string;
  approved_at?: string;
  notes?: string;
}

export interface GenerationVersion {
  id: string;
  prospect_id: string;
  object_type: "score" | "microsite" | "outreach";
  version_number: number;
  payload_json: unknown;
  created_at: string;
}

// ----------------------------------------------------------------------------
// ROI Calculator
// ----------------------------------------------------------------------------

export interface RoiInputs {
  sessions_per_week: number;
  ritual_mix_35: number;
  ritual_mix_60: number;
  ritual_mix_90: number;
  avg_price_35: number;
  avg_price_60: number;
  avg_price_90: number;
  retail_attach_rate: number;
  avg_retail_basket: number;
  repeat_booking_rate: number;
  program_length_weeks: number;
  utilization_ramp: number;
}

export interface RoiOutputs {
  monthly_service_revenue: number;
  monthly_retail_revenue: number;
  monthly_total_upside: number;
  annualized_upside: number;
  scenario_low: number;
  scenario_base: number;
  scenario_high: number;
}

export const DEFAULT_ROI_INPUTS: RoiInputs = {
  sessions_per_week: 12,
  ritual_mix_35: 0.2,
  ritual_mix_60: 0.6,
  ritual_mix_90: 0.2,
  avg_price_35: 95,
  avg_price_60: 145,
  avg_price_90: 210,
  retail_attach_rate: 0.25,
  avg_retail_basket: 78,
  repeat_booking_rate: 0.4,
  program_length_weeks: 8,
  utilization_ramp: 0.65,
};
