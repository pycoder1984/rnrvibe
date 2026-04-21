import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

const USER_AGENT = "RnRVibe-DeepResearch/1.0 (+https://rnrvibe.com)";
const FETCH_TIMEOUT_MS = 6000;
const MAX_BODY_BYTES = 1_000_000;

function isPrivateHost(host: string): boolean {
  const h = host.toLowerCase();
  if (h === "localhost" || h === "127.0.0.1" || h === "::1") return true;
  // IPv4 private ranges
  const m = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (m) {
    const a = Number(m[1]), b = Number(m[2]);
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
    if (a === 0) return true;
  }
  // IPv6 link-local / unique-local
  if (h.startsWith("fe80:") || h.startsWith("fc") || h.startsWith("fd")) return true;
  return false;
}

function safeUrl(raw: string): URL | null {
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (isPrivateHost(u.hostname)) return null;
    return u;
  } catch {
    return null;
  }
}

export async function fetchReadable(
  rawUrl: string
): Promise<{ title: string; text: string } | null> {
  const u = safeUrl(rawUrl);
  if (!u) return null;

  let res: Response;
  try {
    res = await fetch(u.toString(), {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: "follow",
    });
  } catch {
    return null;
  }

  if (!res.ok) return null;
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("html") && !contentType.includes("xml")) return null;

  // Guard body size
  const reader = res.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        try { await reader.cancel(); } catch { /* ignore */ }
        break;
      }
      chunks.push(value);
    }
  } catch {
    return null;
  }

  const html = new TextDecoder().decode(Buffer.concat(chunks.map((c) => Buffer.from(c))));

  try {
    const dom = new JSDOM(html, { url: u.toString() });
    const article = new Readability(dom.window.document).parse();
    if (!article || !article.textContent) {
      // Fallback to body text
      const body = dom.window.document.body?.textContent || "";
      if (!body.trim()) return null;
      return {
        title: dom.window.document.title || u.hostname,
        text: body.replace(/\s+/g, " ").trim().slice(0, 4000),
      };
    }
    return {
      title: article.title || dom.window.document.title || u.hostname,
      text: article.textContent.replace(/\s+/g, " ").trim().slice(0, 4000),
    };
  } catch {
    return null;
  }
}
