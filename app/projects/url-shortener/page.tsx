"use client";

import BlogNav from "@/components/BlogNav";
import { useState } from "react";
import { useLocalStorageState } from "@/lib/use-local-storage";

interface ShortenedUrl {
  id: string;
  alias: string;
  target: string;
  clicks: number;
  created: string;
}

const STORAGE_KEY = "rnrvibe-urls";

const EMPTY_URLS: ShortenedUrl[] = [];
const initialUrls = () => EMPTY_URLS;

function generateId(): string {
  return Math.random().toString(36).slice(2, 8);
}

export default function UrlShortenerPage() {
  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [urls, setUrls] = useLocalStorageState<ShortenedUrl[]>(STORAGE_KEY, initialUrls);
  const [copied, setCopied] = useState<string | null>(null);

  const shorten = () => {
    if (!url.trim()) return;
    const entry: ShortenedUrl = {
      id: generateId(),
      alias: alias.trim() || generateId(),
      target: url.startsWith("http") ? url : `https://${url}`,
      clicks: 0,
      created: new Date().toISOString(),
    };
    setUrls((prev) => [entry, ...prev]);
    setUrl("");
    setAlias("");
  };

  const remove = (id: string) => {
    setUrls((prev) => prev.filter((u) => u.id !== id));
  };

  const copyLink = (entry: ShortenedUrl) => {
    const link = `${window.location.origin}/s/${entry.alias}`;
    navigator.clipboard.writeText(link);
    setCopied(entry.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const visit = (entry: ShortenedUrl) => {
    setUrls((prev) => prev.map((u) => (u.id === entry.id ? { ...u, clicks: u.clicks + 1 } : u)));
    window.open(entry.target, "_blank");
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <BlogNav />
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">URL Shortener</h1>
        <p className="mb-8 text-neutral-400">
          Shorten URLs with custom aliases, track click counts, and manage links — all stored locally.
        </p>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 mb-8">
          <div className="space-y-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/very-long-url-here"
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 p-3 text-sm text-neutral-200 placeholder-neutral-500 focus:border-purple-500/50 focus:outline-none"
            />
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value.replace(/[^a-zA-Z0-9-]/g, ""))}
              placeholder="Custom alias (optional)"
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 p-3 text-sm text-neutral-200 placeholder-neutral-500 focus:border-purple-500/50 focus:outline-none"
            />
            <button
              onClick={shorten}
              disabled={!url.trim()}
              className="w-full rounded-lg bg-purple-500 py-2.5 text-sm font-medium text-white transition hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Shorten URL
            </button>
          </div>
        </div>

        {urls.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-neutral-400">Your Links ({urls.length})</h2>
            {urls.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-purple-400 truncate">/{entry.alias}</div>
                    <button
                      onClick={() => visit(entry)}
                      className="text-xs text-neutral-500 truncate block hover:text-neutral-300 transition"
                    >
                      {entry.target}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-neutral-500">{entry.clicks} clicks</span>
                    <button
                      onClick={() => copyLink(entry)}
                      className={`text-xs px-2 py-1 rounded border transition ${
                        copied === entry.id
                          ? "border-green-500 text-green-400"
                          : "border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-600"
                      }`}
                    >
                      {copied === entry.id ? "Copied!" : "Copy"}
                    </button>
                    <button
                      onClick={() => remove(entry.id)}
                      className="text-xs px-2 py-1 rounded border border-neutral-700 text-neutral-400 hover:text-red-400 hover:border-red-500/30 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
