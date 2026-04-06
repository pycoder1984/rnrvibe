"use client";
import { API_BASE } from "@/lib/api-config";

import BlogNav from "@/components/BlogNav";
import { useState } from "react";

export default function TypeScriptGeneratorPage() {
  const [description, setDescription] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    if (!description.trim()) return;
    setLoading(true);
    setResult("");
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "typescript-generator",
          prompt: description,
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
        <h1 className="mb-2 text-3xl font-bold tracking-tight">TypeScript Type Generator</h1>
        <p className="mb-8 text-neutral-400">
          Describe your data shape in plain English and get TypeScript interfaces, types, and Zod schemas.
        </p>

        <div className="space-y-4">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. A user with name, email, optional avatar URL, and an array of posts each with title, content, and a published date..."
            rows={6}
            className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-sm text-neutral-200 placeholder-neutral-600 focus:border-purple-500/50 focus:outline-none resize-y"
          />

          <button
            onClick={generate}
            disabled={loading || !description.trim()}
            className="rounded-lg bg-purple-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Generating..." : "Generate Types"}
          </button>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {result && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-purple-400">Generated Types</h2>
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
