// ============================================================================
// Firecrawl integration — crawl a prospect URL and discover relevant pages
// ----------------------------------------------------------------------------
// We don't depend on a Firecrawl SDK — plain fetch against the v1 API. If
// FIRECRAWL_API_KEY is unset we gracefully degrade to a local "noop crawler"
// that returns the URL and any internal notes as a single source, so the
// pipeline keeps running for demos.
// ============================================================================

import type { EvidenceItem } from "@/lib/types";

const FIRECRAWL_BASE = "https://api.firecrawl.dev/v1";

export interface CrawledPage {
  url: string;
  source_type: EvidenceItem["source_type"];
  markdown: string;           // primary extraction
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

const HEADERS = (): Record<string, string> => ({
  "content-type": "application/json",
  authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
});

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
      headers: HEADERS(),
      body: JSON.stringify({
        url,
        formats: ["markdown", "screenshot@fullPage"],
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
      headers: HEADERS(),
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
  const wanted = ["service", "menu", "treatment", "ritual", "about", "team", "pricing", "price", "rate", "contact", "location"];
  const seen = new Set<string>([normalize(base)]);
  const picks: string[] = [];
  for (const link of links) {
    const norm = normalize(link);
    if (seen.has(norm)) continue;
    if (wanted.some((w) => norm.toLowerCase().includes(w))) {
      picks.push(link);
      seen.add(norm);
    }
    if (picks.length >= 5) break;
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
  const pages: CrawledPage[] = [];

  const homepage = await scrape(params.website_url);
  if (homepage) pages.push({ ...homepage, source_type: "homepage" });

  if (process.env.FIRECRAWL_API_KEY) {
    const links = await mapSite(params.website_url);
    const relevant = selectRelevantLinks(params.website_url, links);
    const scraped = await Promise.all(relevant.map((l) => scrape(l)));
    for (const p of scraped) if (p) pages.push(p);
  }

  // Instagram — Firecrawl can return the profile's visible HTML/markdown. For
  // many public profiles this is enough to flag aesthetic cues. Fails gracefully.
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
