/**
 * LLM Provider abstraction — tries Ollama first, falls back to OpenRouter.
 *
 * When the laptop is on  → Ollama responds to the health check → use Ollama
 * When the laptop is off → Ollama is unreachable → use OpenRouter (free tier)
 */

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma3:4b";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-nano-30b-a3b:free";

let ollamaAvailable: boolean | null = null;
let lastOllamaCheck = 0;
const OLLAMA_CHECK_INTERVAL_MS = 30_000; // re-check every 30s

async function isOllamaUp(): Promise<boolean> {
  const now = Date.now();
  if (ollamaAvailable !== null && now - lastOllamaCheck < OLLAMA_CHECK_INTERVAL_MS) {
    return ollamaAvailable;
  }

  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    ollamaAvailable = res.ok;
  } catch {
    ollamaAvailable = false;
  }
  lastOllamaCheck = now;
  return ollamaAvailable;
}

export type LLMProvider = "ollama" | "openrouter";

export async function getActiveProvider(): Promise<LLMProvider> {
  if (await isOllamaUp()) return "ollama";
  if (OPENROUTER_API_KEY) return "openrouter";
  throw new Error("No LLM provider available — Ollama is down and OPENROUTER_API_KEY is not set");
}

// ---------------------------------------------------------------------------
// Streaming request
// ---------------------------------------------------------------------------

export async function streamGenerate(opts: {
  prompt: string;
  system: string;
  signal?: AbortSignal;
}): Promise<{ provider: LLMProvider; body: ReadableStream<Uint8Array> }> {
  const provider = await getActiveProvider();

  if (provider === "ollama") {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: opts.prompt,
        system: opts.system,
        stream: true,
        options: { temperature: 0.7, num_predict: 2048 },
      }),
      signal: opts.signal,
    });

    if (!res.ok || !res.body) throw new Error("Ollama request failed");
    return { provider, body: res.body };
  }

  // OpenRouter (OpenAI-compatible)
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://rnrvibe.com",
      "X-Title": "RnR Vibe AI Tools",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.prompt },
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 2048,
    }),
    signal: opts.signal,
  });

  if (!res.ok || !res.body) {
    const errText = await res.text().catch(() => "unknown error");
    throw new Error(`OpenRouter request failed (${res.status}): ${errText}`);
  }
  return { provider, body: res.body };
}

// ---------------------------------------------------------------------------
// Non-streaming request
// ---------------------------------------------------------------------------

export async function generate(opts: {
  prompt: string;
  system: string;
  signal?: AbortSignal;
}): Promise<{ provider: LLMProvider; text: string }> {
  const provider = await getActiveProvider();

  if (provider === "ollama") {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: opts.prompt,
        system: opts.system,
        stream: false,
        options: { temperature: 0.7, num_predict: 2048 },
      }),
      signal: opts.signal,
    });

    if (!res.ok) throw new Error("Ollama request failed");
    const data = await res.json();
    return { provider, text: data.response };
  }

  // OpenRouter (OpenAI-compatible)
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://rnrvibe.com",
      "X-Title": "RnR Vibe AI Tools",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.prompt },
      ],
      stream: false,
      temperature: 0.7,
      max_tokens: 2048,
    }),
    signal: opts.signal,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "unknown error");
    throw new Error(`OpenRouter request failed (${res.status}): ${errText}`);
  }
  const data = await res.json();
  return { provider, text: data.choices?.[0]?.message?.content || "" };
}
