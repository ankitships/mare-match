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
  "hero_title": "Why MaRe × [Salon Name] makes sense",
  "hero_subtitle": "<2-3 editorial sentences, specific to the salon>",
  "why_selected": [
    { "headline": "<3-6 words>", "body": "<1-2 sentences, specific>" }
  ],
  "mare_system": [
    { "pillar": "MaRe Eye" | "MaRe Capsule" | "Philip Martin's" | "Ritual System" | "Training & Support", "body": "<1-2 sentences>" }
  ],
  "implementation": [
    { "requirement": "Dedicated treatment room", "detail": "<1 sentence>" },
    { "requirement": "Plumbing", "detail": "<1 sentence>" },
    { "requirement": "Electrical", "detail": "<1 sentence>" },
    { "requirement": "Certified MaRe Master", "detail": "<1 sentence>" },
    { "requirement": "Retail display space", "detail": "<1 sentence>" }
  ],
  "why_different_body": "<1 short paragraph — why MaRe is selective and mutually elevating>",
  "next_step": {
    "cta_label": "Book a conversation",
    "message": "<1-2 sentences, warm and composed>"
  },
  "theme": { "accent_hex": "<optional>", "logo_url": "<optional>" }
}

Structural rules:
- why_selected: 3 to 5 items. Reference specific salon signals from the evidence below. No platitudes.
- mare_system: EXACTLY these 5 pillars in this order: MaRe Eye, MaRe Capsule, Philip Martin's, Ritual System, Training & Support.
- implementation: all 5 requirements, each with a specific, not-generic detail.
- hero_title: exactly "Why MaRe × ${prospect.name} makes sense" (use the × character).
- Never mention scoring, confidence, "AI", "analysis", or internal terms.
- Never write about revenue as a guarantee. Refer to estimates/potential only.
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
