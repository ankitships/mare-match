// ============================================================================
// Orchestration — microsite generation
// ============================================================================

import { randomUUID } from "node:crypto";
import { getProvider } from "@/lib/ai/provider";
import { buildMicrositePrompt } from "@/lib/prompts/microsite";
import { MicrositePayloadSchema, type MicrositePayload } from "@/lib/schemas/microsite";
import { store } from "@/lib/db";
import type { MicrositeRecord, ProspectRecord, ProspectScore } from "@/lib/types";

// Build a safe fallback microsite payload when no LLM is available
function fallbackPayload(prospect: ProspectRecord, score: ProspectScore): MicrositePayload {
  const city = prospect.city ? `, ${prospect.city}` : "";
  const topEvidence = score.scored_categories
    .filter((c) => c.raw_subscore >= 6 && c.evidence.length)
    .slice(0, 3);

  const why = topEvidence.length
    ? topEvidence.map((c) => ({
        headline: c.category.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()),
        body: c.evidence[0]?.claim ?? "A specific signal from your salon aligns with MaRe's system.",
      }))
    : [
        {
          headline: "Aesthetic alignment",
          body: `${prospect.name} reads as composed and intentional — the register MaRe was built for.`,
        },
        {
          headline: "System fit",
          body: "Your service framing suggests room to add a ritual-led scalp experience without disruption.",
        },
        {
          headline: "Selective pairing",
          body: "MaRe opens a small number of partnerships each season. This feels like one worth exploring.",
        },
      ];

  return {
    hero_title: `A quiet proposal for ${prospect.name}`,
    hero_subtitle: `A considered case for pairing ${prospect.name}${city} with the MaRe system, built around what already works at your salon.`,
    why_selected: why.slice(0, 5),
    mare_system: [
      { pillar: "MaRe Eye", body: "An AI-assisted scalp analysis that turns each guest's visit into a personalized record of care." },
      { pillar: "MaRe Capsule", body: "A premium multisensory chair built for a focused, fully immersive head-spa experience." },
      { pillar: "Philip Martin's", body: "Italian professional and homecare products chosen for continuity between the salon and the home." },
      { pillar: "Ritual System", body: "Standardized 35 / 60 / 90-minute protocols that make the experience repeatable and trainable." },
      { pillar: "Training & Support", body: "A MaRe Master is trained from your existing team, certified, and supported as the program grows." },
    ],
    implementation: [
      { requirement: "Dedicated treatment room", detail: "A quiet, private room so the ritual runs undisturbed from start to finish." },
      { requirement: "Plumbing", detail: "Standard salon-grade plumbing — no specialized infrastructure required." },
      { requirement: "Electrical", detail: "Basic electrical prep to support the Capsule and the Eye device." },
      { requirement: "Certified MaRe Master", detail: "One team member certified and on-protocol, with optional secondary training." },
      { requirement: "Retail display space", detail: "A small, curated shelf for Philip Martin's products to support continuity of care." },
    ],
    why_different_body: `We open a small number of partnerships each season. The fit has to feel mutually elevating — a salon we learn from, and a system your guests can feel on their first visit.`,
    next_step: {
      cta_label: "Reply to the email",
      message: `If this reads correctly, reply to the email. No form. No meeting link. Just a note.`,
    },
    theme: {},
  };
}

export async function generateMicrosite(opts: {
  prospect: ProspectRecord;
  score: ProspectScore;
}): Promise<MicrositeRecord> {
  const { prospect, score } = opts;
  const provider = getProvider();

  let payload: MicrositePayload;
  try {
    if (provider.name === "mock") {
      payload = fallbackPayload(prospect, score);
    } else {
      const { system, user } = buildMicrositePrompt({
        prospect: {
          name: prospect.name,
          website_url: prospect.website_url,
          city: prospect.city,
          state: prospect.state,
        },
        score,
      });
      payload = await provider.completeJson({
        system,
        user,
        schema: MicrositePayloadSchema,
        schemaName: "MicrositePayload",
        temperature: 0.55,
        maxOutputTokens: 2400,
      });
    }
  } catch (err) {
    console.warn("[microsite] LLM failed, falling back:", err);
    payload = fallbackPayload(prospect, score);
  }

  const now = new Date().toISOString();
  const existing = await store.getMicrositeByProspect(prospect.id);

  // Pull prospect-owned imagery off the saved sources so the microsite can
  // display them in the Why-You-Were-Selected gallery.
  const sources = await store.listSources(prospect.id);
  const prospectImages = sources
    .flatMap((s) => ((s.metadata_json as { prospect_images?: string[] } | undefined)?.prospect_images ?? []))
    .slice(0, 6);

  const record: MicrositeRecord = {
    id: existing?.id ?? randomUUID(),
    prospect_id: prospect.id,
    slug: prospect.slug,
    hero_title: payload.hero_title,
    hero_subtitle: payload.hero_subtitle,
    why_selected_json: payload.why_selected,
    mare_system_json: payload.mare_system,
    implementation_json: payload.implementation,
    next_step_json: { cta_label: payload.next_step.cta_label, message: payload.next_step.message },
    theme_json: { ...(payload.theme ?? {}), prospect_images: prospectImages },
    why_different_body: payload.why_different_body,
    published: existing?.published ?? false,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };

  await store.saveMicrosite(record);
  await store.saveVersion({
    prospect_id: prospect.id,
    object_type: "microsite",
    payload_json: payload,
  });

  return record;
}
