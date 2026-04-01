"use client";

import BlogNav from "@/components/BlogNav";
import { useState } from "react";

export default function BugFixerPage() {
  const [code, setCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fix = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setResult("");
    setError("");

    try {
      const prompt = errorMsg.trim()
        ? `Fix this code:\n\n\`\`\`\n${code}\n\`\`\`\n\nError message:\n\`\`\`\n${errorMsg}\n\`\`\``
        : `Fix this code (find and fix any bugs):\n\n\`\`\`\n${code}\n\`\`\``;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: "bug-fixer", prompt, stream: true }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          try {
            const json = JSON.parse(line.slice(6));
            if (json.token) {
              full += json.token;
              setResult(full);
            }
          } catch { /* skip */ }
        }
      }
    } catch {
      setError("Failed to connect. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <BlogNav />
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Bug Fixer</h1>
        <p className="mb-8 text-neutral-400">
          Paste your broken code and the error message — get an instant fix with explanation.
        </p>

        <div className="space-y-4">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste your broken code here..."
            rows={12}
            className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-4 font-mono text-sm text-neutral-200 placeholder-neutral-600 focus:border-purple-500/50 focus:outline-none resize-y"
          />

          <textarea
            value={errorMsg}
            onChange={(e) => setErrorMsg(e.target.value)}
            placeholder="Paste the error message here (optional — we'll analyze the code for bugs if omitted)..."
            rows={3}
            className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-4 font-mono text-sm text-red-300 placeholder-neutral-600 focus:border-purple-500/50 focus:outline-none resize-y"
          />

          <button
            onClick={fix}
            disabled={loading || !code.trim()}
            className="rounded-lg bg-purple-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Fixing..." : "Fix My Code"}
          </button>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {result && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
              <h2 className="mb-4 text-lg font-semibold text-purple-400">Fix Found</h2>
              <div className="prose text-sm whitespace-pre-wrap">{result}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
