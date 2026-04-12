"use client";

import BlogNav from "@/components/BlogNav";
import { useMemo, useState } from "react";

const PRESETS: { name: string; pattern: string; flags: string; test: string }[] = [
  {
    name: "Email",
    pattern: "[\\w.+-]+@[\\w-]+\\.[\\w.-]+",
    flags: "g",
    test: "Contact me at alice@example.com or bob.smith+work@mail.co.uk for details.",
  },
  {
    name: "URL",
    pattern: "https?:\\/\\/[^\\s]+",
    flags: "g",
    test: "Visit https://rnrvibe.com or http://example.org/docs for more info.",
  },
  {
    name: "Hex color",
    pattern: "#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\\b",
    flags: "g",
    test: "Brand colors are #a855f7, #6366f1, and the accent is #fff.",
  },
];

interface Match {
  match: string;
  index: number;
  groups: string[];
}

export default function RegexTesterPage() {
  const [pattern, setPattern] = useState(PRESETS[0].pattern);
  const [flags, setFlags] = useState(PRESETS[0].flags);
  const [testString, setTestString] = useState(PRESETS[0].test);

  const { matches, error } = useMemo(() => {
    if (!pattern) return { matches: [] as Match[], error: "" };
    try {
      const re = new RegExp(pattern, flags.includes("g") ? flags : flags + "g");
      const result: Match[] = [];
      for (const m of testString.matchAll(re)) {
        result.push({
          match: m[0],
          index: m.index ?? 0,
          groups: m.slice(1).map((g) => g ?? ""),
        });
      }
      return { matches: result, error: "" };
    } catch (e) {
      return { matches: [] as Match[], error: e instanceof Error ? e.message : "Invalid regex" };
    }
  }, [pattern, flags, testString]);

  const highlighted = useMemo(() => {
    if (error || matches.length === 0) return [{ text: testString, hit: false }];
    const parts: { text: string; hit: boolean }[] = [];
    let cursor = 0;
    for (const m of matches) {
      if (m.index > cursor) parts.push({ text: testString.slice(cursor, m.index), hit: false });
      parts.push({ text: m.match, hit: true });
      cursor = m.index + m.match.length;
      if (m.match.length === 0) cursor++;
    }
    if (cursor < testString.length) parts.push({ text: testString.slice(cursor), hit: false });
    return parts;
  }, [testString, matches, error]);

  const loadPreset = (p: (typeof PRESETS)[number]) => {
    setPattern(p.pattern);
    setFlags(p.flags);
    setTestString(p.test);
  };

  const toggleFlag = (f: string) => {
    setFlags((cur) => (cur.includes(f) ? cur.replace(f, "") : cur + f));
  };

  const prompt = `Build a live regex tester in React with:
- Pattern input, flag toggles (g, i, m, s), and test string textarea
- Parse with new RegExp, catch errors, show a red error message when invalid
- Render the test string with every match highlighted in-place (purple background)
- List matches below with index and capture groups
- A few preset patterns (email, URL, hex color) with one-click load
- Dark UI, no external dependencies`;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <BlogNav />
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Regex Tester</h1>
        <p className="mb-8 text-neutral-400">Live pattern matching with capture groups built in ~6 minutes.</p>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 mb-8 space-y-5">
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-neutral-500 self-center mr-1">Presets:</span>
            {PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => loadPreset(p)}
                className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-neutral-300 hover:border-purple-500/50 transition"
              >
                {p.name}
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs text-neutral-500 block mb-1">Pattern</label>
            <div className="flex items-center rounded-xl border border-neutral-800 bg-neutral-950 font-mono text-sm">
              <span className="px-3 text-neutral-600">/</span>
              <input
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                className="flex-1 bg-transparent py-2.5 text-neutral-200 focus:outline-none"
                spellCheck={false}
              />
              <span className="px-2 text-neutral-600">/</span>
              <input
                value={flags}
                onChange={(e) => setFlags(e.target.value.replace(/[^gimsuy]/g, ""))}
                className="w-20 bg-transparent py-2.5 text-purple-400 focus:outline-none"
                spellCheck={false}
                placeholder="flags"
              />
            </div>
            <div className="flex gap-2 mt-2">
              {["g", "i", "m", "s"].map((f) => (
                <button
                  key={f}
                  onClick={() => toggleFlag(f)}
                  className={`rounded-md px-2.5 py-1 text-xs font-mono transition ${
                    flags.includes(f)
                      ? "bg-purple-500 text-white"
                      : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-neutral-500 block mb-1">Test string</label>
            <textarea
              value={testString}
              onChange={(e) => setTestString(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-200 font-mono focus:border-purple-500/50 focus:outline-none"
              spellCheck={false}
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          ) : (
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 text-sm font-mono whitespace-pre-wrap break-words">
              {highlighted.map((p, i) =>
                p.hit ? (
                  <span key={i} className="bg-purple-500/30 text-purple-200 rounded px-0.5">
                    {p.text}
                  </span>
                ) : (
                  <span key={i} className="text-neutral-400">{p.text}</span>
                )
              )}
            </div>
          )}

          <div>
            <div className="text-xs text-neutral-500 mb-2">
              {matches.length} match{matches.length === 1 ? "" : "es"}
            </div>
            {matches.length > 0 && (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {matches.map((m, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-lg bg-neutral-800 px-3 py-2 text-xs font-mono"
                  >
                    <span className="text-neutral-600 min-w-[2.5rem]">#{i + 1}</span>
                    <span className="text-purple-300 break-all flex-1">{m.match}</span>
                    <span className="text-neutral-500">@ {m.index}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="text-lg font-semibold text-purple-400 mb-3">Built with this prompt</h2>
          <pre className="text-sm text-neutral-300 whitespace-pre-wrap bg-neutral-950 rounded-xl p-4 border border-neutral-800">{prompt}</pre>
          <div className="flex items-center gap-4 mt-4">
            <button
              onClick={() => navigator.clipboard.writeText(prompt)}
              className="text-sm text-purple-400 hover:text-purple-300 transition"
            >
              Copy prompt
            </button>
            <a href="/tools/project-starter" className="text-sm text-neutral-500 hover:text-white transition">
              Try in Project Starter →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
