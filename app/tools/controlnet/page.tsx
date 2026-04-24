"use client";
import { getApiBase } from "@/lib/api-config";

import BlogNav from "@/components/BlogNav";
import { useState, useRef, useEffect, useCallback } from "react";

type Mode = "pose" | "depth" | "canny";

const MODES: { id: Mode; name: string; icon: string; desc: string; hint: string }[] = [
  { id: "pose", name: "Pose", icon: "\u{1F57A}", desc: "Transfer body pose from a reference photo",
    hint: "Upload any photo of a person — the generated image will match their pose, but look like whatever your prompt describes." },
  { id: "depth", name: "Depth", icon: "\u{1F304}", desc: "Preserve scene depth and composition",
    hint: "Works best for landscapes and interiors — keeps the 3D structure of the reference while the prompt changes the style." },
  { id: "canny", name: "Canny Edges", icon: "✏", desc: "Keep the outline, change everything else",
    hint: "Detects edges in the reference. The output matches those edges exactly — sharpest form of control." },
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
      className={`relative rounded-xl border-2 border-dashed transition cursor-pointer overflow-hidden aspect-square ${
        dragging ? "border-purple-500 bg-purple-500/10" : "border-neutral-700 bg-neutral-900 hover:border-neutral-600"
      }`}
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
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`data:image/png;base64,${image}`} alt="Reference" className="w-full h-full object-contain" />
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-neutral-500 text-sm gap-2 p-4 text-center">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <span>{label || "Drop reference image or click to upload"}</span>
        </div>
      )}
    </div>
  );
}

function ResultImage({ image, label }: { image: string; label?: string }) {
  const download = () => {
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${image}`;
    link.download = `rnrvibe-controlnet-${label || "result"}-${Date.now()}.png`;
    link.click();
  };
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden">
      {label && <div className="px-3 py-2 border-b border-neutral-800 text-xs text-neutral-400">{label}</div>}
      <div className="aspect-square bg-neutral-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
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

export default function ControlNetPage() {
  const [mode, setMode] = useState<Mode>("pose");
  const [image, setImage] = useState("");
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("blurry, bad quality, distorted, deformed, ugly");
  const [controlWeight, setControlWeight] = useState(1.0);
  const [showPreprocessed, setShowPreprocessed] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [width, setWidth] = useState(512);
  const [height, setHeight] = useState(512);
  const [steps, setSteps] = useState(20);
  const [cfgScale, setCfgScale] = useState(7);
  const [seed, setSeed] = useState(-1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ image: string; preprocessed?: string; seed?: number } | null>(null);

  const [extChecking, setExtChecking] = useState(true);
  const [extError, setExtError] = useState("");
  const [extReady, setExtReady] = useState(false);

  const checkExt = useCallback(async () => {
    setExtChecking(true);
    setExtError("");
    try {
      const res = await fetch(`${getApiBase()}/api/controlnet`, { signal: AbortSignal.timeout(10000) });
      const data = await res.json();
      if (!res.ok || !data.models || data.models.length === 0) {
        setExtError(data.error || "ControlNet extension not loaded. Restart Stable Diffusion.");
      } else {
        setExtReady(true);
      }
    } catch {
      setExtError("Cannot reach Stable Diffusion. Is it running with --api?");
    } finally {
      setExtChecking(false);
    }
  }, []);

  useEffect(() => { checkExt(); }, [checkExt]);

  const generate = async () => {
    if (!image || !prompt.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`${getApiBase()}/api/controlnet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode, image, prompt, negativePrompt, width, height, steps, cfgScale, seed,
          controlWeight, showPreprocessed,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Generation failed");
        return;
      }
      setResult({ image: data.image, preprocessed: data.preprocessed, seed: data.seed });
    } catch {
      setError("Connection failed — is Stable Diffusion running?");
    } finally {
      setLoading(false);
    }
  };

  const activeMode = MODES.find((m) => m.id === mode)!;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <BlogNav />
      <div className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">ControlNet Image Generator</h1>
        <p className="mb-8 text-neutral-400">
          Guide Stable Diffusion with a reference image. Transfer pose, preserve depth, or match edges — the prompt controls what things look like, ControlNet controls where they go.
        </p>

        {extChecking && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-sm text-neutral-400 mb-6 flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            Checking ControlNet extension...
          </div>
        )}
        {extError && !extChecking && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300 mb-6">
            <div className="font-medium mb-1">ControlNet not available</div>
            <div className="text-red-400 text-xs">{extError}</div>
            <button onClick={checkExt} className="mt-2 text-xs text-red-300 underline hover:text-white">
              Retry
            </button>
          </div>
        )}

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex-shrink-0 px-4 py-3 rounded-xl text-sm transition ${
                mode === m.id
                  ? "bg-purple-500/20 border-purple-500 text-purple-300 border"
                  : "bg-neutral-900 border-neutral-800 text-neutral-400 border hover:border-neutral-700"
              }`}
            >
              <span className="mr-2">{m.icon}</span>
              <span className="font-medium">{m.name}</span>
              <span className="hidden sm:inline text-xs text-neutral-500 ml-2">— {m.desc}</span>
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 mb-6 text-xs text-neutral-400">
          <span className="text-purple-400 mr-2">tip:</span>{activeMode.hint}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <ImageDrop onImage={setImage} image={image} label={`Drop reference image for ${activeMode.name.toLowerCase()} mode`} />

            {image && (
              <button onClick={() => setImage("")} className="text-xs text-neutral-500 hover:text-red-400 transition">
                Clear reference
              </button>
            )}

            <div>
              <label className="block text-xs text-neutral-400 mb-1">Prompt *</label>
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3}
                placeholder="e.g. a samurai warrior in a bamboo forest, cinematic lighting"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm text-neutral-200 placeholder-neutral-600 focus:border-purple-500/50 focus:outline-none resize-y" />
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1">Negative Prompt</label>
              <input value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 p-2 text-sm text-neutral-200" />
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1">
                Control Strength: {controlWeight.toFixed(2)}
                <span className="text-neutral-600 ml-2">(how strictly to follow the reference)</span>
              </label>
              <input type="range" min={0} max={2} step={0.05} value={controlWeight}
                onChange={(e) => setControlWeight(Number(e.target.value))}
                className="w-full accent-purple-500" />
            </div>

            <label className="flex items-center gap-2 text-xs text-neutral-400 cursor-pointer">
              <input type="checkbox" checked={showPreprocessed}
                onChange={(e) => setShowPreprocessed(e.target.checked)}
                className="accent-purple-500" />
              Show preprocessed map
              <span className="text-neutral-600 ml-1">(the skeleton / depth / edges ControlNet detected)</span>
            </label>

            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="text-xs text-neutral-500 hover:text-neutral-300 transition"
            >
              {showAdvanced ? "Hide" : "Show"} advanced settings
            </button>

            {showAdvanced && (
              <div className="space-y-3 rounded-xl border border-neutral-800 bg-neutral-900/50 p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Width: {width}</label>
                    <input type="range" min={256} max={768} step={64} value={width}
                      onChange={(e) => setWidth(Number(e.target.value))}
                      className="w-full accent-purple-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Height: {height}</label>
                    <input type="range" min={256} max={768} step={64} value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      className="w-full accent-purple-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Steps: {steps}</label>
                  <input type="range" min={10} max={40} value={steps}
                    onChange={(e) => setSteps(Number(e.target.value))}
                    className="w-full accent-purple-500" />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">CFG Scale: {cfgScale}</label>
                  <input type="range" min={1} max={20} value={cfgScale}
                    onChange={(e) => setCfgScale(Number(e.target.value))}
                    className="w-full accent-purple-500" />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Seed (-1 for random)</label>
                  <input type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value))}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-900 p-2 text-sm text-neutral-200" />
                </div>
              </div>
            )}

            <button
              onClick={generate}
              disabled={!image || !prompt.trim() || loading || !extReady}
              className="w-full rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-40 transition"
            >
              {loading ? "Generating..." : `Generate with ${activeMode.name} control`}
            </button>
          </div>

          <div className="space-y-4">
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>
            )}
            {loading && (
              <div className="rounded-xl border border-neutral-800 bg-neutral-900 aspect-square flex items-center justify-center">
                <div className="text-center">
                  <div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-3" />
                  <div className="text-sm text-neutral-500">Generating with ControlNet...</div>
                  <div className="text-xs text-neutral-600 mt-1">This takes longer than a plain generation — the preprocessor runs first, then SD.</div>
                </div>
              </div>
            )}
            {result && !loading && (
              <>
                <ResultImage image={result.image} label={`${mode} · seed ${result.seed ?? "?"}`} />
                {result.preprocessed && (
                  <ResultImage image={result.preprocessed} label={`${mode} preprocessed map`} />
                )}
              </>
            )}
            {!result && !loading && !error && (
              <div className="rounded-xl border border-neutral-800 bg-neutral-900 aspect-square flex items-center justify-center">
                <div className="text-center text-neutral-600 text-sm">
                  <div className="text-4xl mb-2">{activeMode.icon}</div>
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
