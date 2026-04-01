"use client";

import BlogNav from "@/components/BlogNav";
import { useState } from "react";

export default function ReadmeGeneratorPage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResult("");
    setError("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "readme-generator",
          prompt: `Generate a README for this project:\n\n${input}`,
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

  const copyResult = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <BlogNav />
      <div className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">README Generator</h1>
        <p className="mb-8 text-neutral-400">
          Describe your project or paste your file structure, and get a professional README.md ready for GitHub.
        </p>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-400">Project Info</span>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={"Describe your project, paste code, or paste your file structure...\n\nExamples:\n- \"A Next.js blog with MDX, Tailwind, deployed on Vercel\"\n- Paste your package.json\n- Paste a file tree like:\n  src/\n    components/\n    pages/\n    utils/"}
              rows={18}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-sm text-neutral-200 placeholder-neutral-600 focus:border-purple-500/50 focus:outline-none resize-y"
            />
            <button
              onClick={generate}
              disabled={loading || !input.trim()}
              className="mt-4 rounded-lg bg-purple-500 px-8 py-3 text-sm font-medium text-white transition hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Generating..." : "Generate README"}
            </button>
          </div>

          {/* Output */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-400">README.md</span>
              {result && (
                <button
                  onClick={copyResult}
                  className="text-xs text-neutral-500 hover:text-purple-400 transition"
                >
                  {copied ? "Copied!" : "Copy Markdown"}
                </button>
              )}
            </div>
            <div className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-4 font-mono text-sm text-neutral-200 min-h-[432px] max-h-[700px] overflow-y-auto whitespace-pre-wrap">
              {loading ? (
                <span className="text-neutral-500">Generating your README...</span>
              ) : error ? (
                <span className="text-red-400">{error}</span>
              ) : result ? (
                result
              ) : (
                <span className="text-neutral-600">Your README.md will appear here...</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
