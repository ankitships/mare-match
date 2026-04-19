// Diagnostic: exercise the LLM provider end-to-end so we can see the real
// error on Vercel (instead of the outreach/microsite orchestrators silently
// falling back).
import { NextResponse } from "next/server";
import { z } from "zod";
import { getProvider } from "@/lib/ai/provider";

export const runtime = "nodejs";
export const maxDuration = 60;

const DiagSchema = z.object({
  ok: z.boolean(),
  echo: z.string().min(1).max(60),
});

export async function GET() {
  const provider = getProvider();
  try {
    const out = await provider.completeJson({
      system: 'Return strict JSON: {"ok": true, "echo": "sonnet-4-5 diagnostic"}',
      user: "emit the json",
      schema: DiagSchema,
      schemaName: "DiagSchema",
      temperature: 0,
      maxOutputTokens: 200,
    });
    return NextResponse.json({ ok: true, provider: provider.name, out });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        provider: provider.name,
        model: process.env.LLM_MODEL,
        llm_provider_env: process.env.LLM_PROVIDER,
        has_anthropic_key: !!process.env.ANTHROPIC_API_KEY,
        has_openai_key: !!process.env.OPENAI_API_KEY,
        error: String(err).slice(0, 400),
      },
      { status: 500 },
    );
  }
}
