import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeProspect } from "@/lib/orchestration/analyze";

const BodySchema = z.object({
  website_url: z.string().url(),
  name: z.string().optional(),
  instagram_url: z.string().url().optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  city: z.string().optional(),
  state: z.string().optional(),
  notes: z.string().optional(),
});

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const result = await analyzeProspect(parsed.data);
    return NextResponse.json({
      ok: true,
      slug: result.prospect.slug,
      prospect_id: result.prospect.id,
      source_count: result.source_count,
      used_fixture: result.used_fixture,
    });
  } catch (err) {
    console.error("[api/analyze] failed:", err);
    return NextResponse.json({ error: "analyze_failed", message: String(err) }, { status: 500 });
  }
}
