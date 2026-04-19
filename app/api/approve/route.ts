import { NextResponse } from "next/server";
import { z } from "zod";
import { store } from "@/lib/db/store";

export const runtime = "nodejs";

const BodySchema = z.object({
  prospect_id: z.string(),
  gate: z.enum(["fit_score", "microsite", "outreach"]),
  value: z.boolean(),
  approved_by: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const current = await store.getApproval(parsed.data.prospect_id);
  const next = { ...current };

  if (parsed.data.gate === "fit_score") next.fit_score_approved = parsed.data.value;
  if (parsed.data.gate === "microsite") next.microsite_approved = parsed.data.value;
  if (parsed.data.gate === "outreach") next.outreach_approved = parsed.data.value;

  if (parsed.data.value) {
    next.approved_by = parsed.data.approved_by ?? "MaRe Team";
    next.approved_at = new Date().toISOString();
  }
  if (parsed.data.notes) next.notes = parsed.data.notes;

  await store.setApproval(next);

  // Bump prospect status if all three gates pass
  if (next.fit_score_approved && next.microsite_approved && next.outreach_approved) {
    await store.updateProspectStatus(parsed.data.prospect_id, "approved");
  }

  return NextResponse.json({ ok: true, approval: next });
}
