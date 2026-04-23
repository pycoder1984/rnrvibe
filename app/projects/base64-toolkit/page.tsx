"use client";

import BlogNav from "@/components/BlogNav";
import { useEffect, useMemo, useState } from "react";

type TabId = "base64" | "url" | "hash";

const TABS: { id: TabId; label: string; hint: string }[] = [
  { id: "base64", label: "Base64", hint: "Encode and decode base64 strings" },
  { id: "url", label: "URL Encode", hint: "Percent-encode/decode URLs" },
  { id: "hash", label: "SHA-256", hint: "Cryptographic hash via Web Crypto" },
];

function encodeBase64(input: string): { ok: boolean; value: string } {
  try {
    const bytes = new TextEncoder().encode(input);
    let bin = "";
    for (const b of bytes) bin += String.fromCharCode(b);
    return { ok: true, value: btoa(bin) };
  } catch (err) {
    return { ok: false, value: err instanceof Error ? err.message : "Encoding failed" };
  }
}

function decodeBase64(input: string): { ok: boolean; value: string } {
  try {
    const bin = atob(input.trim());
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return { ok: true, value: new TextDecoder().decode(bytes) };
  } catch {
    return { ok: false, value: "Invalid base64 input" };
  }
}

function encodeUrl(input: string): { ok: boolean; value: string } {
  try {
    return { ok: true, value: encodeURIComponent(input) };
  } catch (err) {
    return { ok: false, value: err instanceof Error ? err.message : "Encoding failed" };
  }
}

function decodeUrl(input: string): { ok: boolean; value: string } {
  try {
    return { ok: true, value: decodeURIComponent(input) };
  } catch {
    return { ok: false, value: "Invalid percent-encoded input" };
  }
}

async function sha256(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      disabled={!text}
      onClick={async () => {
        if (!text) return;
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="text-xs px-3 py-1 rounded-lg border border-neutral-700 bg-neutral-950 hover:border-purple-500 hover:text-purple-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export default function Base64ToolkitPage() {
  const [tab, setTab] = useState<TabId>("base64");
  const [input, setInput] = useState("");
  // Track which input the current hashValue corresponds to so we never display a
  // stale hash when the input changes faster than SHA-256 resolves.
  const [hashState, setHashState] = useState<{ input: string; hash: string } | null>(null);

  const switchTab = (next: TabId) => {
    if (next === tab) return;
    setTab(next);
    setInput("");
  };

  // Base64 / URL are cheap and pure — derive on every render.
  const { encoded, decoded, encodedErr, decodedErr } = useMemo(() => {
    if (tab === "hash") {
      return { encoded: "", decoded: "", encodedErr: false, decodedErr: false };
    }
    const enc = tab === "base64" ? encodeBase64(input) : encodeUrl(input);
    const hasContent = tab === "base64" ? input.trim().length > 0 : input.length > 0;
    const dec = hasContent ? (tab === "base64" ? decodeBase64(input) : decodeUrl(input)) : { ok: true, value: "" };
    return {
      encoded: enc.value,
      decoded: dec.value,
      encodedErr: !enc.ok,
      decodedErr: !dec.ok,
    };
  }, [tab, input]);

  // SHA-256 is async — sync the Web Crypto result into state only from the async callback.
  useEffect(() => {
    if (tab !== "hash" || !input) return;
    let cancelled = false;
    sha256(input).then((h) => {
      if (!cancelled) setHashState({ input, hash: h });
    });
    return () => {
      cancelled = true;
    };
  }, [tab, input]);

  const hashValue = hashState && hashState.input === input ? hashState.hash : "";

  const currentHint = TABS.find((t) => t.id === tab)?.hint || "";

  const prompt = `Build a Base64 & Hash Toolkit in React with:
- Three tabs: Base64, URL Encode, SHA-256
- Single input textarea that feeds the active tab
- Base64 tab: live encoded + decoded panels using TextEncoder/btoa and atob/TextDecoder for unicode safety
- URL tab: live encodeURIComponent + decodeURIComponent panels
- SHA-256 tab: hash the input with crypto.subtle.digest and display lowercase hex
- Copy-to-clipboard button on each output with a brief "Copied!" confirmation
- Graceful error handling — invalid base64 or malformed percent-encoding shows an error, not a crash
- Dark theme with purple accents`;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <BlogNav />
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Base64 &amp; Hash Toolkit</h1>
        <p className="mb-8 text-neutral-400">
          Developer utility with live encoding, decoding, and cryptographic hashing. Built with vibecoding in ~8 minutes.
        </p>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => switchTab(t.id)}
              className={`px-4 py-2 rounded-xl border text-sm font-medium transition ${
                tab === t.id
                  ? "border-purple-500 bg-purple-500/20 text-purple-200"
                  : "border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <p className="text-xs text-neutral-500 mb-3">{currentHint}</p>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={5}
            placeholder={
              tab === "hash"
                ? "Enter text to hash with SHA-256..."
                : tab === "url"
                ? "Enter text or a URL component..."
                : "Enter text to encode, or a base64 string to decode..."
            }
            className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-purple-500 resize-y placeholder-neutral-600"
          />

          {tab === "hash" ? (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-neutral-500">SHA-256 (hex)</label>
                <CopyButton text={hashValue} />
              </div>
              <div className="w-full min-h-[48px] bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-sm font-mono text-purple-300 break-all">
                {hashValue || <span className="text-neutral-600">—</span>}
              </div>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-neutral-500">Encoded</label>
                  <CopyButton text={encodedErr ? "" : encoded} />
                </div>
                <div
                  className={`w-full min-h-[96px] bg-neutral-950 border rounded-lg px-3 py-2 text-sm font-mono break-all whitespace-pre-wrap ${
                    encodedErr ? "border-red-500/60 text-red-300" : "border-neutral-700 text-purple-300"
                  }`}
                >
                  {encoded || <span className="text-neutral-600">—</span>}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-neutral-500">Decoded</label>
                  <CopyButton text={decodedErr ? "" : decoded} />
                </div>
                <div
                  className={`w-full min-h-[96px] bg-neutral-950 border rounded-lg px-3 py-2 text-sm font-mono break-all whitespace-pre-wrap ${
                    decodedErr ? "border-red-500/60 text-red-300" : "border-neutral-700 text-purple-300"
                  }`}
                >
                  {decoded || <span className="text-neutral-600">—</span>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Prompt */}
        <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="text-lg font-semibold text-purple-400 mb-3">Built with this prompt</h2>
          <pre className="text-sm text-neutral-300 whitespace-pre-wrap bg-neutral-950 rounded-xl p-4 border border-neutral-800">
            {prompt}
          </pre>
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
