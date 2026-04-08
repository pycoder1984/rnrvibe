"use client";
import { API_BASE } from "@/lib/api-config";

import BlogNav from "@/components/BlogNav";
import { useState, useRef, useEffect, useCallback } from "react";

type Tab = "upscale" | "restyle" | "inpaint" | "caption";

const TABS: { id: Tab; name: string; icon: string; desc: string }[] = [
  { id: "upscale", name: "Upscale & Enhance", icon: "\u2B06", desc: "AI upscale + face restore" },
  { id: "restyle", name: "Restyle", icon: "\u{1F3A8}", desc: "Transform with a prompt" },
  { id: "inpaint", name: "Inpaint", icon: "\u{1F58C}\uFE0F", desc: "Edit parts of an image" },
  { id: "caption", name: "Image to Prompt", icon: "\u{1F4DD}", desc: "Get AI description" },
];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Image Drop Zone ─────────────────────────────────────────────────

function ImageDrop({ onImage, image, label }: { onImage: (b64: string) => void; image: string; label?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const b64 = await fileToBase64(file);
    onImage(b64);
  };

  return (
    <div
      className={`relative rounded-xl border-2 border-dashed transition cursor-pointer overflow-hidden ${
        dragging ? "border-purple-500 bg-purple-500/10" : "border-neutral-700 bg-neutral-900 hover:border-neutral-600"
      } ${image ? "aspect-square" : "aspect-square"}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      {image ? (
        <img src={`data:image/png;base64,${image}`} alt="Upload" className="w-full h-full object-contain" />
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-neutral-500 text-sm gap-2">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <span>{label || "Drop image or click to upload"}</span>
        </div>
      )}
    </div>
  );
}

// ─── Inpaint Canvas ──────────────────────────────────────────────────

function InpaintCanvas({ image, onMask }: { image: string; onMask: (mask: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const [painting, setPainting] = useState(false);
  const [brushSize, setBrushSize] = useState(30);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!image || !canvasRef.current || !maskCanvasRef.current) return;
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      const maskCanvas = maskCanvasRef.current!;
      canvas.width = img.width;
      canvas.height = img.height;
      maskCanvas.width = img.width;
      maskCanvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const maskCtx = maskCanvas.getContext("2d")!;
      maskCtx.fillStyle = "black";
      maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
    };
    img.src = `data:image/png;base64,${image}`;
  }, [image]);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const draw = useCallback((pos: { x: number; y: number }) => {
    if (!canvasRef.current || !maskCanvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d")!;
    const maskCtx = maskCanvasRef.current.getContext("2d")!;

    // Draw on visible canvas (red overlay)
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = "#ff0000";
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, brushSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Draw on mask canvas (white = area to inpaint)
    maskCtx.fillStyle = "white";
    maskCtx.beginPath();
    maskCtx.arc(pos.x, pos.y, brushSize, 0, Math.PI * 2);
    maskCtx.fill();

    // Connect to last position for smooth strokes
    if (lastPos.current) {
      const dx = pos.x - lastPos.current.x;
      const dy = pos.y - lastPos.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      for (let i = 0; i < dist; i += brushSize / 2) {
        const t = i / dist;
        const px = lastPos.current.x + dx * t;
        const py = lastPos.current.y + dy * t;
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = "#ff0000";
        ctx.beginPath();
        ctx.arc(px, py, brushSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        maskCtx.fillStyle = "white";
        maskCtx.beginPath();
        maskCtx.arc(px, py, brushSize, 0, Math.PI * 2);
        maskCtx.fill();
      }
    }
    lastPos.current = pos;
  }, [brushSize]);

  const exportMask = useCallback(() => {
    if (!maskCanvasRef.current) return;
    const dataUrl = maskCanvasRef.current.toDataURL("image/png");
    onMask(dataUrl.split(",")[1]);
  }, [onMask]);

  const clearMask = () => {
    if (!canvasRef.current || !maskCanvasRef.current || !image) return;
    const img = new Image();
    img.onload = () => {
      const ctx = canvasRef.current!.getContext("2d")!;
      ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      ctx.drawImage(img, 0, 0);
      const maskCtx = maskCanvasRef.current!.getContext("2d")!;
      maskCtx.fillStyle = "black";
      maskCtx.fillRect(0, 0, maskCanvasRef.current!.width, maskCanvasRef.current!.height);
      onMask("");
    };
    img.src = `data:image/png;base64,${image}`;
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <label className="text-xs text-neutral-400">Brush: {brushSize}px</label>
        <input
          type="range" min={5} max={80} value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="flex-1 accent-purple-500"
        />
        <button onClick={clearMask} className="text-xs text-neutral-500 hover:text-white px-2 py-1 border border-neutral-700 rounded">
          Clear Mask
        </button>
      </div>
      <div className="rounded-xl border border-neutral-700 overflow-hidden bg-neutral-950">
        <canvas
          ref={canvasRef}
          className="w-full cursor-crosshair"
          style={{ display: image ? "block" : "none" }}
          onMouseDown={(e) => {
            setPainting(true);
            lastPos.current = null;
            draw(getPos(e));
          }}
          onMouseMove={(e) => { if (painting) draw(getPos(e)); }}
          onMouseUp={() => { setPainting(false); lastPos.current = null; exportMask(); }}
          onMouseLeave={() => { if (painting) { setPainting(false); lastPos.current = null; exportMask(); } }}
        />
        <canvas ref={maskCanvasRef} className="hidden" />
        {!image && (
          <div className="aspect-square flex items-center justify-center text-neutral-500 text-sm">
            Upload an image first
          </div>
        )}
      </div>
      <p className="text-[10px] text-neutral-600 mt-1">Paint over the area you want to change (shown in red)</p>
    </div>
  );
}

// ─── Result Display ──────────────────────────────────────────────────

function ResultImage({ image, label }: { image: string; label?: string }) {
  const download = () => {
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${image}`;
    link.download = `rnrvibe-${label || "result"}-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden">
      {label && <div className="px-3 py-2 border-b border-neutral-800 text-xs text-neutral-400">{label}</div>}
      <div className="aspect-square bg-neutral-950">
        <img src={`data:image/png;base64,${image}`} alt="Result" className="w-full h-full object-contain" />
      </div>
      <div className="px-3 py-2 border-t border-neutral-800 flex justify-end">
        <button onClick={download} className="text-xs text-neutral-400 hover:text-white transition px-2 py-0.5 rounded border border-neutral-700">
          Download
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────

export default function ImageStudioPage() {
  const [tab, setTab] = useState<Tab>("upscale");
  const [image, setImage] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [caption, setCaption] = useState("");

  // SD connectivity state
  const [sdReady, setSdReady] = useState(false);
  const [sdChecking, setSdChecking] = useState(true);
  const [sdError, setSdError] = useState("");

  // Upscale state
  const [upscalers, setUpscalers] = useState<string[]>([]);
  const [upscaler, setUpscaler] = useState("R-ESRGAN 4x+");
  const [scaleFactor, setScaleFactor] = useState(2);
  const [faceRestore, setFaceRestore] = useState(false);
  const [faceRestoreModel, setFaceRestoreModel] = useState("codeformer");
  const [faceRestoreStrength, setFaceRestoreStrength] = useState(0.8);

  // Restyle state
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("blurry, bad quality, distorted");
  const [denoising, setDenoising] = useState(0.55);
  const [steps, setSteps] = useState(25);

  // Inpaint state
  const [mask, setMask] = useState("");
  const [inpaintPrompt, setInpaintPrompt] = useState("");
  const [inpaintDenoising, setInpaintDenoising] = useState(0.75);

  // Caption state
  const [captionModel, setCaptionModel] = useState("clip");

  // Check SD connectivity and fetch upscalers on mount
  const checkSD = useCallback(async () => {
    setSdChecking(true);
    setSdError("");
    try {
      const res = await fetch(`${API_BASE}/api/image-studio`, { signal: AbortSignal.timeout(10000) });
      const data = await res.json();
      if (data.upscalers) {
        setUpscalers(data.upscalers);
        setSdReady(true);
      } else {
        setSdError("Stable Diffusion returned an unexpected response.");
      }
    } catch {
      setSdError("Cannot connect to Stable Diffusion. Make sure it's running with --api flag.");
    } finally {
      setSdChecking(false);
    }
  }, []);

  useEffect(() => {
    checkSD();
  }, [checkSD]);

  const clearAll = () => {
    setImage("");
    setResult("");
    setError("");
    setCaption("");
    setMask("");
  };

  const handleTabChange = (t: Tab) => {
    setTab(t);
    setResult("");
    setError("");
    setCaption("");
    setMask("");
  };

  const callApi = async (body: Record<string, unknown>) => {
    setLoading(true);
    setError("");
    setResult("");
    setCaption("");
    try {
      const res = await fetch(`${API_BASE}/api/image-studio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Request failed");
        return;
      }
      if (data.image) setResult(data.image);
      if (data.caption) setCaption(data.caption);
    } catch {
      setError("Connection failed — is Stable Diffusion running?");
    } finally {
      setLoading(false);
    }
  };

  const doUpscale = () => callApi({
    action: "upscale", image, upscaler, scaleFactor, faceRestore, faceRestoreModel, faceRestoreStrength,
  });

  const doRestyle = () => callApi({
    action: "restyle", image, prompt, negativePrompt, denoisingStrength: denoising, steps, cfgScale: 7,
  });

  const doInpaint = () => callApi({
    action: "inpaint", image, mask, prompt: inpaintPrompt, denoisingStrength: inpaintDenoising, steps: 25, cfgScale: 7,
  });

  const doCaption = () => callApi({ action: "caption", image, model: captionModel });

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <BlogNav />
      <div className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">AI Image Studio</h1>
        <p className="mb-8 text-neutral-400">
          Upload an image and transform it — upscale, restyle, inpaint, or extract prompts. Powered by local Stable Diffusion.
        </p>

        {/* SD Status */}
        {sdChecking && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-sm text-neutral-400 mb-6 flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            Checking Stable Diffusion connection...
          </div>
        )}
        {sdError && !sdChecking && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300 mb-6">
            <div className="font-medium mb-1">Cannot connect to Stable Diffusion</div>
            <div className="text-red-400 text-xs">{sdError}</div>
            <button
              onClick={checkSD}
              className="mt-2 text-xs text-red-300 underline hover:text-white"
            >
              Retry connection
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              className={`flex-shrink-0 px-4 py-3 rounded-xl text-sm transition ${
                tab === t.id
                  ? "bg-purple-500/20 border-purple-500 text-purple-300 border"
                  : "bg-neutral-900 border-neutral-800 text-neutral-400 border hover:border-neutral-700"
              }`}
            >
              <span className="mr-2">{t.icon}</span>
              <span className="font-medium">{t.name}</span>
              <span className="hidden sm:inline text-xs text-neutral-500 ml-2">— {t.desc}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Input */}
          <div className="space-y-4">
            {tab !== "inpaint" ? (
              <ImageDrop onImage={setImage} image={image} />
            ) : (
              <>
                {!image && <ImageDrop onImage={setImage} image="" label="Upload image to inpaint" />}
                {image && <InpaintCanvas image={image} onMask={setMask} />}
              </>
            )}

            {image && (
              <button onClick={clearAll} className="text-xs text-neutral-500 hover:text-red-400 transition">
                Clear image
              </button>
            )}

            {/* Tab-specific controls */}
            {tab === "upscale" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Upscaler</label>
                  <select
                    value={upscaler}
                    onChange={(e) => setUpscaler(e.target.value)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-900 p-2 text-sm text-neutral-200"
                  >
                    {(upscalers.length > 0 ? upscalers : ["R-ESRGAN 4x+", "R-ESRGAN 4x+ Anime6B", "ESRGAN_4x", "SwinIR 4x"]).map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Scale Factor: {scaleFactor}x</label>
                  <input type="range" min={2} max={4} step={1} value={scaleFactor}
                    onChange={(e) => setScaleFactor(Number(e.target.value))}
                    className="w-full accent-purple-500" />
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-neutral-400 cursor-pointer">
                    <input type="checkbox" checked={faceRestore} onChange={(e) => setFaceRestore(e.target.checked)}
                      className="accent-purple-500" />
                    Face Restoration
                  </label>
                  {faceRestore && (
                    <>
                      <select value={faceRestoreModel} onChange={(e) => setFaceRestoreModel(e.target.value)}
                        className="rounded border border-neutral-800 bg-neutral-900 px-2 py-1 text-xs text-neutral-300">
                        <option value="codeformer">CodeFormer</option>
                        <option value="gfpgan">GFPGAN</option>
                      </select>
                      <input type="range" min={0.1} max={1} step={0.1} value={faceRestoreStrength}
                        onChange={(e) => setFaceRestoreStrength(Number(e.target.value))}
                        className="w-20 accent-purple-500" />
                      <span className="text-xs text-neutral-500">{faceRestoreStrength}</span>
                    </>
                  )}
                </div>
                <button onClick={doUpscale} disabled={!image || loading || !sdReady}
                  className="w-full rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-40 transition">
                  {loading ? "Upscaling..." : "Upscale Image"}
                </button>
              </div>
            )}

            {tab === "restyle" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Style Prompt *</label>
                  <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={2}
                    placeholder="e.g. oil painting style, vibrant colors, impressionist"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm text-neutral-200 placeholder-neutral-600 focus:border-purple-500/50 focus:outline-none resize-y" />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Negative Prompt</label>
                  <input value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-900 p-2 text-sm text-neutral-200" />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">
                    Transformation Strength: {denoising.toFixed(2)}
                    <span className="text-neutral-600 ml-2">(low = subtle, high = dramatic)</span>
                  </label>
                  <input type="range" min={0.1} max={0.95} step={0.05} value={denoising}
                    onChange={(e) => setDenoising(Number(e.target.value))}
                    className="w-full accent-purple-500" />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Steps: {steps}</label>
                  <input type="range" min={10} max={50} value={steps}
                    onChange={(e) => setSteps(Number(e.target.value))}
                    className="w-full accent-purple-500" />
                </div>
                <button onClick={doRestyle} disabled={!image || !prompt.trim() || loading || !sdReady}
                  className="w-full rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-40 transition">
                  {loading ? "Restyling..." : "Restyle Image"}
                </button>
              </div>
            )}

            {tab === "inpaint" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">What to fill in *</label>
                  <textarea value={inpaintPrompt} onChange={(e) => setInpaintPrompt(e.target.value)} rows={2}
                    placeholder="e.g. a red hat, blue sky with clouds, wooden floor"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm text-neutral-200 placeholder-neutral-600 focus:border-purple-500/50 focus:outline-none resize-y" />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">
                    Change Strength: {inpaintDenoising.toFixed(2)}
                  </label>
                  <input type="range" min={0.3} max={1} step={0.05} value={inpaintDenoising}
                    onChange={(e) => setInpaintDenoising(Number(e.target.value))}
                    className="w-full accent-purple-500" />
                </div>
                <button onClick={doInpaint} disabled={!image || !mask || !inpaintPrompt.trim() || loading || !sdReady}
                  className="w-full rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-40 transition">
                  {loading ? "Inpainting..." : "Inpaint Selection"}
                </button>
              </div>
            )}

            {tab === "caption" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Captioning Model</label>
                  <select value={captionModel} onChange={(e) => setCaptionModel(e.target.value)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-900 p-2 text-sm text-neutral-200">
                    <option value="clip">CLIP (natural language)</option>
                    <option value="deepdanbooru">DeepDanbooru (anime tags)</option>
                  </select>
                </div>
                <button onClick={doCaption} disabled={!image || loading || !sdReady}
                  className="w-full rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-40 transition">
                  {loading ? "Analyzing..." : "Generate Caption"}
                </button>
              </div>
            )}
          </div>

          {/* Right: Output */}
          <div>
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300 mb-4">
                {error}
              </div>
            )}

            {loading && (
              <div className="rounded-xl border border-neutral-800 bg-neutral-900 aspect-square flex items-center justify-center">
                <div className="text-center">
                  <div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-3" />
                  <div className="text-sm text-neutral-500">Processing...</div>
                </div>
              </div>
            )}

            {result && !loading && <ResultImage image={result} label={tab} />}

            {caption && !loading && (
              <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                <div className="text-xs text-neutral-500 mb-2">Generated Caption / Prompt</div>
                <div className="text-sm text-neutral-200 whitespace-pre-wrap break-words font-mono bg-neutral-950 rounded-lg p-3">
                  {caption}
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(caption)}
                  className="mt-3 text-xs text-purple-400 hover:text-purple-300 transition px-3 py-1 rounded border border-purple-500/30"
                >
                  Copy to Clipboard
                </button>
              </div>
            )}

            {!result && !caption && !loading && !error && (
              <div className="rounded-xl border border-neutral-800 bg-neutral-900 aspect-square flex items-center justify-center">
                <div className="text-center text-neutral-600 text-sm">
                  <div className="text-4xl mb-2">{TABS.find((t) => t.id === tab)?.icon}</div>
                  Result will appear here
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
