import type { ZodTypeAny, z } from "zod";
import type { LlmProvider, LlmRequest } from "./provider";

// Use the official openai SDK via dynamic import so the module stays lightweight
// if the env var is absent.
async function getClient() {
  const { default: OpenAI } = await import("openai");
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// zod-to-jsonSchema isn't a dep — we synthesize a minimal JSON schema from zod
// sufficient for "json_schema" response_format. For production you'd swap in
// the official zod-to-json-schema package.
function toLooseSchema(): Record<string, unknown> {
  // Instruct the model to return JSON only; we still validate on our side.
  return {
    name: "Output",
    schema: { type: "object", additionalProperties: true },
    strict: false,
  };
}

export const openaiProvider: LlmProvider = {
  name: "openai",
  async completeJson<S extends ZodTypeAny>(req: LlmRequest<S>): Promise<z.infer<S>> {
    const client = await getClient();
    const model = process.env.LLM_MODEL || "gpt-4o-mini";

    const resp = await client.chat.completions.create({
      model,
      temperature: req.temperature ?? 0.3,
      max_tokens: req.maxOutputTokens ?? 2400,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: req.system + "\n\nRespond with a single JSON object. No markdown, no commentary." },
        { role: "user", content: req.user },
      ],
    });

    const content = resp.choices[0]?.message?.content ?? "";
    if (!content) throw new Error(`OpenAI returned empty content for ${req.schemaName}`);

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch (err) {
      throw new Error(`OpenAI returned non-JSON for ${req.schemaName}: ${String(err)}`);
    }

    const result = req.schema.safeParse(parsed);
    if (!result.success) {
      throw new Error(
        `OpenAI output failed schema (${req.schemaName}): ${result.error.issues
          .slice(0, 3)
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; ")}`,
      );
    }
    return result.data;
    // Suppress unused to keep the hook for future structured-output upgrade
    void toLooseSchema;
  },
};
