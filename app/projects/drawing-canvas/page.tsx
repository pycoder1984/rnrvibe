"use client";

import BlogNav from "@/components/BlogNav";
import { useState, useRef, useEffect, useCallback } from "react";

interface Stroke {
  points: { x: number; y: number }[];
  color: string;
  size: number;
  eraser: boolean;
}

const PRESET_COLORS = [
  "#ffffff",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#000000",
];

const MAX_UNDO = 20;

export default function DrawingCanvasPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [color, setColor] = useState("#ffffff");
  const [customHex, setCustomHex] = useState("#ff6600");
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 500 });

  // Resize canvas to fit container
  useEffect(() => {
    function handleResize() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const w = Math.floor(rect.width);
        const h = Math.max(350, Math.min(600, Math.floor(w * 0.6)));
        setCanvasSize({ width: w, height: h });
      }
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Redraw canvas whenever strokes or size changes
  const redraw = useCallback(
    (allStrokes: Stroke[], active: Stroke | null) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // White background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const toDraw = active ? [...allStrokes, active] : allStrokes;

      for (const stroke of toDraw) {
        if (stroke.points.length < 1) continue;
        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = stroke.size;

        if (stroke.eraser) {
          ctx.globalCompositeOperation = "destination-out";
          ctx.strokeStyle = "rgba(0,0,0,1)";
        } else {
          ctx.globalCompositeOperation = "source-over";
          ctx.strokeStyle = stroke.color;
        }

        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

        if (stroke.points.length === 1) {
          // Single dot
          ctx.lineTo(stroke.points[0].x + 0.1, stroke.points[0].y + 0.1);
        } else {
          for (let i = 1; i < stroke.points.length; i++) {
            ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
          }
        }
        ctx.stroke();
        ctx.restore();
      }

      // If eraser was used, redraw white background underneath
      // We need to composite properly: draw white bg first, then all strokes
      // Re-approach: clear and draw properly
      if (toDraw.some((s) => s.eraser)) {
        ctx.save();
        ctx.globalCompositeOperation = "destination-over";
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
    },
    []
  );

  useEffect(() => {
    redraw(strokes, currentStroke);
  }, [strokes, currentStroke, canvasSize, redraw]);

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      const touch = e.touches[0] || (e as React.TouchEvent).changedTouches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    const pos = getPos(e);
    const stroke: Stroke = {
      points: [pos],
      color: isEraser ? "#ffffff" : color,
      size: brushSize,
      eraser: isEraser,
    };
    setCurrentStroke(stroke);
    setIsDrawing(true);
  }

  function moveDraw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing || !currentStroke) return;
    e.preventDefault();
    const pos = getPos(e);
    setCurrentStroke((prev) => {
      if (!prev) return prev;
      return { ...prev, points: [...prev.points, pos] };
    });
  }

  function endDraw() {
    if (!isDrawing || !currentStroke) {
      setIsDrawing(false);
      return;
    }
    setStrokes((prev) => {
      const next = [...prev, currentStroke];
      return next.slice(-MAX_UNDO);
    });
    setCurrentStroke(null);
    setIsDrawing(false);
  }

  function undo() {
    setStrokes((prev) => prev.slice(0, -1));
  }

  function clearCanvas() {
    setStrokes([]);
    setCurrentStroke(null);
  }

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Redraw cleanly before export
    redraw(strokes, null);
    const link = document.createElement("a");
    link.download = "drawing.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  function applyCustomHex() {
    const hex = customHex.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      setColor(hex);
      setIsEraser(false);
    }
  }

  const activeColor = isEraser ? "eraser" : color;

  const prompt = `Build a drawing canvas app in React with:
- Freehand drawing using HTML5 Canvas with mouse and touch support
- 8 preset color swatches plus custom hex color input
- Brush size slider from 1px to 30px
- Eraser tool that removes strokes
- Clear canvas and undo (last 20 strokes) buttons
- Download the drawing as PNG
- White canvas background, responsive sizing
- Dark theme with tool indicators for active tool, color, and size`;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <BlogNav />
      <div className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Drawing Canvas</h1>
        <p className="mb-8 text-neutral-400">
          A freehand drawing app built with vibecoding in ~10 minutes.
        </p>

        {/* Demo */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden mb-8">
          {/* Toolbar */}
          <div className="border-b border-neutral-800 p-4 space-y-4">
            {/* Row 1: Colors */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Colors
              </span>
              <div className="flex items-center gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setColor(c);
                      setIsEraser(false);
                    }}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${
                      !isEraser && color === c
                        ? "border-purple-500 scale-110"
                        : "border-neutral-600 hover:border-neutral-400"
                    }`}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={customHex}
                  onChange={(e) => setCustomHex(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyCustomHex()}
                  placeholder="#ff6600"
                  className="w-20 rounded-lg border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-200 focus:outline-none focus:border-purple-500"
                  maxLength={7}
                />
                <button
                  onClick={applyCustomHex}
                  className="rounded-lg bg-neutral-800 border border-neutral-700 px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-700 transition"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Row 2: Tools + Brush Size */}
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Tools
              </span>
              <button
                onClick={() => setIsEraser(false)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  !isEraser
                    ? "bg-purple-600 text-white"
                    : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                }`}
              >
                Brush
              </button>
              <button
                onClick={() => setIsEraser(true)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  isEraser
                    ? "bg-purple-600 text-white"
                    : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                }`}
              >
                Eraser
              </button>

              <div className="h-6 w-px bg-neutral-700" />

              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Size
              </span>
              <input
                type="range"
                min={1}
                max={30}
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-28 accent-purple-500"
              />
              <span className="text-xs text-neutral-400 w-8">{brushSize}px</span>

              <div className="h-6 w-px bg-neutral-700" />

              <button
                onClick={undo}
                disabled={strokes.length === 0}
                className="rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Undo
              </button>
              <button
                onClick={clearCanvas}
                className="rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-700 transition"
              >
                Clear
              </button>
              <button
                onClick={download}
                className="rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-500 transition"
              >
                Download PNG
              </button>
            </div>

            {/* Status bar */}
            <div className="flex items-center gap-4 text-xs text-neutral-500">
              <span>
                Tool:{" "}
                <span className="text-neutral-300">{isEraser ? "Eraser" : "Brush"}</span>
              </span>
              <span className="flex items-center gap-1.5">
                Color:{" "}
                {isEraser ? (
                  <span className="text-neutral-300">N/A</span>
                ) : (
                  <>
                    <span
                      className="inline-block w-3 h-3 rounded-full border border-neutral-600"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-neutral-300">{color}</span>
                  </>
                )}
              </span>
              <span>
                Size: <span className="text-neutral-300">{brushSize}px</span>
              </span>
              <span>
                Strokes: <span className="text-neutral-300">{strokes.length}</span>
              </span>
            </div>
          </div>

          {/* Canvas */}
          <div ref={containerRef} className="p-4">
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              className="w-full rounded-xl cursor-crosshair touch-none"
              style={{ backgroundColor: "#ffffff" }}
              onMouseDown={startDraw}
              onMouseMove={moveDraw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={moveDraw}
              onTouchEnd={endDraw}
            />
          </div>
        </div>

        {/* Prompt */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
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
            <a
              href="/tools/project-starter"
              className="text-sm text-neutral-500 hover:text-white transition"
            >
              Try in Project Starter →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
