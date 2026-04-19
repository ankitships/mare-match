// Diagnostic: run the full evidence-extraction pipeline on a live URL
// and return the raw Haiku output alongside the parsed result.
// GET /api/diag/evidence?url=https://thesalonproject.com
import { NextResponse } from "next/server";

import { crawlProspect, truncatePageContent } from "@/lib/crawl/firecrawl";
import { buildEvidencePrompt } from "@/lib/prompts/evidence";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  const url = new URL(req.url).searchParams.get("url");
  if (!url) return NextResponse.json({ error: "url query param required" }, { status: 400 });

  const crawled = await crawlProspect({ website_url: url });

  const { system, user } = buildEvidencePrompt({
    prospect: { name: "Diagnostic", website_url: url },
    crawled_sources: crawled.map((p) => ({
      source_type: p.source_type,
      source_url: p.url,
      content_excerpt: truncatePageContent(p),
    })),
  });

  // Call Anthropic directly so we can inspect the RAW output text.
  const model = process.env.LLM_MODEL_FAST || "claude-haiku-4-5-20251001";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 2800,
      temperature: 0.25,
      system: system + "\n\nRespond with a single JSON object only. No fences. No prose.",
      messages: [{ role: "user", content: user }],
    }),
  });

  const statusCode = res.status;
  const body = await res.text();

  return NextResponse.json({
    ok: statusCode === 200,
    model,
    statusCode,
    crawled_count: crawled.length,
    crawled_urls: crawled.map((p) => p.url),
    raw_body: body.slice(0, 6000),
  });
}
