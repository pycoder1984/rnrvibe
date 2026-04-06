"use client";
import { API_BASE } from "@/lib/api-config";

import BlogNav from "@/components/BlogNav";
import { useState } from "react";

export default function TestGeneratorPage() {
  const [code, setCode] = useState("");
  const [framework, setFramework] = useState("jest");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setResult("");
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "test-generator",
          prompt: `Framework: ${framework}\n\nCode to test:\n\`\`\`\n${code}\n\`\`\``,
          stream: true,
        }),
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
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Test Generator</h1>
        <p className="mb-8 text-neutral-400">
          Paste any function or component and get comprehensive unit tests with your preferred framework.
        </p>

        <div className="space-y-4">
          <div className="flex gap-2">
            {["jest", "vitest", "pytest", "mocha"].map((fw) => (
              <button
                key={fw}
                onClick={() => setFramework(fw)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition ${
                  framework === fw
                    ? "border-purple-500 bg-purple-500/20 text-purple-300"
                    : "border-neutral-700 text-neutral-400 hover:border-neutral-600"
                }`}
              >
                {fw.charAt(0).toUpperCase() + fw.slice(1)}
              </button>
            ))}
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste your function or component code here..."
            rows={14}
            className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-4 font-mono text-sm text-neutral-200 placeholder-neutral-600 focus:border-purple-500/50 focus:outline-none resize-y"
          />

          <button
            onClick={generate}
            disabled={loading || !code.trim()}
            className="rounded-lg bg-purple-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Generating Tests..." : "Generate Tests"}
          </button>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {result && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-purple-400">Generated Tests</h2>
                <button
                  onClick={() => navigator.clipboard.writeText(result)}
                  className="text-xs text-neutral-400 hover:text-white transition px-3 py-1 rounded-lg border border-neutral-700 hover:border-neutral-600"
                >
                  Copy
                </button>
              </div>
              <div className="prose text-sm whitespace-pre-wrap font-mono">{result}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
