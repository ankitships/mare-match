# MaRe Match

A private, evidence-backed partner qualification tool for the MaRe team.
Paste a salon or spa URL. MaRe Match reads the site, scores the luxury fit
against a nine-category rubric, and drafts a polished, shareable partner
microsite plus four outreach artifacts for human review.

This is an internal tool for Rebecca / Marianna / growth. It is **not** a
public marketing site. Everything external is gated behind human approval.

---

## Quick start

```bash
# 1. Install
npm install

# 2. Seed demo data (no API keys required — uses fixtures)
USE_FIXTURES=1 npm run seed

# 3. Run the app
npm run dev
# → http://localhost:3000
```

After seeding, three prospects are browseable immediately:

| Prospect                | Expected score | Route                             |
| ----------------------- | -------------- | --------------------------------- |
| Desange Miami           | ~87 / 100      | `/prospects/desange-miami`        |
| Rosano Ferretti NYC     | ~69 / 100      | `/prospects/rosano-ferretti-nyc`  |
| CutZone Express         | ~25 / 100      | `/prospects/cutzone-express`      |

Each has a scored review page, a polished external microsite at
`/partner/<slug>`, and a ready-to-edit outreach studio.

---

## Environment

Copy `.env.example` to `.env.local` and fill in what you have. The app runs
in three modes depending on which keys are set:

| Mode               | Trigger                                       | Behavior                                                                 |
| ------------------ | --------------------------------------------- | ------------------------------------------------------------------------ |
| **Fixtures only**  | `USE_FIXTURES=1`                              | No external calls. Uses `data/fixtures/*.json`. Fastest demo mode.       |
| **Live (no keys)** | No `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`    | Crawls real sites if `FIRECRAWL_API_KEY` set, otherwise falls through to fixtures by URL match, otherwise emits an "insufficient evidence" payload. |
| **Live (full)**    | `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` set   | Full pipeline: Firecrawl crawl → LLM evidence extraction → code-weighted scoring → LLM microsite + outreach writing. |

Env vars:

- `OPENAI_API_KEY` *or* `ANTHROPIC_API_KEY` — the LLM. Pick one.
- `LLM_PROVIDER` — `openai` (default) or `anthropic`.
- `LLM_MODEL` — e.g. `claude-sonnet-4-5` (default), `gpt-4o`, `gpt-4o-mini`.
- `FIRECRAWL_API_KEY` — enables real crawling. Without it the pipeline skips
  crawling and relies on fixtures / insufficient-evidence fallback.
- `NEXT_PUBLIC_APP_URL` — used when constructing shareable microsite URLs
  inside outreach. Defaults to `http://localhost:3000`.
- `USE_FIXTURES=1` — force fixture mode even if keys are present.
- Supabase vars (optional) — if unset, a file-based JSON store is used under
  `data/storage/`.

---

## What's real vs. mocked

| Capability                     | Real                         | Mocked / fallback                         |
| ------------------------------ | ---------------------------- | ----------------------------------------- |
| URL intake + slugging          | Real                         | —                                         |
| Firecrawl crawl & screenshots  | Real (requires key)          | Falls through to fixture match            |
| Evidence extraction (LLM)      | Real (requires key)          | Falls through to `data/fixtures/*.json`   |
| Weighted scoring               | **Always real** (in code)    | —                                         |
| Revenue band + confidence      | **Always real** (in code)    | —                                         |
| Microsite copy (LLM)           | Real (requires key)          | Deterministic fallback payload            |
| Outreach copy (LLM)            | Real (requires key)          | Deterministic fallback + banned-phrase post-filter |
| ROI calculator                 | **Always real** (pure math)  | —                                         |
| Storage                        | Supabase (if env set)        | File-based JSON at `data/storage/`        |
| Approval workflow + versioning | Real                         | —                                         |
| Outbound sending               | Not integrated (by design)   | Copy / share link only                    |

The scoring math, revenue band logic, and ROI formulas all live in TypeScript —
never in a prompt — so they are inspectable, deterministic, and reviewable.

---

## Architecture

```
app/
├── page.tsx                         Intake + recent prospects
├── prospects/page.tsx               All prospects
├── prospects/[slug]/page.tsx        Internal review (score hero, evidence, red flags, approval)
├── prospects/[slug]/outreach/       Outreach studio (4 artifacts, edit + regenerate + version)
├── partner/[slug]/page.tsx          External partner microsite (shareable)
└── api/                             analyze · microsite · outreach · approve · version

components/
├── ui/                              shadcn-style primitives
├── internal/                        ScoreHero, CategoryTabs, RedFlagsCard, ApprovalControls, GenerateActions
├── microsite/                       Hero, WhySelected, MaReSystem, Roi (live calc), Implementation, Different, NextStep
└── outreach/                        Studio with 4-tab editor

lib/
├── ai/                              Provider abstraction (OpenAI / Anthropic / mock)
├── crawl/firecrawl.ts               Scrape + map (graceful degradation)
├── prompts/                         evidence · microsite · outreach · voice/banned phrases
├── schemas/                         Zod schemas — strict validation on all LLM output
├── scoring/                         engine.ts (weighted rubric + caps) · roi.ts (pure math)
├── orchestration/                   analyze · microsite · outreach pipelines
├── db/store.ts                      File-based + Supabase-ready store
└── types.ts                         Domain types

data/
├── fixtures/                        Three deterministic prospects (strong / weak / ambiguous)
└── storage/                         File-based JSON persistence (git-ignored)

supabase/migrations/                 Production-ready SQL schema (8 tables)
```

### Scoring rubric (source of truth)

Nine weighted categories, sum 100. The LLM proposes per-category evidence
and a 0–10 score hint; code computes the final weighted total.

| # | Category                            | Weight |
| - | ----------------------------------- | ------ |
| A | Premium aesthetic / brand           | 20     |
| B | Service sophistication              | 12     |
| C | Retail sophistication               | 10     |
| D | Wellness & scalp adjacency          | 12     |
| E | Clientele affluence                 | 12     |
| F | Operational fit                     | 10     |
| G | Scale signals                       | 10     |
| H | Revenue band likelihood             | 8      |
| I | Exclusivity / brand-fit guardrail   | 6      |

Hard-fail flags cap the total before scoring runs:

- `mass_market_discount` → cap 40
- `heavy_coupon_behavior` → cap 40
- `low_end_aesthetic` → cap 45
- `poor_service_presentation` → cap 50
- `operational_mismatch` → cap 55
- `weak_clientele_signal` → cap 55

Low aggregate confidence → 5-point penalty.

Revenue is reported **only as a band**, never as an exact figure:
`likely_above_1m` · `possibly_above_1m` · `insufficient_evidence` · `likely_below_target`.

---

## Demo script (founder / judge walkthrough, ~3 minutes)

1. **Intake** — at `/`, paste one of the three demo URLs and click
   *Analyze prospect*. (e.g. `https://desangesalon.example` → strong fit.)
2. **Internal review** — the score hero shows `87 / 100 · Strong fit`, a
   per-category weighted bar chart, revenue band, and a transparency note
   explaining the math.
3. **Evidence** — click through the Evidence tabs to see each claim traced to
   a source URL, with a per-claim confidence.
4. **Red flags** — open the ambiguous or weak-fit prospects to see hard-fail
   caps applied.
5. **Regenerate microsite** — click *Regenerate microsite* (or *Generate*). The
   external page is at `/partner/desange-miami`.
6. **External microsite** — a polished editorial page with Hero, Why you were
   selected, MaRe System (5 pillars), live ROI calculator, Implementation,
   Why this feels different, Next step CTA. **No internal diagnostics appear.**
7. **ROI calculator** — change sliders on the microsite; totals and low/base/high
   scenarios update in real time.
8. **Outreach studio** — at `/prospects/desange-miami/outreach`: tabbed
   email / DM / postcard / call-opener with copy buttons, regenerate, and a
   banned-phrase tone check.
9. **Approval** — three gates (fit score, microsite, outreach). All three
   green unlocks *Publish* + *Copy share link*. Nothing is ever auto-sent.

---

## Code quality

- TypeScript strict mode, zero `tsc --noEmit` errors.
- Every LLM payload is validated by a Zod schema; failures surface as
  recoverable errors with a deterministic fallback.
- Separation of concerns: LLMs extract evidence; code computes scores; UI
  renders. Swap providers without touching the rubric.
- Versioning persists every score, microsite, and outreach payload so
  regenerations preserve history.

## Supabase migration

To move off the file store, set the three `NEXT_PUBLIC_SUPABASE_*` and
`SUPABASE_SERVICE_ROLE_KEY` env vars, then run
`supabase/migrations/20260419_init.sql` against your project. The `store.ts`
interface is identical — switch the implementation inside that file to use
the Supabase client.
