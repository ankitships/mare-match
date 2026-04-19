import type { ZodTypeAny, z } from "zod";
import type { LlmProvider, LlmRequest } from "./provider";

// Mock provider reads /data/fixtures by heuristic so demos run without keys.
// Each prompt template sets `schemaName` so we can route accurately.
export const mockProvider: LlmProvider = {
  name: "mock",
  async completeJson<S extends ZodTypeAny>(req: LlmRequest<S>): Promise<z.infer<S>> {
    // We wire prompts→fixtures elsewhere; if this runs, throw so the caller
    // explicitly handles fixture mode instead of silently returning zeros.
    throw new Error(
      `Mock LLM reached for ${req.schemaName} — set USE_FIXTURES=1 and use the fixture loader, or set OPENAI_API_KEY / ANTHROPIC_API_KEY.`,
    );
  },
};
