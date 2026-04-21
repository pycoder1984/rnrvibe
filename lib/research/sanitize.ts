/**
 * Strip prompt-injection attempts from content scraped from the open web
 * before handing it to the synthesizer LLM. This is the #1 attack surface
 * for any research agent.
 */

const INSTRUCTION_RED_FLAGS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions|prompts|rules)/gi,
  /disregard\s+(all\s+)?(previous|prior|above|your)\s+(instructions|prompts|rules)/gi,
  /forget\s+(all\s+)?(previous|prior|above|your)\s+(instructions|prompts|rules|context)/gi,
  /override\s+(your|the|system)\s+(instructions|prompt|rules)/gi,
  /you\s+are\s+now\s+(a|an|the)\s+/gi,
  /from\s+now\s+on[,\s]+(you|act|behave|respond)/gi,
  /\bnew\s+instructions?\s*:/gi,
  /^\s*system\s*:/gim,
  /^\s*assistant\s*:/gim,
  /<\s*\/?\s*system\s*>/gi,
  /<\s*\/?\s*instructions?\s*>/gi,
  /<\s*\/?\s*source[^>]*>/gi, // Don't let a page close our own source tag
  /pretend\s+(you\s+are|to\s+be|you're)\s+/gi,
  /reveal\s+(your|the)\s+(system\s+)?(prompt|instructions)/gi,
  /bypass\s+(your|the|all)\s+(filters?|restrictions?|safety|guardrails?)/gi,
  /\bjailbreak\b/gi,
  /developer\s+mode\s+(enabled|on|activated)/gi,
];

export function sanitizeWebContent(text: string): string {
  let out = text;

  // Strip control chars / zero-width / direction overrides
  out = out.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ");
  out = out.replace(/[\u200B-\u200D\u2066-\u2069\u202A-\u202E\uFEFF]/g, "");

  // Redact injection patterns (don't remove — redact so the LLM sees something was stripped)
  for (const re of INSTRUCTION_RED_FLAGS) {
    out = out.replace(re, "[redacted]");
  }

  // Collapse whitespace
  out = out.replace(/\s+/g, " ").trim();

  return out;
}

export function buildSourceBlock(n: number, title: string, url: string, text: string): string {
  // Escape delimiters so a page can't close the block from inside
  const safeTitle = title.replace(/["<>]/g, "").slice(0, 200);
  const safeText = sanitizeWebContent(text);
  return `<source id="${n}" url="${url}" title="${safeTitle}">\n${safeText}\n</source>`;
}
