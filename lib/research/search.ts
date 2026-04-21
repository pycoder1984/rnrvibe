import { JSDOM } from "jsdom";
import type { SearchHit, SearchEngine } from "./types";

const USER_AGENT = "RnRVibe-DeepResearch/1.0 (+https://rnrvibe.com)";
const SEARCH_TIMEOUT_MS = 8000;

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  return fetch(url, {
    ...init,
    headers: { "User-Agent": USER_AGENT, ...(init?.headers || {}) },
    signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
  });
}

async function searchDuckDuckGo(query: string): Promise<SearchHit[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) return [];

  const html = await res.text();
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const hits: SearchHit[] = [];

  const results = doc.querySelectorAll("div.result, div.web-result");
  results.forEach((el) => {
    const a = el.querySelector("a.result__a") as HTMLAnchorElement | null;
    const snippetEl = el.querySelector(".result__snippet");
    if (!a) return;

    let href = a.getAttribute("href") || "";
    // DDG wraps links in a redirect — extract the real URL from uddg param
    if (href.includes("uddg=")) {
      const m = href.match(/uddg=([^&]+)/);
      if (m) {
        try { href = decodeURIComponent(m[1]); } catch { /* ignore */ }
      }
    }
    if (!/^https?:\/\//i.test(href)) return;

    hits.push({
      title: a.textContent?.trim() || href,
      url: href,
      snippet: snippetEl?.textContent?.trim() || "",
      engine: "duckduckgo",
      query,
    });
  });

  return hits.slice(0, 8);
}

async function searchWikipedia(query: string): Promise<SearchHit[]> {
  const url = `https://en.wikipedia.org/w/api.php?action=opensearch&limit=5&format=json&search=${encodeURIComponent(query)}`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) return [];

  const data = await res.json();
  if (!Array.isArray(data) || data.length < 4) return [];

  const [, titles, snippets, urls] = data as [string, string[], string[], string[]];
  const hits: SearchHit[] = [];
  for (let i = 0; i < titles.length; i++) {
    if (!urls[i]) continue;
    hits.push({
      title: titles[i],
      url: urls[i],
      snippet: snippets[i] || "",
      engine: "wikipedia",
      query,
    });
  }
  return hits;
}

async function searchArxiv(query: string): Promise<SearchHit[]> {
  const url = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&max_results=3&sortBy=relevance`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) return [];

  const xml = await res.text();
  const dom = new JSDOM(xml, { contentType: "text/xml" });
  const doc = dom.window.document;
  const entries = doc.querySelectorAll("entry");
  const hits: SearchHit[] = [];

  entries.forEach((entry) => {
    const title = entry.querySelector("title")?.textContent?.replace(/\s+/g, " ").trim() || "";
    const summary = entry.querySelector("summary")?.textContent?.replace(/\s+/g, " ").trim() || "";
    const link = entry.querySelector('link[rel="alternate"], link:not([rel])') as Element | null;
    const href = link?.getAttribute("href") || entry.querySelector("id")?.textContent?.trim() || "";
    if (!href || !/^https?:\/\//i.test(href)) return;

    hits.push({
      title,
      url: href,
      snippet: summary.slice(0, 300),
      engine: "arxiv",
      query,
    });
  });

  return hits;
}

const ENGINES: Record<SearchEngine, (q: string) => Promise<SearchHit[]>> = {
  duckduckgo: searchDuckDuckGo,
  wikipedia: searchWikipedia,
  arxiv: searchArxiv,
};

export async function searchEngine(
  engine: SearchEngine,
  query: string
): Promise<SearchHit[]> {
  try {
    return await ENGINES[engine](query);
  } catch {
    return [];
  }
}
