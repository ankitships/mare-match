// ============================================================================
// Orchestration — outreach generation
// ============================================================================

import { getProvider } from "@/lib/ai/provider";
import { buildOutreachPrompt } from "@/lib/prompts/outreach";
import { OutreachPayloadSchema, detectBannedPhrases, type OutreachPayload } from "@/lib/schemas/outreach";
import { store } from "@/lib/db/store";
import type { OutreachAssets, ProspectRecord, ProspectScore } from "@/lib/types";

function fallbackPayload(prospect: ProspectRecord, score: ProspectScore, micrositeUrl: string): OutreachPayload {
  const firstName = prospect.name.split(" ")[0];
  const hookEvidence = score.scored_categories
    .filter((c) => c.raw_subscore >= 6 && c.evidence.length)[0]?.evidence[0]?.claim ?? null;

  const hook = hookEvidence
    ? hookEvidence.replace(/\.$/, "")
    : `${prospect.name}${prospect.city ? ` in ${prospect.city}` : ""} stood out to us.`;

  const emailBody =
`Hi ${firstName},

We spent a little time with ${prospect.name} this week. ${hook}.

MaRe is a premium head-spa system — a device, a chair, Philip Martin's products, and a short ritual — built for salons that already treat the experience as the product. We think there is a considered version of this for your space.

We only open a small number of partnerships each season. If this reads correctly, I've put together a private page for you.

${micrositeUrl}

No obligation — a short, specific conversation.

Warmly,
The MaRe team`;

  return {
    email: {
      subject: `A considered note from MaRe — for ${prospect.name}`,
      body: emailBody,
    },
    dm: `Hi — we've been watching ${prospect.name}. ${hook}. MaRe opens a small number of partnerships each season; I'd love to share a private page if that's of interest.`,
    postcard: `${prospect.name} — a quiet note from MaRe. We've been watching your work. If the fit is right, we'd like to share a considered, private proposal.`,
    call_opener: `Hi — this is the MaRe partnerships team. We're not calling on a list. ${hook}. I wanted to see if it would be useful to share a short, private page we put together for you.`,
  };
}

export async function generateOutreach(opts: {
  prospect: ProspectRecord;
  score: ProspectScore;
  micrositeUrl: string;
}): Promise<OutreachAssets> {
  const { prospect, score, micrositeUrl } = opts;
  const provider = getProvider();

  let payload: OutreachPayload;
  try {
    if (provider.name === "mock") {
      payload = fallbackPayload(prospect, score, micrositeUrl);
    } else {
      const { system, user } = buildOutreachPrompt({
        prospect: {
          name: prospect.name,
          website_url: prospect.website_url,
          city: prospect.city,
          state: prospect.state,
        },
        score,
        micrositeUrl,
      });
      payload = await provider.completeJson({
        system,
        user,
        schema: OutreachPayloadSchema,
        schemaName: "OutreachPayload",
        temperature: 0.55,
        maxOutputTokens: 1600,
      });

      // Post-filter — if the LLM slipped a banned phrase, fail over to fallback
      const combined = [
        payload.email.subject,
        payload.email.body,
        payload.dm,
        payload.postcard,
        payload.call_opener,
      ].join("\n");
      const banned = detectBannedPhrases(combined);
      if (banned.length) {
        console.warn("[outreach] banned phrase detected:", banned);
        payload = fallbackPayload(prospect, score, micrositeUrl);
      }
    }
  } catch (err) {
    console.warn("[outreach] LLM failed, falling back:", err);
    payload = fallbackPayload(prospect, score, micrositeUrl);
  }

  const saved = await store.saveOutreach(prospect.id, {
    email_subject: payload.email.subject,
    email_body: payload.email.body,
    dm_body: payload.dm,
    postcard_copy: payload.postcard,
    call_opener: payload.call_opener,
  });

  await store.saveVersion({
    prospect_id: prospect.id,
    object_type: "outreach",
    payload_json: payload,
  });

  return saved;
}
