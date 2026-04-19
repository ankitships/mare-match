import { z } from "zod";
import { SCORE_CATEGORIES } from "@/lib/types";

export const ConfidenceSchema = z.enum(["high", "medium", "low"]);

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
  source_url: z.string().optional(),
  excerpt: z.string().optional(),
  confidence: ConfidenceSchema,
});

export const CategoryEvidenceSchema = z.object({
  category: z.enum(SCORE_CATEGORIES),
  score_hint: z.number().min(0).max(10),
  confidence: ConfidenceSchema,
  evidence: z.array(EvidenceItemSchema),
  missing_data_note: z.string().optional().default(""),
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
  source_url: z.string().optional(),
});

// The LLM produces this wrapper — one object per category + optional hard fails
export const EvidencePayloadSchema = z.object({
  categories: z.array(CategoryEvidenceSchema).min(1),
  hard_fail_flags: z.array(HardFailFlagSchema).default([]),
  summary_note: z.string().optional().default(""),
});

export type EvidencePayload = z.infer<typeof EvidencePayloadSchema>;
