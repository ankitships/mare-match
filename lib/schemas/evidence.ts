import { z } from "zod";
import { SCORE_CATEGORIES } from "@/lib/types";

export const ConfidenceSchema = z.enum(["high", "medium", "low"]);

// Helper: LLMs often emit null where our schema expects optional string.
// Normalize null → undefined so z.string().optional() accepts either.
const nullishString = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => (v == null ? undefined : v))
  .optional();

export const EvidenceItemSchema = z.object({
  claim: z.string().min(3),
  source_type: z.enum([
    "homepage",
    "services_page",
    "pricing_page",
    "about_page",
    "contact_page",
    "reviews",
    "instagram",
    "screenshot",
    "metadata",
    "other",
  ]),
  source_url: nullishString,
  excerpt: nullishString,
  confidence: ConfidenceSchema,
});

export const CategoryEvidenceSchema = z.object({
  category: z.enum(SCORE_CATEGORIES),
  score_hint: z.number().min(0).max(10),
  confidence: ConfidenceSchema,
  evidence: z.array(EvidenceItemSchema),
  missing_data_note: nullishString.transform((v) => v ?? ""),
});

export const HardFailFlagSchema = z.object({
  kind: z.enum([
    "mass_market_discount",
    "heavy_coupon_behavior",
    "low_end_aesthetic",
    "poor_service_presentation",
    "operational_mismatch",
    "weak_clientele_signal",
  ]),
  detail: z.string(),
  source_url: nullishString,
});

// The LLM produces this wrapper — one object per category + optional hard fails
export const EvidencePayloadSchema = z.object({
  categories: z.array(CategoryEvidenceSchema).min(1),
  hard_fail_flags: z.array(HardFailFlagSchema).default([]),
  summary_note: z.string().optional().default(""),
});

export type EvidencePayload = z.infer<typeof EvidencePayloadSchema>;
