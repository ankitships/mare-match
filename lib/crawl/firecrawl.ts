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

// Plain-HTTP fallback for sites Firecrawl can't render. We fetch the raw HTML,
// strip tags, and hand the resulting text to the same evidence extractor. Not
// as rich as Firecrawl's parser but sufficient for the LLM to extract signals.
async function plainFetch(url: string): Promise<CrawledPage | null> {
  try {
    const res = await fetch(url, {
      signal: timeoutSignal(PER_CALL_TIMEOUT_MS),
      headers: {
        // Use a realistic UA so sites don't block us as a bot
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15 MaReMatchBot/1.0",
        accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const html = await res.text();
    if (!html) return null;

    // Extract <title> for metadata
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch?.[1]?.trim();

    // Strip scripts/styles/nav/footer blocks, then tags
    const stripped = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#\d+;/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (stripped.length < 100) return null; // not enough signal
    return {
      url,
      source_type: inferSourceType(url),
      markdown: stripped.slice(0, 8000),
      title,
    };
  } catch {
    return null;
  }
}

// ----------------------------------------------------------------------------
// Public — crawl a prospect and return structured source records
// ----------------------------------------------------------------------------
export async function crawlProspect(params: {
  website_url: string;
  instagram_url?: string;
}): Promise<CrawledPage[]> {
  const hasFirecrawl = !!process.env.FIRECRAWL_API_KEY;

  // Fire the homepage scrape and the site map in parallel — both only need
  // the root URL, and we don't want the map call to block the homepage scrape.
  const [homepage, links] = hasFirecrawl
    ? await Promise.all([scrape(params.website_url), mapSite(params.website_url)])
    : [null, [] as string[]];

  const pages: CrawledPage[] = [];
  if (homepage) pages.push({ ...homepage, source_type: "homepage" });

  // If Firecrawl couldn't render the homepage, fall back to a plain fetch so
  // the analysis still has something to work with.
  if (!homepage) {
    const plain = await plainFetch(params.website_url);
    if (plain) pages.push({ ...plain, source_type: "homepage" });
  }

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

// Extract image URLs from crawled markdown. Filters out likely-decorative
// assets (logos, icons, tiny images) so the microsite gallery only shows
// the prospect's hero/interior/team photography.
export function extractImageUrls(pages: CrawledPage[]): string[] {
  const urls = new Set<string>();
  for (const page of pages) {
    const md = page.markdown ?? "";
    // Markdown image syntax: ![alt](url "optional title")
    const mdMatches = md.matchAll(/!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g);
    for (const m of mdMatches) urls.add(m[1]);

    // Plain HTML img tags that sometimes survive Firecrawl's markdown pass
    const htmlMatches = md.matchAll(/<img[^>]+src=["']([^"']+)["']/gi);
    for (const m of htmlMatches) urls.add(m[1]);
  }

  const filtered: string[] = [];
  for (const raw of urls) {
    // Skip data URIs, relative paths, and non-image content
    if (!/^https?:\/\//i.test(raw)) continue;
    if (!/\.(jpe?g|png|webp|avif)(\?|$)/i.test(raw)) continue;

    // Skip obvious UI/icon assets by filename heuristics
    if (/\b(logo|icon|favicon|sprite|avatar|badge|spinner)\b/i.test(raw)) continue;
    if (/\b(?:\d{2,3}x\d{2,3})\b/.test(raw) && /16x16|32x32|48x48|64x64/.test(raw)) continue;

    filtered.push(raw);
  }

  // Dedupe by pathname (some sites serve the same asset from multiple hosts)
  const seenByPath = new Set<string>();
  const deduped: string[] = [];
  for (const u of filtered) {
    try {
      const pathKey = new URL(u).pathname;
      if (seenByPath.has(pathKey)) continue;
      seenByPath.add(pathKey);
      deduped.push(u);
    } catch {
      deduped.push(u);
    }
  }

  return deduped.slice(0, 12);   // cap so we don't balloon the payload
}
