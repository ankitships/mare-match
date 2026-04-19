import { z } from "zod";

export const MicrositeReasonSchema = z.object({
  headline: z.string().min(3).max(120),
  body: z.string().min(20).max(700),
});

export const MicrositeMareSystemPointSchema = z.object({
  pillar: z.enum(["MaRe Eye", "MaRe Capsule", "Philip Martin's", "Ritual System", "Training & Support"]),
  body: z.string().min(20).max(600),
});

export const MicrositeImplementationItemSchema = z.object({
  requirement: z.string().min(3).max(80),
  detail: z.string().min(5).max(400),
});

export const MicrositePayloadSchema = z.object({
  hero_title: z.string().min(6).max(200),
  hero_subtitle: z.string().min(20).max(600),
  why_selected: z.array(MicrositeReasonSchema).min(3).max(6),
  mare_system: z.array(MicrositeMareSystemPointSchema).length(5),
  implementation: z.array(MicrositeImplementationItemSchema).min(4).max(6),
  why_different_body: z.string().min(40).max(900),
  next_step: z.object({
    cta_label: z.string().min(3).max(60),
    message: z.string().min(20).max(500),
  }),
  theme: z
    .object({
      accent_hex: z.union([z.string(), z.null()]).optional().transform((v) => v ?? undefined),
      logo_url: z.union([z.string(), z.null()]).optional().transform((v) => v ?? undefined),
    })
    .nullable()
    .optional()
    .transform((v) => v ?? undefined),
});

export type MicrositePayload = z.infer<typeof MicrositePayloadSchema>;
