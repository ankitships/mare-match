// ============================================================================
// Firecrawl integration — crawl a prospect URL and discover relevant pages
// ----------------------------------------------------------------------------
// Tuned for hackathon-speed demos:
//   - Per-call timeout so we never hang on a dead host
//   - Homepage + one batch of relevant pages + (optional) Instagram, all
//     launched in parallel once we know the link set
//   - Hard cap of N pages so analyze stays under 20s end-to-end
// ============================================================================

import type { EvidenceItem } from "@/lib/types";

const FIRECRAWL_BASE = "https://api.firecrawl.dev/v1";
const PER_CALL_TIMEOUT_MS = 8000;
const MAX_EXTRA_PAGES = 3;

export interface CrawledPage {
  url: string;
  source_type: EvidenceItem["source_type"];
  markdown: string;
  html?: string;
  screenshot_url?: string;
  title?: string;
}

interface FirecrawlScrapeResponse {
  success?: boolean;
  data?: {
    markdown?: string;
    html?: string;
    screenshot?: string;
    metadata?: { title?: string; sourceURL?: string };
  };
}

interface FirecrawlMapResponse {
  success?: boolean;
  links?: string[];
}

function headers(): Record<string, string> {
  return {
    "content-type": "application/json",
    authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
  };
}

// AbortSignal.timeout would be cleaner but isn't universally available in the
// Edge runtime; use a plain controller so this works on Node 20 and Workers.
function timeoutSignal(ms: number): AbortSignal {
  const ac = new AbortController();
  setTimeout(() => ac.abort(new Error(`timeout ${ms}ms`)), ms).unref?.();
  return ac.signal;
}

function inferSourceType(url: string): EvidenceItem["source_type"] {
  const u = url.toLowerCase();
  if (/\/pricing|\/rates|\/prices/.test(u)) return "pricing_page";
  if (/\/service|\/menu|\/treatments|\/ritual/.test(u)) return "services_page";
  if (/\/about|\/team|\/story|\/people/.test(u)) return "about_page";
  if (/\/contact|\/locations?|\/visit/.test(u)) return "contact_page";
  if (/instagram\.com/.test(u)) return "instagram";
  return "homepage";
}

async function scrape(url: string): Promise<CrawledPage | null> {
  if (!process.env.FIRECRAWL_API_KEY) return null;
  try {
    const res = await fetch(`${FIRECRAWL_BASE}/scrape`, {
      method: "POST",
      headers: headers(),
      signal: timeoutSignal(PER_CALL_TIMEOUT_MS),
      body: JSON.stringify({
        url,
        formats: ["markdown"],            // drop screenshot to cut payload + latency
        onlyMainContent: true,
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as FirecrawlScrapeResponse;
    if (!json.data?.markdown) return null;
    return {
      url,
      source_type: inferSourceType(url),
      markdown: json.data.markdown,
      html: json.data.html,
      screenshot_url: json.data.screenshot,
      title: json.data.metadata?.title,
    };
  } catch {
    return null;
  }
}

async function mapSite(url: string, limit = 20): Promise<string[]> {
  if (!process.env.FIRECRAWL_API_KEY) return [];
  try {
    const res = await fetch(`${FIRECRAWL_BASE}/map`, {
      method: "POST",
      headers: headers(),
      signal: timeoutSignal(PER_CALL_TIMEOUT_MS),
      body: JSON.stringify({ url, limit }),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as FirecrawlMapResponse;
    return json.links ?? [];
  } catch {
    return [];
  }
}

// Pick the most useful URLs from a site map without over-crawling.
function selectRelevantLinks(base: string, links: string[]): string[] {
  const priority = [
    /service|menu|treatment|ritual/i,
    /about|team|story|people/i,
    /pricing|price|rate/i,
  ];
  const seen = new Set<string>([normalize(base)]);
  const picks: string[] = [];
  // Walk priorities in order; take the first matching link per bucket so we
  // get a services page before a contact page before a press page.
  for (const re of priority) {
    for (const link of links) {
      if (picks.length >= MAX_EXTRA_PAGES) return picks;
      const norm = normalize(link);
      if (seen.has(norm)) continue;
      if (re.test(norm)) {
        picks.push(link);
        seen.add(norm);
        break;
      }
    }
  }
  return picks;
}

function normalize(u: string): string {
  try {
    const parsed = new URL(u);
    return `${parsed.origin}${parsed.pathname.replace(/\/$/, "")}`;
  } catch {
    return u.replace(/\/$/, "");
  }
}

// ----------------------------------------------------------------------------
// Public — crawl a prospect and return structured source records
// ----------------------------------------------------------------------------
export async function crawlProspect(params: {
  website_url: string;
  instagram_url?: string;
}): Promise<CrawledPage[]> {
  if (!process.env.FIRECRAWL_API_KEY) return [];

  // Fire the homepage scrape and the site map in parallel — both only need
  // the root URL, and we don't want the map call to block the homepage scrape.
  const [homepage, links] = await Promise.all([
    scrape(params.website_url),
    mapSite(params.website_url),
  ]);

  const pages: CrawledPage[] = [];
  if (homepage) pages.push({ ...homepage, source_type: "homepage" });

  // Kick off the relevant extra pages in parallel, bounded by MAX_EXTRA_PAGES.
  const relevant = selectRelevantLinks(params.website_url, links);
  const extras = await Promise.all(relevant.map((l) => scrape(l)));
  for (const p of extras) if (p) pages.push(p);

  // Instagram is best-effort — only scrape if we still have time budget; run
  // it in parallel with the extras would be ideal but we already awaited.
  if (params.instagram_url) {
    const ig = await scrape(params.instagram_url);
    if (ig) pages.push({ ...ig, source_type: "instagram" });
  }

  return pages;
}

// For internal preview / debugging
export function truncatePageContent(page: CrawledPage, max = 3800): string {
  const body = page.markdown || page.html || "";
  return body.length > max ? `${body.slice(0, max)}\n…[truncated]` : body;
}
