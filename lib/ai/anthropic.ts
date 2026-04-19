import type { ZodTypeAny, z } from "zod";
import type { LlmProvider, LlmRequest } from "./provider";

// Anthropic uses fetch directly to avoid adding another dep.
// If you prefer the SDK, swap this for `@anthropic-ai/sdk`.
export const anthropicProvider: LlmProvider = {
  name: "anthropic",
  async completeJson<S extends ZodTypeAny>(req: LlmRequest<S>): Promise<z.infer<S>> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

    const model = req.model || process.env.LLM_MODEL || "claude-sonnet-4-5";
    const body = {
      model,
      max_tokens: req.maxOutputTokens ?? 2400,
      temperature: req.temperature ?? 0.3,
      system:
        req.system +
        "\n\nRespond with a single JSON object only. Do not wrap in markdown fences. Do not add any prose before or after the JSON.",
      messages: [{ role: "user", content: req.user }],
    };

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
    }

    const json = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const text = json.content?.find((b) => b.type === "text")?.text ?? "";
    if (!text) throw new Error(`Anthropic returned empty text for ${req.schemaName}`);

    const cleaned = extractJsonObject(text);
    if (!cleaned) {
      console.warn(`[anthropic ${req.schemaName}] could not find JSON in output:`, text.slice(0, 400));
      throw new Error(`Anthropic returned non-JSON for ${req.schemaName}`);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      console.warn(`[anthropic ${req.schemaName}] JSON.parse failed. First 400 chars:`, cleaned.slice(0, 400));
      throw new Error(`Anthropic returned non-JSON for ${req.schemaName}: ${String(err)}`);
    }
    const result = req.schema.safeParse(parsed);
    if (!result.success) {
      const issues = result.error.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      console.warn(`[anthropic ${req.schemaName}] schema validation failed:`, issues);
      throw new Error(`Anthropic output failed schema (${req.schemaName}): ${issues}`);
    }
    return result.data;
  },
};

// Extract the first top-level JSON object from an LLM response, tolerating
// markdown fences and leading/trailing prose. Returns the substring suitable
// for JSON.parse, or null if no balanced object was found.
function extractJsonObject(raw: string): string | null {
  // Fast path: fenced ```json blocks
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();

  // Slow path: scan for balanced braces, respecting strings + escapes.
  const start = raw.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < raw.length; i++) {
    const ch = raw[i];
    if (inString) {
      if (escape) escape = false;
      else if (ch === "\\") escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return raw.slice(start, i + 1);
    }
  }
  return null;
}
