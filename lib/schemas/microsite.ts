import { z } from "zod";

export const MicrositeReasonSchema = z.object({
  headline: z.string().min(3).max(80),
  body: z.string().min(20).max(420),
});

export const MicrositeMareSystemPointSchema = z.object({
  pillar: z.enum(["MaRe Eye", "MaRe Capsule", "Philip Martin's", "Ritual System", "Training & Support"]),
  body: z.string().min(30).max(360),
});

export const MicrositeImplementationItemSchema = z.object({
  requirement: z.string().min(3).max(60),
  detail: z.string().min(5).max(220),
});

export const MicrositePayloadSchema = z.object({
  hero_title: z.string().min(6).max(140),
  hero_subtitle: z.string().min(20).max(360),
  why_selected: z.array(MicrositeReasonSchema).min(3).max(5),
  mare_system: z.array(MicrositeMareSystemPointSchema).length(5),
  implementation: z.array(MicrositeImplementationItemSchema).min(4).max(6),
  why_different_body: z.string().min(40).max(480),
  next_step: z.object({
    cta_label: z.string().min(3).max(40),
    message: z.string().min(20).max(320),
  }),
  theme: z
    .object({
      accent_hex: z.string().optional(),
      logo_url: z.string().optional(),
    })
    .optional(),
});

export type MicrositePayload = z.infer<typeof MicrositePayloadSchema>;
