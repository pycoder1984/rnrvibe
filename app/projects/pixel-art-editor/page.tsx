"use client";

import BlogNav from "@/components/BlogNav";
import { useCallback, useMemo, useRef, useState } from "react";

type Tool = "draw" | "erase" | "fill";

const EMPTY = ""; // empty string represents a transparent / unpainted cell

const SIZES = [16, 24, 32] as const;
const PALETTE = [
  "#000000",
  "#ffffff",
  "#7f8c8d",
  "#e74c3c",
  "#e67e22",
  "#f1c40f",
  "#2ecc71",
  "#1abc9c",
  "#3498db",
  "#9b59b6",
  "#fd79a8",
  "#8b4513",
];

function makeEmptyGrid(size: number): string[] {
  return Array(size * size).fill(EMPTY);
}

function cloneGrid(g: string[]): string[] {
  return g.slice();
}

function floodFill(grid: string[], size: number, start: number, newColor: string): string[] {
  const target = grid[start];
  if (target === newColor) return grid;
  const next = cloneGrid(grid);
  const stack: number[] = [start];
  while (stack.length) {
    const i = stack.pop()!;
    if (next[i] !== target) continue;
    next[i] = newColor;
    const x = i % size;
    const y = Math.floor(i / size);
    if (x > 0) stack.push(i - 1);
    if (x < size - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - size);
    if (y < size - 1) stack.push(i + size);
  }
  return next;
}

function exportPng(grid: string[], size: number, scale: number, transparentBg: boolean): void {
  const canvas = document.createElement("canvas");
  canvas.width = size * scale;
  canvas.height = size * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  if (!transparentBg) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  for (let i = 0; i < grid.length; i++) {
    const color = grid[i];
    if (!color) continue;
    const x = (i % size) * scale;
    const y = Math.floor(i / size) * scale;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, scale, scale);
  }
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pixel-art-${size}x${size}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

export default function PixelArtEditorPage() {
  const [size, setSize] = useState<(typeof SIZES)[number]>(24);
  const [grid, setGrid] = useState<string[]>(() => makeEmptyGrid(24));
  const [color, setColor] = useState("#3498db");
  const [tool, setTool] = useState<Tool>("draw");
  const [history, setHistory] = useState<string[][]>([]);
  const [future, setFuture] = useState<string[][]>([]);
  const isDrawingRef = useRef(false);
  const strokeBeforeRef = useRef<string[] | null>(null);

  const commitHistory = useCallback((before: string[]) => {
    setHistory((h) => [...h.slice(-49), before]);
    setFuture([]);
  }, []);

  const paintCell = useCallback(
    (index: number) => {
      setGrid((prev) => {
        const nextColor = tool === "erase" ? EMPTY : color;
        if (prev[index] === nextColor) return prev;
        const next = cloneGrid(prev);
        next[index] = nextColor;
        return next;
      });
    },
    [color, tool]
  );

  const onCellDown = (index: number) => {
    strokeBeforeRef.current = cloneGrid(grid);
    if (tool === "fill") {
      const next = floodFill(grid, size, index, color);
      if (next !== grid) {
        commitHistory(grid);
        setGrid(next);
      }
      strokeBeforeRef.current = null;
      return;
    }
    isDrawingRef.current = true;
    paintCell(index);
  };

  const onCellEnter = (index: number) => {
    if (!isDrawingRef.current) return;
    paintCell(index);
  };

  const endStroke = () => {
    if (isDrawingRef.current && strokeBeforeRef.current) {
      // Only commit history if grid actually changed during the stroke.
      const before = strokeBeforeRef.current;
      const changed = before.some((v, i) => v !== grid[i]);
      if (changed) commitHistory(before);
    }
    isDrawingRef.current = false;
    strokeBeforeRef.current = null;
  };

  const undo = () => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setFuture((f) => [grid, ...f].slice(0, 50));
    setGrid(prev);
  };

  const redo = () => {
    if (!future.length) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setHistory((h) => [...h.slice(-49), grid]);
    setGrid(next);
  };

  const clear = () => {
    commitHistory(grid);
    setGrid(makeEmptyGrid(size));
  };

  const changeSize = (next: (typeof SIZES)[number]) => {
    if (next === size) return;
    commitHistory(grid);
    setSize(next);
    setGrid(makeEmptyGrid(next));
  };

  const cellPx = useMemo(() => {
    // Target a ~480px canvas, rounded to whole pixels so grid lines stay crisp.
    return Math.max(10, Math.floor(480 / size));
  }, [size]);

  const prompt = `Build a Pixel Art Editor in React with:
- Selectable grid sizes: 16x16, 24x24, 32x32
- Tools: draw, erase, flood fill (bucket)
- Click or drag to paint, with a single undo entry per continuous stroke
- 12-color palette plus a custom color picker
- Undo/redo stack capped at 50 entries each
- Clear button and size-change both snapshot to history so they are undoable
- Export as PNG with optional transparent background, upscaled 16x for a crisp sprite
- No external drawing libraries — pure DOM grid + one-time canvas for export
- Dark theme, purple accents, hover ring on active palette color`;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <BlogNav />
      <div className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Pixel Art Editor</h1>
        <p className="mb-8 text-neutral-400">
          Grid-based sprite editor with undo/redo and PNG export. Built with vibecoding in ~15 minutes.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          {/* Canvas */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 flex justify-center">
            <div
              onMouseUp={endStroke}
              onMouseLeave={endStroke}
              onTouchEnd={endStroke}
              className="inline-block select-none touch-none"
              style={{
                backgroundImage:
                  "linear-gradient(45deg, #1f1f1f 25%, transparent 25%), linear-gradient(-45deg, #1f1f1f 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1f1f1f 75%), linear-gradient(-45deg, transparent 75%, #1f1f1f 75%)",
                backgroundSize: `${cellPx * 2}px ${cellPx * 2}px`,
                backgroundPosition: `0 0, 0 ${cellPx}px, ${cellPx}px -${cellPx}px, -${cellPx}px 0`,
                padding: 1,
                border: "1px solid #3f3f3f",
              }}
            >
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(${size}, ${cellPx}px)`,
                  gridTemplateRows: `repeat(${size}, ${cellPx}px)`,
                }}
              >
                {grid.map((c, i) => (
                  <div
                    key={i}
                    onMouseDown={() => onCellDown(i)}
                    onMouseEnter={() => onCellEnter(i)}
                    style={{
                      width: cellPx,
                      height: cellPx,
                      background: c || "transparent",
                    }}
                    className="cursor-crosshair"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Tools */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
              <div className="text-xs text-neutral-500 mb-2">Tool</div>
              <div className="grid grid-cols-3 gap-2">
                {(["draw", "erase", "fill"] as Tool[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTool(t)}
                    className={`px-2 py-2 rounded-lg border text-xs font-medium capitalize transition ${
                      tool === t
                        ? "border-purple-500 bg-purple-500/20 text-purple-200"
                        : "border-neutral-700 bg-neutral-950 hover:border-neutral-500"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Palette */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
              <div className="text-xs text-neutral-500 mb-2">Color</div>
              <div className="grid grid-cols-6 gap-1.5 mb-3">
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setColor(c);
                      if (tool === "erase") setTool("draw");
                    }}
                    style={{ background: c }}
                    className={`h-7 rounded border-2 transition ${
                      color === c ? "border-purple-400 ring-2 ring-purple-500/40" : "border-neutral-700 hover:border-neutral-500"
                    }`}
                    aria-label={`Select color ${c}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-8 w-12 rounded cursor-pointer bg-transparent border border-neutral-700"
                />
                <span className="font-mono text-xs text-neutral-400">{color}</span>
              </div>
            </div>

            {/* Canvas size */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
              <div className="text-xs text-neutral-500 mb-2">Canvas size</div>
              <div className="grid grid-cols-3 gap-2">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => changeSize(s)}
                    className={`px-2 py-2 rounded-lg border text-xs font-medium transition ${
                      size === s
                        ? "border-purple-500 bg-purple-500/20 text-purple-200"
                        : "border-neutral-700 bg-neutral-950 hover:border-neutral-500"
                    }`}
                  >
                    {s}×{s}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={undo}
                  disabled={!history.length}
                  className="px-2 py-2 rounded-lg border border-neutral-700 bg-neutral-950 hover:border-neutral-500 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  ↶ Undo
                </button>
                <button
                  onClick={redo}
                  disabled={!future.length}
                  className="px-2 py-2 rounded-lg border border-neutral-700 bg-neutral-950 hover:border-neutral-500 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  ↷ Redo
                </button>
              </div>
              <button
                onClick={() => exportPng(grid, size, 16, true)}
                className="w-full px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-sm font-medium transition"
              >
                Export PNG (transparent)
              </button>
              <button
                onClick={() => exportPng(grid, size, 16, false)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-700 bg-neutral-950 hover:border-neutral-500 text-sm transition"
              >
                Export PNG (white bg)
              </button>
              <button
                onClick={clear}
                className="w-full px-3 py-2 rounded-lg border border-neutral-700 bg-neutral-950 hover:border-red-500/60 hover:text-red-300 text-sm transition"
              >
                Clear canvas
              </button>
            </div>
          </div>
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
