import type { SearchHit } from "./types";

function canonicalize(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    // Strip tracking params
    const strip = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid", "ref", "ref_src"];
    for (const k of strip) u.searchParams.delete(k);
    u.hostname = u.hostname.toLowerCase();
    let s = u.toString();
    if (s.endsWith("/") && u.pathname !== "/") s = s.slice(0, -1);
    return s;
  } catch {
    return url;
  }
}

function tokenize(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length >= 3)
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const t of a) if (b.has(t)) intersection++;
  return intersection / (a.size + b.size - intersection);
}

export function dedupe(hits: SearchHit[], maxResults: number): SearchHit[] {
  const seenUrls = new Set<string>();
  const kept: { hit: SearchHit; tokens: Set<string> }[] = [];

  for (const hit of hits) {
    const canonical = canonicalize(hit.url);
    if (seenUrls.has(canonical)) continue;
    seenUrls.add(canonical);

    const tokens = tokenize(hit.title);
    let isDup = false;
    for (const prev of kept) {
      if (jaccard(tokens, prev.tokens) > 0.85) {
        isDup = true;
        // Keep the shorter URL
        if (hit.url.length < prev.hit.url.length) {
          prev.hit = { ...hit, url: canonical };
          prev.tokens = tokens;
        }
        break;
      }
    }
    if (!isDup) kept.push({ hit: { ...hit, url: canonical }, tokens });
    if (kept.length >= maxResults) break;
  }

  return kept.map((k) => k.hit);
}
