"use client";

import BlogNav from "@/components/BlogNav";
import { useState } from "react";

function hexToRgb(hex: string): [number, number, number] | null {
  const match = hex.replace("#", "").match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!match) return null;
  return [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)];
}

function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hex1: string, hex2: string): number | null {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return null;
  const l1 = luminance(...rgb1);
  const l2 = luminance(...rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function PassFail({ pass }: { pass: boolean }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${pass ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
      {pass ? "PASS" : "FAIL"}
    </span>
  );
}

export default function ContrastCheckerPage() {
  const [fg, setFg] = useState("#ffffff");
  const [bg, setBg] = useState("#1a1a1a");

  const ratio = contrastRatio(fg, bg);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <BlogNav />
      <div className="mx-auto max-w-lg px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Color Contrast Checker</h1>
        <p className="mb-8 text-neutral-400">
          Check WCAG contrast ratios between foreground and background colors.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div>
            <label className="block text-sm text-neutral-400 mb-2">Foreground</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={fg}
                onChange={(e) => setFg(e.target.value)}
                className="w-10 h-10 rounded-lg border border-neutral-700 cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={fg}
                onChange={(e) => setFg(e.target.value)}
                className="flex-1 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm font-mono text-neutral-200 focus:border-purple-500/50 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-neutral-400 mb-2">Background</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={bg}
                onChange={(e) => setBg(e.target.value)}
                className="w-10 h-10 rounded-lg border border-neutral-700 cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={bg}
                onChange={(e) => setBg(e.target.value)}
                className="flex-1 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm font-mono text-neutral-200 focus:border-purple-500/50 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <button
          onClick={() => { setFg(bg); setBg(fg); }}
          className="mb-8 text-xs text-neutral-400 hover:text-white transition border border-neutral-700 rounded-lg px-3 py-1.5 hover:border-neutral-600"
        >
          Swap Colors
        </button>

        {/* Preview */}
        <div
          className="rounded-xl p-8 mb-8 text-center"
          style={{ backgroundColor: bg, color: fg }}
        >
          <div className="text-2xl font-bold mb-2">Sample Text</div>
          <div className="text-sm">The quick brown fox jumps over the lazy dog.</div>
          <div className="text-xs mt-2 opacity-80">Small text preview (14px)</div>
        </div>

        {ratio !== null && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <div className="text-center mb-6">
              <div className="text-4xl font-bold">{ratio.toFixed(2)}</div>
              <div className="text-sm text-neutral-400 mt-1">Contrast Ratio</div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/50">
                <span className="text-sm">AA Normal Text (4.5:1)</span>
                <PassFail pass={ratio >= 4.5} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/50">
                <span className="text-sm">AA Large Text (3:1)</span>
                <PassFail pass={ratio >= 3} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/50">
                <span className="text-sm">AAA Normal Text (7:1)</span>
                <PassFail pass={ratio >= 7} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/50">
                <span className="text-sm">AAA Large Text (4.5:1)</span>
                <PassFail pass={ratio >= 4.5} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
