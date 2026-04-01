"use client";

import BlogNav from "@/components/BlogNav";
import { useState } from "react";

const sampleJson = `{"name":"RnR Vibe","type":"platform","features":["vibecoding","AI tools","blog","guides"],"config":{"theme":"dark","port":4000},"active":true}`;

export default function JsonFormatterPage() {
  const [input, setInput] = useState(sampleJson);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [indent, setIndent] = useState(2);

  const format = () => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, indent));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON");
      setOutput("");
    }
  };

  const minify = () => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON");
      setOutput("");
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(output || input);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Syntax highlight
  const highlight = (json: string): string => {
    return json
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"([^"]+)":/g, '<span class="text-purple-400">"$1"</span>:')
      .replace(/: "([^"]*)"/g, ': <span class="text-green-400">"$1"</span>')
      .replace(/: (\d+)/g, ': <span class="text-orange-400">$1</span>')
      .replace(/: (true|false|null)/g, ': <span class="text-cyan-400">$1</span>');
  };

  const prompt = `Build a JSON formatter in React with:
- Paste input area for raw JSON
- Format button with configurable indentation (2 or 4 spaces)
- Minify button to compress JSON
- Syntax-highlighted output with colors for keys, strings, numbers, booleans
- Validation with error messages for invalid JSON
- Copy to clipboard button
- Dark theme, no external dependencies`;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <BlogNav />
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">JSON Formatter</h1>
        <p className="mb-8 text-neutral-400">A JSON beautifier and validator built with vibecoding in ~3 minutes.</p>

        {/* Demo */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 mb-8 space-y-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your JSON here..."
            rows={6}
            className="w-full rounded-xl border border-neutral-800 bg-neutral-950 p-4 font-mono text-sm text-neutral-200 placeholder-neutral-600 focus:border-purple-500/50 focus:outline-none resize-y"
          />

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={format}
              className="rounded-lg bg-purple-500 px-5 py-2 text-sm font-medium text-white hover:bg-purple-600 transition"
            >
              Format
            </button>
            <button
              onClick={minify}
              className="rounded-lg bg-neutral-700 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-600 transition"
            >
              Minify
            </button>
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <span>Indent:</span>
              {[2, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => setIndent(n)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                    indent === n ? "bg-purple-500/20 text-purple-400" : "bg-neutral-800 text-neutral-500 hover:text-white"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            {output && (
              <button
                onClick={copy}
                className="ml-auto rounded-lg bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-700 transition"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {output && (
            <pre
              className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 font-mono text-sm overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: highlight(output) }}
            />
          )}
        </div>

        {/* Prompt */}
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
