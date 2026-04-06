"use client";
import { API_BASE } from "@/lib/api-config";

import BlogNav from "@/components/BlogNav";
import { useState } from "react";

export default function RegexGeneratorPage() {
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
          tool: "regex-generator",
          prompt: `Generate a regex for: ${description}`,
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
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Regex Generator</h1>
        <p className="mb-8 text-neutral-400">
          Describe what you want to match in plain English and get the regex pattern with examples.
        </p>

        <div className="space-y-4">
          <div className="flex gap-3">
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generate()}
              placeholder='e.g. "an email address" or "a phone number with dashes"'
              className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-200 placeholder-neutral-600 focus:border-purple-500/50 focus:outline-none"
            />
            <button
              onClick={generate}
              disabled={loading || !description.trim()}
              className="rounded-xl bg-purple-500 px-6 py-3 text-sm font-medium text-white transition hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {loading ? "Generating..." : "Generate"}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {["email address", "URL", "phone number", "hex color code", "IP address", "date (MM/DD/YYYY)"].map((example) => (
              <button
                key={example}
                onClick={() => { setDescription(example); }}
                className="rounded-full bg-neutral-800 px-3 py-1 text-xs text-neutral-400 transition hover:bg-neutral-700 hover:text-white"
              >
                {example}
              </button>
            ))}
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {result && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
              <h2 className="mb-4 text-lg font-semibold text-purple-400">Result</h2>
              <div className="prose text-sm whitespace-pre-wrap">{result}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
