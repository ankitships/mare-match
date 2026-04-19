#!/usr/bin/env node
// Debug: call Haiku with a synthetic evidence prompt and run the output
// through our exact Zod schema to identify validation failures.
import "dotenv/config";
import { readFileSync } from "node:fs";

const URL = process.argv[2] || "https://thesalonproject.com";

// Pull Firecrawl homepage
const fcRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
  },
  body: JSON.stringify({ url: URL, formats: ["markdown"], onlyMainContent: true }),
});
const fc = await fcRes.json();
const markdown = fc?.data?.markdown?.slice(0, 3800) ?? "";
console.log(`[fc] ${markdown.length} chars`);

// Load our prompt
const { buildEvidencePrompt } = await import("../lib/prompts/evidence.ts");
const { EvidencePayloadSchema } = await import("../lib/schemas/evidence.ts");

const { system, user } = buildEvidencePrompt({
  prospect: { name: "Debug", website_url: URL },
  crawled_sources: [{ source_type: "homepage", source_url: URL, content_excerpt: markdown }],
});

// Call Haiku directly
const res = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-api-key": process.env.ANTHROPIC_API_KEY,
    "anthropic-version": "2023-06-01",
  },
  body: JSON.stringify({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 5000,
    temperature: 0.25,
    system: system + "\n\nRespond with a single JSON object only. No fences.",
    messages: [{ role: "user", content: user }],
  }),
});
const out = await res.json();
const text = out.content?.[0]?.text ?? "";
console.log(`[haiku] ${text.length} chars`);

// Strip fences if any
const m = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
const clean = m ? m[1].trim() : text.trim();

// Parse JSON
let parsed;
try {
  parsed = JSON.parse(clean);
  console.log("[json] parsed ok");
} catch (err) {
  console.log("[json] parse failed:", err.message);
  console.log("first 600:", clean.slice(0, 600));
  process.exit(1);
}

// Validate with Zod
const result = EvidencePayloadSchema.safeParse(parsed);
if (result.success) {
  console.log("[zod] validation passed");
  console.log("categories:", result.data.categories.length);
} else {
  console.log("[zod] FAILED with", result.error.issues.length, "issues:");
  for (const issue of result.error.issues.slice(0, 10)) {
    console.log(" -", issue.path.join("."), ":", issue.message, "| received:", JSON.stringify(issue.received).slice(0,80));
  }
}
