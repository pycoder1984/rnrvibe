/**
 * LLM Provider abstraction — tries Ollama first, falls back to OpenRouter.
 *
 * When the laptop is on  → Ollama responds to the health check → use Ollama
 * When the laptop is off → Ollama is unreachable → use OpenRouter (free tier)
 *
 * OpenRouter free models come and go. If OPENROUTER_MODEL env var is set, only
 * that model is used. Otherwise, the code tries a list of free models in order
 * until one succeeds.
 */

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma3:4b";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";

// Env var override = single model, no fallback list
const OPENROUTER_MODEL_OVERRIDE = process.env.OPENROUTER_MODEL || "";

// Free-tier models to try in order. Update this list when models rotate.
const FREE_MODELS = [
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "google/gemma-4-26b-a4b-it:free",
  "qwen/qwen3-coder:free",
  "google/gemma-3-12b-it:free",
  "nvidia/nemotron-nano-9b-v2:free",
  "google/gemma-3n-e4b-it:free",
  "minimax/minimax-m2.5:free",
];

function getModelsToTry(): string[] {
  if (OPENROUTER_MODEL_OVERRIDE) return [OPENROUTER_MODEL_OVERRIDE];
  return FREE_MODELS;
}

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
// OpenRouter helpers — try models in order until one works
// ---------------------------------------------------------------------------

function openRouterHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    "HTTP-Referer": "https://rnrvibe.com",
    "X-Title": "RnR Vibe AI Tools",
  };
}

function openRouterBody(model: string, system: string, prompt: string, stream: boolean) {
  return JSON.stringify({
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt },
    ],
    stream,
    temperature: 0.7,
    max_tokens: 2048,
  });
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

  // OpenRouter — try models in order
  const models = getModelsToTry();
  let lastError = "";

  for (const model of models) {
    try {
      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: openRouterHeaders(),
        body: openRouterBody(model, opts.system, opts.prompt, true),
        signal: opts.signal,
      });

      if (res.ok && res.body) {
        return { provider, body: res.body };
      }

      lastError = await res.text().catch(() => `status ${res.status}`);
    } catch (err) {
      lastError = err instanceof Error ? err.message : "unknown error";
    }
  }

  throw new Error(`All OpenRouter models failed. Last error: ${lastError}`);
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

  // OpenRouter — try models in order
  const models = getModelsToTry();
  let lastError = "";

  for (const model of models) {
    try {
      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: openRouterHeaders(),
        body: openRouterBody(model, opts.system, opts.prompt, false),
        signal: opts.signal,
      });

      if (!res.ok) {
        lastError = await res.text().catch(() => `status ${res.status}`);
        continue;
      }

      const data = await res.json();
      return { provider, text: data.choices?.[0]?.message?.content || "" };
    } catch (err) {
      lastError = err instanceof Error ? err.message : "unknown error";
    }
  }

  throw new Error(`All OpenRouter models failed. Last error: ${lastError}`);
}
