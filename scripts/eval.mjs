#!/usr/bin/env node
// ============================================================================
// MaRe Match eval harness
// ----------------------------------------------------------------------------
// Targets a deployed URL (default: production). Runs programmatic checks and
// emits a JSON score. Visual / premium-feel checks are annotated in the
// output but scored by the operator via `--visual` flags.
// ============================================================================

const TARGET = process.env.EVAL_TARGET || "https://mare-match.vercel.app";
const STRICT = process.env.EVAL_STRICT === "1";

const CATEGORIES = [
  { id: "intake", weight: 10 },
  { id: "internal_review", weight: 15 },
  { id: "external_microsite", weight: 20 },
  { id: "roi_calc", weight: 10 },
  { id: "outreach_studio", weight: 10 },
  { id: "approval_workflow", weight: 10 },
  { id: "scoring_accuracy", weight: 10 },
  { id: "visual_quality", weight: 10 },
  { id: "no_errors", weight: 5 },
];

const results = new Map(CATEGORIES.map((c) => [c.id, { earned: 0, max: c.weight, notes: [] }]));

function pass(cat, pts, note) {
  const r = results.get(cat);
  r.earned += pts;
  r.notes.push(`✓ +${pts} ${note}`);
}
function fail(cat, pts, note) {
  const r = results.get(cat);
  r.notes.push(`✗ −${pts} ${note}`);
}

async function fetchStatus(path) {
  const res = await fetch(`${TARGET}${path}`, { redirect: "follow" });
  return { status: res.status, body: await res.text(), headers: res.headers };
}

async function postJson(path, body) {
  const res = await fetch(`${TARGET}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, body: text };
}

// --- 1. Intake flow ---------------------------------------------------------
async function evalIntake() {
  const home = await fetchStatus("/");
  if (home.status !== 200) return fail("intake", 10, "home returned " + home.status);
  pass("intake", 3, "home loads 200");

  if (/Luxury fit|Analyze prospect|MaRe Match|Partner Qualification/.test(home.body))
    pass("intake", 3, "home has masthead + intake copy");
  else fail("intake", 3, "home missing masthead copy");

  if (/name="website_url"/.test(home.body)) pass("intake", 2, "intake form present");
  else fail("intake", 2, "intake form input missing");

  if (/recent prospects|Recent prospects/i.test(home.body)) pass("intake", 2, "recent prospects section present");
  else fail("intake", 2, "recent prospects missing");
}

// --- 2. Internal review -----------------------------------------------------
async function evalInternalReview() {
  const r = await fetchStatus("/prospects/desange-miami");
  if (r.status !== 200) return fail("internal_review", 15, "internal review 200: got " + r.status);
  pass("internal_review", 2, "page loads 200");

  const checks = [
    [/Luxury fit score/i, 2, "score hero present"],
    [/Strong fit|Worth reviewing|Not a fit/, 2, "recommendation badge"],
    [/Category breakdown/i, 2, "subcategory breakdown"],
    [/Revenue band/i, 2, "revenue band present"],
    [/How this was computed/i, 1, "transparency note"],
    [/Evidence/i, 2, "evidence section"],
    [/Red flags/i, 1, "red flags card"],
    [/Approval/i, 2, "approval controls"],
    [/Regenerate|Generate/i, 1, "generate actions"],
  ];
  for (const [re, pts, label] of checks) {
    if (re.test(r.body)) pass("internal_review", pts, label);
    else fail("internal_review", pts, label + " missing");
  }
}

// --- 3. External microsite --------------------------------------------------
async function evalExternal() {
  const r = await fetchStatus("/partner/desange-miami");
  if (r.status !== 200) return fail("external_microsite", 20, "microsite 200: got " + r.status);
  pass("external_microsite", 2, "page loads 200");

  const sections = [
    [/Why MaRe × Desange Miami makes sense/i, 2, "hero title present (with × char)"],
    [/Why you were selected/i, 2, "why-selected section"],
    [/The MaRe System/i, 2, "MaRe System section"],
    [/MaRe Eye/i, 1, "MaRe Eye pillar"],
    [/MaRe Capsule/i, 1, "MaRe Capsule pillar"],
    [/Philip Martin/i, 1, "Philip Martin's pillar"],
    [/Ritual System/i, 1, "Ritual System pillar"],
    [/Training &amp; Support|Training & Support/i, 1, "Training pillar"],
    [/Opportunity|Annualized upside/i, 2, "ROI section"],
    [/Implementation/i, 1, "Implementation section"],
    [/Dedicated treatment room/i, 1, "implementation detail"],
    [/Why this feels different/i, 1, "Why different section"],
    [/Next step/i, 1, "Next step section"],
    [/Book a conversation/i, 1, "CTA present"],
  ];
  for (const [re, pts, label] of sections) {
    if (re.test(r.body)) pass("external_microsite", pts, label);
    else fail("external_microsite", pts, label + " missing");
  }

  // Internal leakage — must NOT appear on external page
  const forbidden = [
    [/Luxury fit score/i, 3, "internal score leaked"],
    [/Red flags/i, 3, "red flags leaked"],
    [/confidence level|aggregate confidence/i, 3, "internal confidence leaked"],
    [/raw_subscore|weighted_subscore/i, 3, "raw scoring fields leaked"],
    [/Approval/i, 3, "approval UI leaked"],
  ];
  let leaked = false;
  for (const [re, pts, label] of forbidden) {
    if (re.test(r.body)) { fail("external_microsite", pts, "LEAK: " + label); leaked = true; }
  }
  if (!leaked) pass("external_microsite", 0, "no internal leakage");
}

// --- 4. ROI calculator — static/SSR presence ---------------------------------
async function evalRoi() {
  const r = await fetchStatus("/partner/desange-miami");
  if (!/Annualized upside/i.test(r.body)) return fail("roi_calc", 10, "ROI section absent");
  pass("roi_calc", 2, "ROI section rendered");

  const checks = [
    [/Sessions per week/i, 1, "sessions input"],
    [/35-min mix|60-min mix|90-min mix/i, 1, "ritual mix inputs"],
    [/Retail attach/i, 1, "retail attach input"],
    [/Utilization/i, 1, "utilization input"],
    [/Low|Base|High/, 2, "scenario labels"],
    [/Monthly service revenue/i, 1, "monthly service output"],
    [/Monthly retail revenue/i, 1, "monthly retail output"],
    [/Estimates based on/i, 1, "disclaimer present"],
  ];
  for (const [re, pts, label] of checks) {
    if (re.test(r.body)) pass("roi_calc", pts, label);
    else fail("roi_calc", pts, label + " missing");
  }
}

// --- 5. Outreach studio -----------------------------------------------------
async function evalOutreach() {
  const r = await fetchStatus("/prospects/desange-miami/outreach");
  if (r.status !== 200) return fail("outreach_studio", 10, "outreach 200: got " + r.status);
  pass("outreach_studio", 2, "page loads 200");

  const checks = [
    [/Outreach studio/i, 1, "studio header"],
    [/Email/, 1, "email tab"],
    [/DM|Instagram/i, 1, "dm tab"],
    [/Postcard/i, 1, "postcard tab"],
    [/Call opener/i, 1, "call opener tab"],
    [/Version \d/i, 1, "version indicator"],
    [/Regenerate/i, 1, "regenerate control"],
    [/Save draft/i, 1, "save control"],
    [/Hook.+Value.+Guardrail|Nothing is auto-sent/i, 1, "guardrail copy"],
  ];
  for (const [re, pts, label] of checks) {
    if (re.test(r.body)) pass("outreach_studio", pts, label);
    else fail("outreach_studio", pts, label + " missing");
  }
}

// --- 6. Approval API contract -----------------------------------------------
async function evalApproval() {
  // Seed a disposable prospect via the public API
  const a = await postJson("/api/analyze", {
    website_url: "https://desangesalon.example",
    name: "Desange Miami",
  });
  if (a.status !== 200 || !a.json?.prospect_id) return fail("approval_workflow", 10, "analyze failed: " + a.status);
  pass("approval_workflow", 1, "analyze API works");
  const pid = a.json.prospect_id;

  const ms = await postJson("/api/microsite", { prospect_id: pid });
  if (ms.status === 200) pass("approval_workflow", 1, "microsite API works");
  else fail("approval_workflow", 1, "microsite API failed " + ms.status);

  const ot = await postJson("/api/outreach", { prospect_id: pid });
  if (ot.status === 200) pass("approval_workflow", 1, "outreach API works");
  else fail("approval_workflow", 1, "outreach API failed " + ot.status);

  // Toggle each gate
  for (const gate of ["fit_score", "microsite", "outreach"]) {
    const res = await postJson("/api/approve", { prospect_id: pid, gate, value: true });
    if (res.status === 200 && res.json?.ok) pass("approval_workflow", 2, `${gate} gate toggles`);
    else fail("approval_workflow", 2, `${gate} gate failed`);
  }

  // Verify status propagates to approved
  const afterAll = await postJson("/api/approve", { prospect_id: pid, gate: "fit_score", value: true });
  if (afterAll.json?.approval?.fit_score_approved) pass("approval_workflow", 1, "approval state persists");
  else fail("approval_workflow", 1, "approval state did not persist");
}

// --- 7. Scoring accuracy — fixtures in expected bands ------------------------
async function evalScoringAccuracy() {
  const strong = await postJson("/api/analyze", { website_url: "https://desangesalon.example", name: "Desange Miami" });
  const weak = await postJson("/api/analyze", { website_url: "https://cutzone-express.example", name: "CutZone Express" });
  const mid = await postJson("/api/analyze", { website_url: "https://rosanoferretti-nyc.example", name: "Rosano Ferretti NYC" });

  // We don't get the score from analyze() endpoint directly; inspect the internal page instead.
  async function scoreFromPage(slug) {
    const r = await fetchStatus(`/prospects/${slug}`);
    const m = r.body.match(/tabular-nums">\s*(\d+)\s*<\/span>\s*<span[^>]*>\s*\/100/);
    return m ? Number(m[1]) : null;
  }
  const s1 = await scoreFromPage("desange-miami");
  const s2 = await scoreFromPage("cutzone-express");
  const s3 = await scoreFromPage("rosano-ferretti-nyc");

  if (s1 !== null && s1 >= 80) pass("scoring_accuracy", 4, `strong-fit scored ${s1} (expected ≥80)`);
  else fail("scoring_accuracy", 4, `strong-fit scored ${s1} (expected ≥80)`);
  if (s2 !== null && s2 <= 40) pass("scoring_accuracy", 3, `weak-fit scored ${s2} (expected ≤40, hard-fail cap)`);
  else fail("scoring_accuracy", 3, `weak-fit scored ${s2} (expected ≤40)`);
  if (s3 !== null && s3 >= 50 && s3 <= 80) pass("scoring_accuracy", 3, `ambiguous scored ${s3} (expected 50–80)`);
  else fail("scoring_accuracy", 3, `ambiguous scored ${s3} (expected 50–80)`);

  void strong; void weak; void mid;
}

// --- 8. Visual quality — smoke tests; deep check is done via browse ----------
async function evalVisualQuality() {
  // SSR-detectable visual correctness checks
  const micro = await fetchStatus("/partner/desange-miami");
  const internal = await fetchStatus("/prospects/desange-miami");

  const checks = [
    [micro, /font-serif/, 2, "microsite uses serif typography"],
    [micro, /hairline|border-border/, 1, "microsite uses hairline dividers"],
    [micro, /bg-bone-50|bg-bone-100/, 1, "microsite uses bone palette"],
    [internal, /card-surface/, 2, "internal uses card surface utility"],
    [micro, /tracking-\[0\.\d+em\]/, 1, "editorial letter-spacing"],
    [internal, /font-mono|tabular-nums/, 1, "internal uses tabular nums for scores"],
    [micro, /premium-shadow/, 1, "premium shadow utility in use"],
    [micro, /text-balance/, 1, "text-balance for headlines"],
  ];
  for (const [r, re, pts, label] of checks) {
    if (re.test(r.body)) pass("visual_quality", pts, label);
    else fail("visual_quality", pts, label + " missing");
  }
}

// --- 9. No errors -----------------------------------------------------------
async function evalNoErrors() {
  const paths = ["/", "/prospects", "/prospects/desange-miami", "/partner/desange-miami", "/prospects/desange-miami/outreach"];
  let all200 = true;
  for (const p of paths) {
    const r = await fetchStatus(p);
    if (r.status !== 200) { all200 = false; fail("no_errors", 1, `${p} → ${r.status}`); }
  }
  if (all200) pass("no_errors", 3, "all 5 primary routes 200");

  // Check 404 handling on nonexistent slugs
  const nf = await fetchStatus("/partner/zzz-does-not-exist");
  if (nf.status === 404) pass("no_errors", 1, "404 handled for missing microsite");
  else fail("no_errors", 1, `unknown microsite returned ${nf.status}`);

  // Check basic API shape
  const v = await fetchStatus("/api/version?prospect_id=nope");
  if (v.status === 200) pass("no_errors", 1, "version API returns 200 for empty");
  else fail("no_errors", 1, `version API returned ${v.status}`);
}

// --- Run --------------------------------------------------------------------
async function main() {
  console.log(`\n═══ MaRe Match eval — target: ${TARGET} ═══\n`);
  const suites = [
    ["intake", evalIntake],
    ["internal_review", evalInternalReview],
    ["external_microsite", evalExternal],
    ["roi_calc", evalRoi],
    ["outreach_studio", evalOutreach],
    ["approval_workflow", evalApproval],
    ["scoring_accuracy", evalScoringAccuracy],
    ["visual_quality", evalVisualQuality],
    ["no_errors", evalNoErrors],
  ];
  for (const [name, fn] of suites) {
    try { await fn(); }
    catch (err) {
      fail(name, 0, `eval crashed: ${String(err).slice(0, 160)}`);
    }
  }

  let total = 0;
  let max = 0;
  for (const c of CATEGORIES) {
    const r = results.get(c.id);
    // Clamp: each category contributes at most its weight, no carry-over
    const earned = Math.min(r.earned, r.max);
    total += earned;
    max += r.max;
    const bar = "█".repeat(Math.round((earned / r.max) * 12)).padEnd(12, "░");
    console.log(`${c.id.padEnd(22)} ${bar} ${String(earned).padStart(2)}/${r.max}`);
    for (const n of r.notes) console.log(`    ${n}`);
  }
  console.log(`\n${"─".repeat(60)}`);
  console.log(`TOTAL: ${total} / ${max}  (${((total / max) * 100).toFixed(1)}%)\n`);

  if (STRICT && total / max < 0.95) process.exit(1);
}

main().catch((err) => { console.error(err); process.exit(1); });
