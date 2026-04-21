import { NextRequest, NextResponse } from "next/server";
import { detectInjection, sanitizeInput, filterOutput } from "@/lib/guardrails";
import { addLog } from "@/lib/request-log";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";
import { planQueries } from "@/lib/research/planner";
import { searchEngine } from "@/lib/research/search";
import { dedupe } from "@/lib/research/dedup";
import { fetchReadable } from "@/lib/research/fetcher";
import { streamSynthesis } from "@/lib/research/synthesize";
import type { FetchedSource, ResearchEvent, SearchEngine, Source } from "@/lib/research/types";

const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const OVERALL_TIMEOUT_MS = 90_000;
const MAX_SOURCES_TO_READ = 8;

const encoder = new TextEncoder();
const sseLine = (ev: ResearchEvent) => encoder.encode(`data: ${JSON.stringify(ev)}\n\n`);

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { limited, remaining, resetTime } = checkRateLimit("deep-research", ip, RATE_LIMIT, RATE_WINDOW_MS);

  if (limited) {
    return NextResponse.json(
      { error: "Too many research requests. Try again in an hour." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(RATE_LIMIT),
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset": String(Math.ceil(resetTime / 1000)),
        },
      }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { question } = body as { question?: unknown };
  if (typeof question !== "string" || !question.trim()) {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }
  if (question.length > 500) {
    return NextResponse.json({ error: "Question too long (max 500 characters)" }, { status: 400 });
  }

  const injection = detectInjection(question);
  if (injection.blocked) {
    addLog({
      timestamp: new Date().toISOString(), ip, tool: "deep-research",
      prompt: question.slice(0, 500), response: "",
      responseTimeMs: 0, status: "blocked", error: injection.reason,
    });
    return NextResponse.json({ error: injection.reason }, { status: 400 });
  }

  const cleanQuestion = sanitizeInput(question);
  const startTime = Date.now();
  const overallController = new AbortController();
  const timeoutHandle = setTimeout(() => overallController.abort(), OVERALL_TIMEOUT_MS);

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (ev: ResearchEvent) => {
        try { controller.enqueue(sseLine(ev)); } catch { /* client gone */ }
      };

      let finalProvider: "ollama" | "openrouter" = "ollama";
      let finalSources: Source[] = [];
      let finalText = "";

      try {
        // 1. Plan
        emit({ type: "phase", phase: "planning" });
        const queries = await planQueries(cleanQuestion, overallController.signal);
        emit({ type: "plan", queries });

        // 2. Search across engines in parallel
        emit({ type: "phase", phase: "searching" });
        const engines: SearchEngine[] = ["duckduckgo", "wikipedia", "arxiv"];
        const searchTasks = queries.flatMap((q) =>
          engines.map(async (eng) => {
            const hits = await searchEngine(eng, q);
            emit({ type: "search_result", query: q, count: hits.length, engine: eng });
            return hits;
          })
        );
        const hitGroups = await Promise.all(searchTasks);
        const allHits = hitGroups.flat();
        const deduped = dedupe(allHits, MAX_SOURCES_TO_READ);

        if (deduped.length === 0) {
          emit({ type: "error", message: "No search results found. Try rephrasing the question." });
          controller.close();
          return;
        }

        // 3. Fetch + parse in parallel
        emit({ type: "phase", phase: "reading" });
        const fetched: FetchedSource[] = [];
        let n = 1;
        const fetchTasks = deduped.map(async (hit) => {
          const parsed = await fetchReadable(hit.url);
          if (!parsed || !parsed.text || parsed.text.length < 100) {
            emit({ type: "source_fetched", url: hit.url, title: hit.title, ok: false });
            return null;
          }
          emit({
            type: "source_fetched",
            url: hit.url,
            title: parsed.title,
            ok: true,
            bytes: parsed.text.length,
          });
          return { hit, parsed };
        });
        const fetchResults = await Promise.all(fetchTasks);

        for (const r of fetchResults) {
          if (!r) continue;
          let domain = "";
          try { domain = new URL(r.hit.url).hostname.replace(/^www\./, ""); } catch { /* ignore */ }
          fetched.push({
            n,
            title: r.parsed.title,
            url: r.hit.url,
            domain,
            text: r.parsed.text,
          });
          n++;
        }

        if (fetched.length === 0) {
          emit({ type: "error", message: "Could not read any sources. Try a different question." });
          controller.close();
          return;
        }

        // 4. Synthesize with streaming tokens
        emit({ type: "phase", phase: "synthesizing" });
        const result = await streamSynthesis(cleanQuestion, fetched, emit, overallController.signal);
        finalProvider = result.provider;
        finalText = filterOutput(result.text);
        finalSources = fetched.map(({ n, title, url, domain }) => ({ n, title, url, domain }));

        emit({ type: "done", sources: finalSources, provider: finalProvider });
      } catch (err) {
        const message =
          err instanceof DOMException && err.name === "AbortError"
            ? "Research timed out. Try a narrower question."
            : "Research failed. Please try again.";
        emit({ type: "error", message });
      } finally {
        clearTimeout(timeoutHandle);
        const elapsed = Date.now() - startTime;
        addLog({
          timestamp: new Date().toISOString(), ip, tool: "deep-research",
          prompt: cleanQuestion.slice(0, 500),
          response: finalText.slice(0, 500) || `[${finalSources.length} sources]`,
          responseTimeMs: elapsed,
          status: finalText ? "success" : "error",
        });
        try { controller.close(); } catch { /* already closed */ }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-RateLimit-Limit": String(RATE_LIMIT),
      "X-RateLimit-Remaining": String(remaining),
      "X-RateLimit-Reset": String(Math.ceil(resetTime / 1000)),
    },
  });
}
