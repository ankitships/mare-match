// ============================================================================
// LLM Provider abstraction
// ----------------------------------------------------------------------------
// Supports OpenAI and Anthropic. Both are called in a "strict JSON" mode —
// the caller provides a system prompt, a user prompt, and a JSON schema; we
// return a parsed+validated object or throw.
//
// Swap providers by setting LLM_PROVIDER env var.
// ============================================================================

import type { ZodTypeAny, z } from "zod";

export interface LlmRequest<S extends ZodTypeAny> {
  system: string;
  user: string;
  schema: S;
  schemaName: string;           // used as function/tool name for providers that need it
  maxOutputTokens?: number;
  temperature?: number;
  model?: string;               // override LLM_MODEL for this one call (e.g. Haiku for speed)
}

export interface LlmProvider {
  name: "openai" | "anthropic" | "mock";
  completeJson<S extends ZodTypeAny>(req: LlmRequest<S>): Promise<z.infer<S>>;
}

// --- Mock provider (used when USE_FIXTURES=1 or no API keys) ---------------
import { mockProvider } from "./mock";
// --- Real providers ---------------------------------------------------------
import { openaiProvider } from "./openai";
import { anthropicProvider } from "./anthropic";

export function getProvider(): LlmProvider {
  if (process.env.USE_FIXTURES === "1") return mockProvider;

  const configured = (process.env.LLM_PROVIDER ?? "openai").toLowerCase();

  if (configured === "anthropic" && process.env.ANTHROPIC_API_KEY) {
    return anthropicProvider;
  }
  if (configured === "openai" && process.env.OPENAI_API_KEY) {
    return openaiProvider;
  }
  // Fallback order: whichever key is present
  if (process.env.OPENAI_API_KEY) return openaiProvider;
  if (process.env.ANTHROPIC_API_KEY) return anthropicProvider;

  return mockProvider;
}
