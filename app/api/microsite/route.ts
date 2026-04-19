import { NextResponse } from "next/server";
import { z } from "zod";
import { store } from "@/lib/db/store";
import { generateMicrosite } from "@/lib/orchestration/microsite";

export const runtime = "nodejs";
export const maxDuration = 60;

const BodySchema = z.object({ prospect_id: z.string() });

export async function POST(req: Request) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const prospect = await store.getProspect(parsed.data.prospect_id);
  if (!prospect) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const score = await store.getLatestScore(prospect.id);
  if (!score) return NextResponse.json({ error: "score_required" }, { status: 409 });

  try {
    const microsite = await generateMicrosite({ prospect, score });
    return NextResponse.json({ ok: true, slug: microsite.slug });
  } catch (err) {
    console.error("[api/microsite] failed:", err);
    return NextResponse.json({ error: "microsite_failed", message: String(err) }, { status: 500 });
  }
}

// PATCH — toggle published
export async function PATCH(req: Request) {
  const parsed = z
    .object({ prospect_id: z.string(), published: z.boolean() })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  await store.setMicrositePublished(parsed.data.prospect_id, parsed.data.published);
  return NextResponse.json({ ok: true });
}
