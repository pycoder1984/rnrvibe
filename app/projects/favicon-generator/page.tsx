"use client";

import BlogNav from "@/components/BlogNav";
import { useState, useRef, useEffect } from "react";

export default function FaviconGeneratorPage() {
  const [text, setText] = useState("RV");
  const [bgColor, setBgColor] = useState("#a855f7");
  const [textColor, setTextColor] = useState("#ffffff");
  const [fontSize, setFontSize] = useState(28);
  const [shape, setShape] = useState<"square" | "rounded" | "circle">("rounded");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 64;
    canvas.width = size;
    canvas.height = size;

    // Background
    ctx.fillStyle = bgColor;
    if (shape === "circle") {
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (shape === "rounded") {
      const r = 12;
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(size - r, 0);
      ctx.quadraticCurveTo(size, 0, size, r);
      ctx.lineTo(size, size - r);
      ctx.quadraticCurveTo(size, size, size - r, size);
      ctx.lineTo(r, size);
      ctx.quadraticCurveTo(0, size, 0, size - r);
      ctx.lineTo(0, r);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.fill();
    } else {
      ctx.fillRect(0, 0, size, size);
    }

    // Text
    ctx.fillStyle = textColor;
    ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text.slice(0, 3), size / 2, size / 2 + 1);
  }, [text, bgColor, textColor, fontSize, shape]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "favicon.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const prompt = `Build a favicon generator in React with:
- Text input (1-3 characters)
- Background color picker
- Text color picker
- Font size slider
- Shape selector (square, rounded, circle)
- Live preview using HTML Canvas (64x64)
- Download as PNG button
- Large preview display
- Dark theme`;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <BlogNav />
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Favicon Generator</h1>
        <p className="mb-8 text-neutral-400">A quick favicon maker built with vibecoding in ~5 minutes.</p>

        {/* Demo */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8 mb-8 space-y-6">
          {/* Preview */}
          <div className="flex flex-col items-center gap-4">
            <canvas
              ref={canvasRef}
              className="w-32 h-32 border border-neutral-700 rounded-lg"
              style={{ imageRendering: "pixelated" }}
            />
            <div className="flex items-center gap-3">
              <canvas
                ref={(el) => {
                  if (el && canvasRef.current) {
                    const ctx = el.getContext("2d");
                    if (ctx) {
                      el.width = 32;
                      el.height = 32;
                      ctx.drawImage(canvasRef.current, 0, 0, 32, 32);
                    }
                  }
                }}
                className="w-8 h-8 rounded"
              />
              <canvas
                ref={(el) => {
                  if (el && canvasRef.current) {
                    const ctx = el.getContext("2d");
                    if (ctx) {
                      el.width = 16;
                      el.height = 16;
                      ctx.drawImage(canvasRef.current, 0, 0, 16, 16);
                    }
                  }
                }}
                className="w-4 h-4 rounded-sm"
              />
              <span className="text-xs text-neutral-500">Preview at different sizes</span>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <div>
              <label className="text-sm text-neutral-400 block mb-1">Text (1-3 chars)</label>
              <input
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 3))}
                maxLength={3}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-center text-lg font-bold text-neutral-200 focus:border-purple-500/50 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-neutral-400 block mb-1">Background</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-10 h-10 rounded border border-neutral-700 cursor-pointer"
                  />
                  <input
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-200 font-mono focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-neutral-400 block mb-1">Text Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-10 h-10 rounded border border-neutral-700 cursor-pointer"
                  />
                  <input
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-200 font-mono focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-neutral-400">Font Size</span>
                <span className="text-purple-400 font-mono">{fontSize}px</span>
              </div>
              <input
                type="range"
                min="12"
                max="48"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>

            <div>
              <label className="text-sm text-neutral-400 block mb-2">Shape</label>
              <div className="flex gap-2">
                {(["square", "rounded", "circle"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setShape(s)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
                      shape === s
                        ? "bg-purple-500 text-white"
                        : "bg-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={download}
            className="w-full py-3 rounded-xl bg-purple-500 text-white font-semibold hover:bg-purple-600 transition"
          >
            Download PNG
          </button>
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
