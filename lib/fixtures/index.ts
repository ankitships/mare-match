// ============================================================================
// Fixture registry — imported directly so Next.js bundles them into the
// serverless output (Vercel's file tracer misses files read via fs.readFile).
// ============================================================================

import strongFit from "@/data/fixtures/strong-fit.json";
import weakFit from "@/data/fixtures/weak-fit.json";
import ambiguous from "@/data/fixtures/ambiguous.json";

import type { EvidencePayload } from "@/lib/schemas/evidence";

export interface FixtureFile {
  prospect: {
    name: string;
    slug: string;
    website_url: string;
    instagram_url?: string;
    city?: string;
    state?: string;
    notes?: string;
  };
  evidence_payload: EvidencePayload;
}

// Cast through unknown because TS resolveJsonModule widens literal unions.
export const FIXTURES: FixtureFile[] = [
  strongFit as unknown as FixtureFile,
  weakFit as unknown as FixtureFile,
  ambiguous as unknown as FixtureFile,
];

export function pickFixture(hayInput: string): FixtureFile | null {
  const hay = hayInput.toLowerCase();
  if (/desange|miami/.test(hay)) return FIXTURES[0];
  if (/cutzone|express|discount/.test(hay)) return FIXTURES[1];
  if (/rosano|ferretti|ambiguous/.test(hay)) return FIXTURES[2];
  return null;
}
