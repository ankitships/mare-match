import { z } from "zod";

// Upper bounds generous enough to not reject well-formed premium copy from
// Sonnet 4.5 while still catching runaway outputs.
export const OutreachPayloadSchema = z.object({
  email: z.object({
    subject: z.string().min(4).max(140),
    body: z.string().min(60).max(3000),
  }),
  dm: z.string().min(30).max(800),
  postcard: z.string().min(20).max(700),
  call_opener: z.string().min(15).max(500),
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
