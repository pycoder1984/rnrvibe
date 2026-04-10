import { NextRequest, NextResponse } from "next/server";
import {
  detectInjection,
  sanitizeInput,
  hardenSystemPrompt,
  filterOutput,
  ALLOWED_SYSTEM_PROMPTS,
} from "@/lib/guardrails";
import { addLog } from "@/lib/request-log";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";
import { streamGenerate, generate } from "@/lib/llm-provider";

const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 1000;

function rateLimitHeaders(remaining: number, resetTime: number) {
  return {
    "X-RateLimit-Limit": String(RATE_LIMIT),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.ceil(resetTime / 1000)),
  };
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { limited, remaining, resetTime } = checkRateLimit("chat", ip, RATE_LIMIT, RATE_WINDOW_MS);

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

      const { provider, body } = await streamGenerate({
        prompt: cleanPrompt,
        system: systemPrompt,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      let fullResponse = "";
      const reader = body.getReader();
      const decoder = new TextDecoder();

      // OpenRouter uses SSE format: "data: {json}\n\n"
      // Ollama uses NDJSON: "{json}\n"
      let sseBuffer = "";

      const stream = new ReadableStream({
        async start(streamController) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value, { stream: true });

              if (provider === "openrouter") {
                sseBuffer += chunk;
                const sseLines = sseBuffer.split("\n");
                sseBuffer = sseLines.pop() || "";

                for (const line of sseLines) {
                  const trimmed = line.trim();
                  if (!trimmed || !trimmed.startsWith("data: ")) continue;
                  const payload = trimmed.slice(6);
                  if (payload === "[DONE]") {
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
                    continue;
                  }
                  try {
                    const json = JSON.parse(payload);
                    const token = json.choices?.[0]?.delta?.content;
                    if (token) {
                      fullResponse += token;
                      streamController.enqueue(
                        new TextEncoder().encode(`data: ${JSON.stringify({ token })}\n\n`)
                      );
                    }
                  } catch {
                    // skip malformed SSE lines
                  }
                }
              } else {
                // Ollama NDJSON format
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

    const { text } = await generate({
      prompt: cleanPrompt,
      system: systemPrompt,
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const elapsed = Date.now() - startTime;
    const safeResponse = filterOutput(text);

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
