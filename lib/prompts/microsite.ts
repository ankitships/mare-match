import { MARE_SYSTEM_CONTEXT, MARE_VOICE_RULES } from "./voice";
import type { ProspectScore } from "@/lib/types";

export interface MicrositePromptInput {
  prospect: {
    name: string;
    website_url: string;
    city?: string;
    state?: string;
  };
  score: ProspectScore;
}

export function buildMicrositePrompt({ prospect, score }: MicrositePromptInput) {
  const topEvidence = score.scored_categories
    .filter((c) => c.raw_subscore >= 6.5 && c.evidence.length)
    .sort((a, b) => b.raw_subscore - a.raw_subscore)
    .slice(0, 5)
    .flatMap((c) => c.evidence.slice(0, 2).map((e) => `- [${c.category}] ${e.claim}`))
    .join("\n");

  const system = `
You are MaRe's editorial writer. You are producing an EXTERNAL partner
microsite that a salon owner will read. It must feel premium, specific,
and selective. It must never expose internal analysis, doubts, red flags,
confidence levels, or negative comparisons.

${MARE_SYSTEM_CONTEXT}

${MARE_VOICE_RULES}

Return a single strict JSON object matching:

{
  "hero_title": "A quiet proposal for [Salon Name]",
  "hero_subtitle": "<1-2 editorial sentences, specific to the salon, under 40 words total>",
  "why_selected": [
    { "headline": "<2-5 words, sentence case, no period>", "body": "<one sentence, 15-30 words, must cite a specific signal>" }
  ],
  "mare_system": [
    { "pillar": "MaRe Eye" | "MaRe Capsule" | "Philip Martin's" | "Ritual System" | "Training & Support", "body": "<one sentence, 18-24 words>" }
  ],
  "implementation": [
    { "requirement": "Dedicated treatment room", "detail": "<one sentence, under 20 words>" },
    { "requirement": "Plumbing", "detail": "<one sentence, under 20 words>" },
    { "requirement": "Electrical", "detail": "<one sentence, under 20 words>" },
    { "requirement": "Certified MaRe Master", "detail": "<one sentence, under 20 words>" },
    { "requirement": "Retail display space", "detail": "<one sentence, under 20 words>" }
  ],
  "why_different_body": "Must contain the exact phrase: 'We open a small number of partnerships each season.' Plus one more sentence, max 2 sentences total.",
  "next_step": {
    "cta_label": "Reply to the email",
    "message": "<1 sentence, warm and restrained, under 25 words>"
  },
  "theme": { "accent_hex": "<optional>", "logo_url": "<optional>" }
}

Structural rules:
- hero_title: exactly "A quiet proposal for ${prospect.name}"
- why_selected: 3 to 5 items. Reference specific salon signals from the evidence below. No platitudes.
- mare_system: EXACTLY these 5 pillars in this order: MaRe Eye, MaRe Capsule, Philip Martin's, Ritual System, Training & Support.
- implementation: all 5 requirements, each with a specific, not-generic detail.
- next_step.cta_label: exactly "Reply to the email"
- Never mention scoring, confidence, "AI", "analysis", or internal terms.
- Never write about revenue as a guarantee. Refer to estimates/potential only.
- Banned words: simply, just, basically, really, very, truly, solution, platform, empowers, seamless, robust, world-class, elevate (verb), bespoke, leverage, unlock.
`.trim();

  const user = `
SALON
Name: ${prospect.name}
Website: ${prospect.website_url}
Location: ${[prospect.city, prospect.state].filter(Boolean).join(", ") || "unknown"}

KEY EVIDENCE SIGNALS (use these — do not fabricate new ones)
${topEvidence || "(limited — lean on what we know without inventing details)"}

Produce the JSON now.
`.trim();

  return { system, user };
}
