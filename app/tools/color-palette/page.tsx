"use client";
import { getApiBase } from "@/lib/api-config";

import BlogNav from "@/components/BlogNav";
import { useState } from "react";

export default function ColorPalettePage() {
  const [mood, setMood] = useState("");
  const [result, setResult] = useState("");
  const [colors, setColors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<number | null>(null);

  const generate = async () => {
    if (!mood.trim()) return;
    setLoading(true);
    setResult("");
    setColors([]);
    setError("");

    try {
      const res = await fetch(`${getApiBase()}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "color-palette",
          prompt: `Create a color palette for: ${mood}`,
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
              setResult(full.replace(/^COLORS:.*\n?/, ""));

              // Extract colors as they stream in
              const colorsMatch = full.match(/COLORS:\s*(#[0-9a-fA-F]{3,8}(?:\s*,\s*#[0-9a-fA-F]{3,8})*)/);
              if (colorsMatch) {
                const extracted = colorsMatch[1].split(",").map((c: string) => c.trim());
                setColors(extracted);
              }
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

  const copyColor = (color: string, index: number) => {
    navigator.clipboard.writeText(color);
    setCopied(index);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <BlogNav />
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Color Palette Generator</h1>
        <p className="mb-8 text-neutral-400">
          Describe a mood, brand, or vibe and get a ready-to-use color palette with CSS and Tailwind config.
        </p>

        <div className="space-y-4">
          <div className="flex gap-3">
            <input
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generate()}
              placeholder='e.g. "dark cyberpunk tech startup" or "warm cozy coffee shop"'
              className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-200 placeholder-neutral-600 focus:border-purple-500/50 focus:outline-none"
            />
            <button
              onClick={generate}
              disabled={loading || !mood.trim()}
              className="rounded-xl bg-purple-500 px-6 py-3 text-sm font-medium text-white transition hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {loading ? "Generating..." : "Generate"}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {["dark tech startup", "ocean calm spa", "retro 80s neon", "minimal luxury brand", "playful kids app", "forest nature blog"].map((example) => (
              <button
                key={example}
                onClick={() => setMood(example)}
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

          {colors.length > 0 && (
            <div className="flex gap-2 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              {colors.map((color, i) => (
                <button
                  key={i}
                  onClick={() => copyColor(color, i)}
                  className="group flex-1 flex flex-col items-center gap-2"
                  title={`Click to copy ${color}`}
                >
                  <div
                    className="w-full aspect-square rounded-xl border-2 border-transparent group-hover:border-white/30 transition-all duration-300 group-hover:scale-105"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs font-mono text-neutral-400 group-hover:text-white transition">
                    {copied === i ? "Copied!" : color}
                  </span>
                </button>
              ))}
            </div>
          )}

          {result && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
              <h2 className="mb-4 text-lg font-semibold text-purple-400">Palette Details</h2>
              <div className="prose text-sm whitespace-pre-wrap">{result}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
