import { NextResponse } from "next/server";
import { z } from "zod";
import { store } from "@/lib/db/store";
import { generateOutreach } from "@/lib/orchestration/outreach";

export const runtime = "nodejs";
export const maxDuration = 60;

const BodySchema = z.object({ prospect_id: z.string() });

export async function POST(req: Request) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const prospect = await store.getProspect(parsed.data.prospect_id);
  if (!prospect) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const score = await store.getLatestScore(prospect.id);
  if (!score) return NextResponse.json({ error: "score_required" }, { status: 409 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const micrositeUrl = `${appUrl.replace(/\/$/, "")}/partner/${prospect.slug}`;

  try {
    const assets = await generateOutreach({ prospect, score, micrositeUrl });
    return NextResponse.json({ ok: true, version: assets.version_number });
  } catch (err) {
    console.error("[api/outreach] failed:", err);
    return NextResponse.json({ error: "outreach_failed", message: String(err) }, { status: 500 });
  }
}

// PUT — manual edits from the internal Outreach Studio
const EditSchema = z.object({
  prospect_id: z.string(),
  email_subject: z.string(),
  email_body: z.string(),
  dm_body: z.string(),
  postcard_copy: z.string(),
  call_opener: z.string(),
});

export async function PUT(req: Request) {
  const parsed = EditSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const { prospect_id, ...assets } = parsed.data;
  const saved = await store.saveOutreach(prospect_id, assets);
  await store.saveVersion({
    prospect_id,
    object_type: "outreach",
    payload_json: assets,
  });
  return NextResponse.json({ ok: true, version: saved.version_number });
}
