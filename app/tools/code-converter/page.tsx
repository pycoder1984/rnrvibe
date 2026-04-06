"use client";
import { API_BASE } from "@/lib/api-config";

import BlogNav from "@/components/BlogNav";
import { useState } from "react";

const languages = [
  "JavaScript", "TypeScript", "Python", "Go", "Rust", "Java",
  "C#", "PHP", "Ruby", "Swift", "Kotlin", "C++",
];

export default function CodeConverterPage() {
  const [code, setCode] = useState("");
  const [fromLang, setFromLang] = useState("JavaScript");
  const [toLang, setToLang] = useState("Python");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const convert = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setResult("");
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "code-converter",
          prompt: `Convert this ${fromLang} code to ${toLang}:\n\n\`\`\`${fromLang.toLowerCase()}\n${code}\n\`\`\``,
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
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Code Converter</h1>
        <p className="mb-8 text-neutral-400">
          Paste code in one language, get it translated to another with idiomatic patterns.
        </p>

        {/* Language selectors */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <label className="text-sm text-neutral-400">From:</label>
            <select
              value={fromLang}
              onChange={(e) => setFromLang(e.target.value)}
              className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-200 focus:border-purple-500/50 focus:outline-none"
            >
              {languages.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => { const tmp = fromLang; setFromLang(toLang); setToLang(tmp); }}
            className="p-2 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition"
            title="Swap languages"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 7h12M12 3l4 4-4 4M16 13H4M8 9l-4 4 4 4" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <label className="text-sm text-neutral-400">To:</label>
            <select
              value={toLang}
              onChange={(e) => setToLang(e.target.value)}
              className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-200 focus:border-purple-500/50 focus:outline-none"
            >
              {languages.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-400">{fromLang}</span>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={`Paste your ${fromLang} code here...`}
              rows={16}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-4 font-mono text-sm text-neutral-200 placeholder-neutral-600 focus:border-purple-500/50 focus:outline-none resize-y"
            />
          </div>

          {/* Output */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-400">{toLang}</span>
              {result && (
                <button
                  onClick={copyResult}
                  className="text-xs text-neutral-500 hover:text-purple-400 transition"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              )}
            </div>
            <div className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-4 font-mono text-sm text-neutral-200 min-h-[384px] max-h-[600px] overflow-y-auto whitespace-pre-wrap">
              {loading ? (
                <span className="text-neutral-500">Converting...</span>
              ) : error ? (
                <span className="text-red-400">{error}</span>
              ) : result ? (
                result
              ) : (
                <span className="text-neutral-600">Converted code will appear here...</span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={convert}
          disabled={loading || !code.trim()}
          className="mt-6 rounded-lg bg-purple-500 px-8 py-3 text-sm font-medium text-white transition hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Converting..." : `Convert to ${toLang}`}
        </button>
      </div>
    </div>
  );
}
