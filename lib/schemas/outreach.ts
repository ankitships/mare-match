import { z } from "zod";

export const OutreachPayloadSchema = z.object({
  email: z.object({
    subject: z.string().min(4).max(90),
    body: z.string().min(80).max(1500),
  }),
  dm: z.string().min(40).max(500),
  postcard: z.string().min(30).max(420),
  call_opener: z.string().min(20).max(280),
});

export type OutreachPayload = z.infer<typeof OutreachPayloadSchema>;

// Phrases that MUST NOT appear in any outreach output
export const BANNED_PHRASES: string[] = [
  "skyrocket your revenue",
  "skyrocket",
  "game-changing AI",
  "game changing",
  "unlock massive growth",
  "unlock growth",
  "cutting-edge solution",
  "cutting edge",
  "amazing business",
  "amazing salon",
  "partner with us today",
  "revolutionize your salon",
  "revolutionize",
  "synergy",
  "synergies",
  "10x",
  "disrupt",
  "disruptive",
  "leverage",
  "solutioning",
];

export function detectBannedPhrases(text: string): string[] {
  const lower = text.toLowerCase();
  return BANNED_PHRASES.filter((p) => lower.includes(p));
}
