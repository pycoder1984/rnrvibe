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
export const FREE_MODELS = [
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "google/gemma-4-26b-a4b-it:free",
  "qwen/qwen3-coder:free",
  "google/gemma-3-12b-it:free",
  "nvidia/nemotron-nano-9b-v2:free",
  "google/gemma-3n-e4b-it:free",
  "minimax/minimax-m2.5:free",
];

export const DEFAULT_OLLAMA_MODEL = OLLAMA_MODEL;

function getModelsToTry(requested?: string): string[] {
  if (requested) return [requested];
  if (OPENROUTER_MODEL_OVERRIDE) return [OPENROUTER_MODEL_OVERRIDE];
  return FREE_MODELS;
}

export async function listOllamaModels(): Promise<string[]> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const models = Array.isArray(data?.models) ? data.models : [];
    return models.map((m: { name?: string }) => m.name).filter((n: unknown): n is string => typeof n === "string");
  } catch {
    return [];
  }
}

export function isOpenRouterConfigured(): boolean {
  return Boolean(OPENROUTER_API_KEY);
}

let ollamaAvailable: boolean | null = null;
let lastOllamaCheck = 0;
const OLLAMA_CHECK_INTERVAL_MS = 30_000; // re-check every 30s

async function isOllamaUp(force = false): Promise<boolean> {
  const now = Date.now();
  if (!force && ollamaAvailable !== null && now - lastOllamaCheck < OLLAMA_CHECK_INTERVAL_MS) {
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

function markOllamaDown() {
  ollamaAvailable = false;
  lastOllamaCheck = Date.now();
}

export type LLMProvider = "ollama" | "openrouter";

export async function getActiveProvider(requested?: LLMProvider): Promise<LLMProvider> {
  if (requested === "ollama") {
    if (await isOllamaUp()) return "ollama";
    throw new Error("Ollama was requested but is not reachable");
  }
  if (requested === "openrouter") {
    if (OPENROUTER_API_KEY) return "openrouter";
    throw new Error("OpenRouter was requested but OPENROUTER_API_KEY is not set");
  }
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

async function streamOllama(opts: {
  prompt: string;
  system: string;
  signal?: AbortSignal;
  model?: string;
}): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: opts.model || OLLAMA_MODEL,
      prompt: opts.prompt,
      system: opts.system,
      stream: true,
      options: { temperature: 0.7, num_predict: 2048 },
    }),
    signal: opts.signal,
  });

  if (!res.ok || !res.body) throw new Error(`Ollama request failed (${res.status})`);
  return res.body;
}

async function streamOpenRouter(opts: {
  prompt: string;
  system: string;
  signal?: AbortSignal;
  model?: string;
}): Promise<ReadableStream<Uint8Array>> {
  const models = getModelsToTry(opts.model);
  let lastError = "";

  for (const model of models) {
    try {
      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: openRouterHeaders(),
        body: openRouterBody(model, opts.system, opts.prompt, true),
        signal: opts.signal,
      });

      if (res.ok && res.body) return res.body;

      lastError = await res.text().catch(() => `status ${res.status}`);
    } catch (err) {
      lastError = err instanceof Error ? err.message : "unknown error";
    }
  }

  throw new Error(`All OpenRouter models failed. Last error: ${lastError}`);
}

export async function streamGenerate(opts: {
  prompt: string;
  system: string;
  signal?: AbortSignal;
  provider?: LLMProvider;
  model?: string;
}): Promise<{ provider: LLMProvider; body: ReadableStream<Uint8Array> }> {
  const provider = await getActiveProvider(opts.provider);

  if (provider === "ollama") {
    try {
      const body = await streamOllama(opts);
      return { provider: "ollama", body };
    } catch (err) {
      // If Ollama fails mid-request, silently fall through to OpenRouter when
      // the caller didn't pin a provider. Invalidate the health cache so future
      // requests skip Ollama until it recovers.
      if (opts.provider === "ollama" || !OPENROUTER_API_KEY) throw err;
      markOllamaDown();
      const body = await streamOpenRouter({ ...opts, model: undefined });
      return { provider: "openrouter", body };
    }
  }

  const body = await streamOpenRouter(opts);
  return { provider: "openrouter", body };
}

// ---------------------------------------------------------------------------
// Non-streaming request
// ---------------------------------------------------------------------------

async function generateOllama(opts: {
  prompt: string;
  system: string;
  signal?: AbortSignal;
  model?: string;
}): Promise<string> {
  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: opts.model || OLLAMA_MODEL,
      prompt: opts.prompt,
      system: opts.system,
      stream: false,
      options: { temperature: 0.7, num_predict: 2048 },
    }),
    signal: opts.signal,
  });

  if (!res.ok) throw new Error(`Ollama request failed (${res.status})`);
  const data = await res.json();
  return data.response;
}

async function generateOpenRouter(opts: {
  prompt: string;
  system: string;
  signal?: AbortSignal;
  model?: string;
}): Promise<string> {
  const models = getModelsToTry(opts.model);
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
      return data.choices?.[0]?.message?.content || "";
    } catch (err) {
      lastError = err instanceof Error ? err.message : "unknown error";
    }
  }

  throw new Error(`All OpenRouter models failed. Last error: ${lastError}`);
}

export async function generate(opts: {
  prompt: string;
  system: string;
  signal?: AbortSignal;
  provider?: LLMProvider;
  model?: string;
}): Promise<{ provider: LLMProvider; text: string }> {
  const provider = await getActiveProvider(opts.provider);

  if (provider === "ollama") {
    try {
      const text = await generateOllama(opts);
      return { provider: "ollama", text };
    } catch (err) {
      if (opts.provider === "ollama" || !OPENROUTER_API_KEY) throw err;
      markOllamaDown();
      const text = await generateOpenRouter({ ...opts, model: undefined });
      return { provider: "openrouter", text };
    }
  }

  const text = await generateOpenRouter(opts);
  return { provider: "openrouter", text };
}
