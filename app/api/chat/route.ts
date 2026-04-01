import { NextRequest, NextResponse } from "next/server";
import {
  detectInjection,
  sanitizeInput,
  hardenSystemPrompt,
  filterOutput,
  ALLOWED_SYSTEM_PROMPTS,
} from "@/lib/guardrails";
import { addLog } from "@/lib/request-log";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 1000;

function getRateLimitInfo(ip: string): { limited: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return { limited: false, remaining: RATE_LIMIT - 1, resetTime: now + RATE_WINDOW_MS };
  }

  entry.count++;
  return {
    limited: entry.count > RATE_LIMIT,
    remaining: Math.max(0, RATE_LIMIT - entry.count),
    resetTime: entry.resetTime,
  };
}

function rateLimitHeaders(remaining: number, resetTime: number) {
  return {
    "X-RateLimit-Limit": String(RATE_LIMIT),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.ceil(resetTime / 1000)),
  };
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const { limited, remaining, resetTime } = getRateLimitInfo(ip);

  if (limited) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: rateLimitHeaders(remaining, resetTime) }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { prompt, tool, stream: useStream } = body;

  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  if (prompt.length > 10000) {
    return NextResponse.json({ error: "Prompt too long (max 10,000 characters)" }, { status: 400 });
  }

  if (!tool || typeof tool !== "string" || !ALLOWED_SYSTEM_PROMPTS[tool]) {
    return NextResponse.json({ error: "Invalid or missing tool ID" }, { status: 400 });
  }

  const injectionCheck = detectInjection(prompt);
  if (injectionCheck.blocked) {
    addLog({
      timestamp: new Date().toISOString(),
      ip,
      tool,
      prompt: prompt.slice(0, 500),
      response: "",
      responseTimeMs: 0,
      status: "blocked",
      error: injectionCheck.reason,
    });
    return NextResponse.json({ error: injectionCheck.reason }, { status: 400 });
  }

  const cleanPrompt = sanitizeInput(prompt);
  const systemPrompt = hardenSystemPrompt(ALLOWED_SYSTEM_PROMPTS[tool]);
  const startTime = Date.now();

  // Streaming response
  if (useStream) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 300000);

      const res = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: process.env.OLLAMA_MODEL || "gemma3:4b",
          prompt: cleanPrompt,
          system: systemPrompt,
          stream: true,
          options: { temperature: 0.7, num_predict: 2048 },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok || !res.body) {
        const elapsed = Date.now() - startTime;
        addLog({
          timestamp: new Date().toISOString(), ip, tool,
          prompt: cleanPrompt.slice(0, 500), response: "",
          responseTimeMs: elapsed, status: "error",
          error: "AI service unavailable (502)",
        });
        return NextResponse.json(
          { error: "AI service is temporarily unavailable" },
          { status: 502, headers: rateLimitHeaders(remaining, resetTime) }
        );
      }

      let fullResponse = "";
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      const stream = new ReadableStream({
        async start(streamController) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split("\n").filter(Boolean);

              for (const line of lines) {
                try {
                  const json = JSON.parse(line);
                  if (json.response) {
                    fullResponse += json.response;
                    streamController.enqueue(
                      new TextEncoder().encode(`data: ${JSON.stringify({ token: json.response })}\n\n`)
                    );
                  }
                  if (json.done) {
                    const elapsed = Date.now() - startTime;
                    const safeResponse = filterOutput(fullResponse);
                    addLog({
                      timestamp: new Date().toISOString(), ip, tool,
                      prompt: cleanPrompt.slice(0, 500),
                      response: safeResponse.slice(0, 500),
                      responseTimeMs: elapsed, status: "success",
                    });
                    streamController.enqueue(
                      new TextEncoder().encode(`data: ${JSON.stringify({ done: true })}\n\n`)
                    );
                  }
                } catch {
                  // skip malformed JSON lines
                }
              }
            }
          } catch (err) {
            const elapsed = Date.now() - startTime;
            if (err instanceof DOMException && err.name === "AbortError") {
              addLog({
                timestamp: new Date().toISOString(), ip, tool,
                prompt: cleanPrompt.slice(0, 500), response: "",
                responseTimeMs: elapsed, status: "timeout", error: "Request timed out",
              });
            }
          } finally {
            streamController.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          ...rateLimitHeaders(remaining, resetTime),
        },
      });
    } catch (err) {
      const elapsed = Date.now() - startTime;
      addLog({
        timestamp: new Date().toISOString(), ip, tool,
        prompt: cleanPrompt.slice(0, 500), response: "",
        responseTimeMs: elapsed, status: "error", error: "AI service unavailable",
      });
      return NextResponse.json(
        { error: "AI service is not available. Please try again later." },
        { status: 502, headers: rateLimitHeaders(remaining, resetTime) }
      );
    }
  }

  // Non-streaming response (backward compatible)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 300000);

    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || "gemma3:4b",
        prompt: cleanPrompt,
        system: systemPrompt,
        stream: false,
        options: { temperature: 0.7, num_predict: 2048 },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const elapsed = Date.now() - startTime;

    if (!res.ok) {
      addLog({
        timestamp: new Date().toISOString(), ip, tool,
        prompt: cleanPrompt.slice(0, 500), response: "",
        responseTimeMs: elapsed, status: "error",
        error: "AI service unavailable (502)",
      });
      return NextResponse.json(
        { error: "AI service is temporarily unavailable" },
        { status: 502, headers: rateLimitHeaders(remaining, resetTime) }
      );
    }

    const data = await res.json();
    const safeResponse = filterOutput(data.response);

    addLog({
      timestamp: new Date().toISOString(), ip, tool,
      prompt: cleanPrompt.slice(0, 500),
      response: safeResponse.slice(0, 500),
      responseTimeMs: elapsed, status: "success",
    });

    return NextResponse.json(
      { response: safeResponse },
      { headers: rateLimitHeaders(remaining, resetTime) }
    );
  } catch (err) {
    const elapsed = Date.now() - startTime;
    if (err instanceof DOMException && err.name === "AbortError") {
      addLog({
        timestamp: new Date().toISOString(), ip, tool,
        prompt: cleanPrompt.slice(0, 500), response: "",
        responseTimeMs: elapsed, status: "timeout", error: "Request timed out",
      });
      return NextResponse.json(
        { error: "Request timed out. Please try a shorter prompt." },
        { status: 504, headers: rateLimitHeaders(remaining, resetTime) }
      );
    }
    addLog({
      timestamp: new Date().toISOString(), ip, tool,
      prompt: cleanPrompt.slice(0, 500), response: "",
      responseTimeMs: elapsed, status: "error", error: "AI service unavailable",
    });
    return NextResponse.json(
      { error: "AI service is not available. Please try again later." },
      { status: 502, headers: rateLimitHeaders(remaining, resetTime) }
    );
  }
}
