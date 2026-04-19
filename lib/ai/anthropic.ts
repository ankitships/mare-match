import type { ZodTypeAny, z } from "zod";
import type { LlmProvider, LlmRequest } from "./provider";

// Anthropic uses fetch directly to avoid adding another dep.
// If you prefer the SDK, swap this for `@anthropic-ai/sdk`.
export const anthropicProvider: LlmProvider = {
  name: "anthropic",
  async completeJson<S extends ZodTypeAny>(req: LlmRequest<S>): Promise<z.infer<S>> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

    const model = process.env.LLM_MODEL || "claude-sonnet-4-5";
    const body = {
      model,
      max_tokens: req.maxOutputTokens ?? 2400,
      temperature: req.temperature ?? 0.3,
      system: req.system + "\n\nReturn a single valid JSON object with no markdown fences.",
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

    // Strip accidental markdown fences if any
    const cleaned = text.trim().replace(/^```(?:json)?\n?/i, "").replace(/```$/i, "").trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      throw new Error(`Anthropic returned non-JSON for ${req.schemaName}: ${String(err)}`);
    }
    const result = req.schema.safeParse(parsed);
    if (!result.success) {
      throw new Error(
        `Anthropic output failed schema (${req.schemaName}): ${result.error.issues
          .slice(0, 3)
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; ")}`,
      );
    }
    return result.data;
  },
};
