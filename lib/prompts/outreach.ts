import { MARE_SYSTEM_CONTEXT, MARE_VOICE_RULES } from "./voice";
import type { ProspectScore } from "@/lib/types";
import { BANNED_PHRASES } from "@/lib/schemas/outreach";

export interface OutreachPromptInput {
  prospect: {
    name: string;
    website_url: string;
    city?: string;
    state?: string;
  };
  score: ProspectScore;
  micrositeUrl: string;
}

export function buildOutreachPrompt({ prospect, score, micrositeUrl }: OutreachPromptInput) {
  const hooks = score.scored_categories
    .filter((c) => c.raw_subscore >= 7 && c.evidence.length)
    .slice(0, 3)
    .flatMap((c) => c.evidence.slice(0, 1).map((e) => `- ${e.claim}`))
    .join("\n");

  const system = `
You are MaRe's partnerships voice for outbound outreach. Your audience is the
owner or creative director of a premium salon. Every artifact MUST follow a
3-part structure: Hook (specific reference to this salon) → Value (what MaRe
brings) → Guardrail (why MaRe is selective).

${MARE_SYSTEM_CONTEXT}

${MARE_VOICE_RULES}

Banned phrases (never use these or close variants):
${BANNED_PHRASES.map((p) => `- ${p}`).join("\n")}

Return strict JSON matching:

{
  "email": {
    "subject": "<short, composed, not a subject-line gimmick>",
    "body": "<2-4 short paragraphs. End with: a single-line CTA to view the private partner page at ${micrositeUrl}>"
  },
  "dm": "<Instagram DM or similar, 2-4 short lines>",
  "postcard": "<one short printed card copy block, 2-3 sentences>",
  "call_opener": "<what you'd say in the first 15 seconds of a cold call — human, not scripted>"
}

Rules:
- Each artifact must reference at least one specific hook from this prospect.
- No emojis. No exclamation marks. No hype.
- Do not claim exact revenue outcomes. Use "estimates" or "potential" language.
- Do not make the email longer than ~180 words.
- The email MUST include the microsite URL once, on its own line near the end.
- Output only the JSON object.
`.trim();

  const user = `
PROSPECT
Name: ${prospect.name}
Website: ${prospect.website_url}
Location: ${[prospect.city, prospect.state].filter(Boolean).join(", ") || "unknown"}
Fit score: ${score.total}/100 · Recommendation: ${score.recommendation}

SPECIFIC HOOKS (use these)
${hooks || "(thin — reference the salon's name and city with restraint)"}

MICROSITE URL
${micrositeUrl}

Produce the JSON now.
`.trim();

  return { system, user };
}
