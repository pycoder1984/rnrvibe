"use client";
import { getApiBase } from "@/lib/api-config";
import BlogNav from "@/components/BlogNav";
import { useMemo, useRef, useState } from "react";

type Phase = "idle" | "planning" | "searching" | "reading" | "synthesizing" | "done" | "error";

interface SourceUi {
  n: number;
  title: string;
  url: string;
  domain: string;
}

interface SourceLogRow {
  url: string;
  title: string;
  ok: boolean;
  bytes?: number;
}

const PHASE_LABEL: Record<Phase, string> = {
  idle: "",
  planning: "Planning search queries…",
  searching: "Searching the web…",
  reading: "Reading sources…",
  synthesizing: "Writing answer…",
  done: "Done",
  error: "Error",
};

export default function DeepResearchPage() {
  const [question, setQuestion] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [plan, setPlan] = useState<string[]>([]);
  const [sourceLog, setSourceLog] = useState<SourceLogRow[]>([]);
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<SourceUi[]>([]);
  const [error, setError] = useState("");
  const [provider, setProvider] = useState<string>("");
  const abortRef = useRef<AbortController | null>(null);

  const renderedAnswer = useMemo(() => {
    if (!answer) return "";
    return answer.replace(
      /\[(\d+)\]/g,
      (_m, n) => `<a href="#src-${n}" class="text-purple-400 hover:text-purple-300 font-medium no-underline">[${n}]</a>`
    );
  }, [answer]);

  const running = phase !== "idle" && phase !== "done" && phase !== "error";

  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
  };

  const reset = () => {
    setPhase("idle");
    setPlan([]);
    setSourceLog([]);
    setAnswer("");
    setSources([]);
    setError("");
    setProvider("");
  };

  const research = async () => {
    if (!question.trim() || running) return;
    reset();
    setPhase("planning");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${getApiBase()}/api/deep-research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Request failed" }));
        setError(data.error || "Request failed");
        setPhase("error");
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) { setPhase("error"); setError("No stream"); return; }
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          try {
            const ev = JSON.parse(trimmed.slice(6));
            handleEvent(ev);
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setPhase("idle");
      } else {
        setError("Failed to connect. Is the server running?");
        setPhase("error");
      }
    } finally {
      abortRef.current = null;
    }
  };

  const handleEvent = (ev: { type: string } & Record<string, unknown>) => {
    switch (ev.type) {
      case "phase":
        setPhase(ev.phase as Phase);
        break;
      case "plan":
        setPlan((ev.queries as string[]) || []);
        break;
      case "source_fetched":
        setSourceLog((prev) => [
          ...prev,
          {
            url: ev.url as string,
            title: ev.title as string,
            ok: ev.ok as boolean,
            bytes: ev.bytes as number | undefined,
          },
        ]);
        break;
      case "token":
        setAnswer((prev) => prev + (ev.text as string));
        break;
      case "done":
        setSources((ev.sources as SourceUi[]) || []);
        setProvider((ev.provider as string) || "");
        setPhase("done");
        break;
      case "error":
        setError((ev.message as string) || "Unknown error");
        setPhase("error");
        break;
    }
  };

  const copyMarkdown = async () => {
    const md = [
      `# ${question}`,
      "",
      answer,
      "",
      "## Sources",
      ...sources.map((s) => `${s.n}. [${s.title}](${s.url}) — ${s.domain}`),
    ].join("\n");
    try { await navigator.clipboard.writeText(md); } catch { /* ignore */ }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <BlogNav />
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Deep Research</h1>
        <p className="mb-8 text-neutral-400">
          Ask a research question and get a cited, multi-source synthesis. Searches DuckDuckGo, Wikipedia, and arXiv — no API keys needed.
        </p>

        <div className="space-y-4">
          <div className="flex gap-3">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && research()}
              placeholder='e.g. "What is retrieval-augmented generation?"'
              disabled={running}
              maxLength={500}
              className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-200 placeholder-neutral-600 focus:border-purple-500/50 focus:outline-none disabled:opacity-60"
            />
            {running ? (
              <button
                onClick={stop}
                className="rounded-xl bg-neutral-800 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-700 whitespace-nowrap"
              >
                Stop
              </button>
            ) : (
              <button
                onClick={research}
                disabled={!question.trim()}
                className="rounded-xl bg-purple-500 px-6 py-3 text-sm font-medium text-white transition hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                Research
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              "What is retrieval-augmented generation?",
              "How do transformer attention heads work?",
              "Best practices for prompt engineering in 2026",
              "What is vibecoding?",
            ].map((ex) => (
              <button
                key={ex}
                onClick={() => setQuestion(ex)}
                disabled={running}
                className="rounded-full bg-neutral-800 px-3 py-1 text-xs text-neutral-400 transition hover:bg-neutral-700 hover:text-white disabled:opacity-50"
              >
                {ex}
              </button>
            ))}
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {(running || plan.length > 0 || sourceLog.length > 0) && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
              <div className="mb-3 flex items-center gap-2 text-sm">
                {running && (
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-purple-500" />
                )}
                <span className="font-medium text-neutral-200">{PHASE_LABEL[phase]}</span>
              </div>

              {plan.length > 0 && (
                <div className="mb-4">
                  <div className="mb-2 text-xs uppercase tracking-wide text-neutral-500">Search plan</div>
                  <ul className="space-y-1 text-sm text-neutral-300">
                    {plan.map((q, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-neutral-500">→</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {sourceLog.length > 0 && (
                <div>
                  <div className="mb-2 text-xs uppercase tracking-wide text-neutral-500">
                    Sources read ({sourceLog.filter((s) => s.ok).length}/{sourceLog.length})
                  </div>
                  <ul className="space-y-1 text-xs text-neutral-400">
                    {sourceLog.map((s, i) => (
                      <li key={i} className="flex items-center gap-2 truncate">
                        <span className={s.ok ? "text-green-400" : "text-red-400"}>
                          {s.ok ? "✓" : "✗"}
                        </span>
                        <span className="truncate">{s.title || s.url}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {answer && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-purple-400">Answer</h2>
                {phase === "done" && (
                  <button
                    onClick={copyMarkdown}
                    className="rounded-lg bg-neutral-800 px-3 py-1 text-xs text-neutral-300 hover:bg-neutral-700 hover:text-white"
                  >
                    Copy as Markdown
                  </button>
                )}
              </div>
              <div
                className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-200"
                dangerouslySetInnerHTML={{ __html: renderedAnswer }}
              />
              {provider && phase === "done" && (
                <div className="mt-4 text-xs text-neutral-500">Answered by {provider}</div>
              )}
            </div>
          )}

          {sources.length > 0 && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
              <h2 className="mb-4 text-lg font-semibold text-purple-400">Sources</h2>
              <ol className="space-y-3 text-sm">
                {sources.map((s) => (
                  <li key={s.n} id={`src-${s.n}`} className="flex gap-3">
                    <span className="shrink-0 text-neutral-500">[{s.n}]</span>
                    <div className="min-w-0">
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block truncate text-neutral-200 hover:text-purple-300"
                      >
                        {s.title}
                      </a>
                      <div className="text-xs text-neutral-500">{s.domain}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
