"use client";
import { API_BASE } from "@/lib/api-config";

import BlogNav from "@/components/BlogNav";
import { useState, useEffect, useRef, useCallback } from "react";

interface SDModel {
  title: string;
  name: string;
  hash: string;
  loaded: boolean;
}

interface GeneratedImage {
  index: number;
  model: string;
  image: string; // base64
  seed: number;
}

interface GenerationSlot {
  index: number;
  model: string;
  status: "waiting" | "loading" | "generating" | "done" | "error";
  message: string;
  image?: string;
  seed?: number;
}

export default function ImageGeneratorPage() {
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("blurry, bad quality, distorted, deformed, ugly, low resolution");
  const [models, setModels] = useState<SDModel[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelsError, setModelsError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [slots, setSlots] = useState<GenerationSlot[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [width, setWidth] = useState(512);
  const [height, setHeight] = useState(512);
  const [steps, setSteps] = useState(20);
  const [cfgScale, setCfgScale] = useState(7);
  const [seed, setSeed] = useState(-1);
  const [gallery, setGallery] = useState<GeneratedImage[]>([]);
  const [lightbox, setLightbox] = useState<GeneratedImage | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);

  const fetchModels = useCallback(async () => {
    setModelsLoading(true);
    setModelsError("");
    try {
      const res = await fetch(`${API_BASE}/api/sd-models`, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Connection failed" }));
        setModelsError(data.error || `Failed to fetch models (${res.status})`);
        return;
      }
      const data = await res.json();
      setModels(data.models || []);
      // Auto-select the currently loaded model
      if (data.models?.length > 0 && selectedModels.length === 0) {
        const loaded = data.models.find((m: SDModel) => m.loaded);
        if (loaded) setSelectedModels([loaded.title]);
      }
      retryCountRef.current = 0;
    } catch {
      setModelsError("Cannot connect to Stable Diffusion. Make sure it's running with --api flag.");
    } finally {
      setModelsLoading(false);
    }
  }, [selectedModels.length]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const toggleModel = (title: string) => {
    setSelectedModels((prev) => {
      if (prev.includes(title)) return prev.filter((m) => m !== title);
      if (prev.length >= 4) return prev;
      return [...prev, title];
    });
  };

  const generate = async () => {
    if (!prompt.trim() || selectedModels.length === 0 || generating) return;

    setGenerating(true);
    const initialSlots: GenerationSlot[] = selectedModels.map((model, i) => ({
      index: i,
      model,
      status: "waiting",
      message: "Waiting...",
    }));
    setSlots(initialSlots);

    abortRef.current = new AbortController();

    try {
      const res = await fetch(`${API_BASE}/api/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          negativePrompt: negativePrompt.trim(),
          models: selectedModels,
          width,
          height,
          steps,
          cfgScale,
          seed,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Generation failed" }));
        setSlots((prev) =>
          prev.map((s) => ({ ...s, status: "error" as const, message: data.error || "Failed" }))
        );
        setGenerating(false);
        return;
      }

      if (!res.body) {
        setGenerating(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let eventType = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith("data: ") && eventType) {
            try {
              const data = JSON.parse(line.slice(6));
              handleSSE(eventType, data);
            } catch { /* skip malformed */ }
            eventType = "";
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setSlots((prev) =>
          prev.map((s) =>
            s.status === "waiting" || s.status === "loading" || s.status === "generating"
              ? { ...s, status: "error" as const, message: "Cancelled" }
              : s
          )
        );
      } else {
        setSlots((prev) =>
          prev.map((s) =>
            s.status !== "done"
              ? { ...s, status: "error" as const, message: "Connection lost — check if Stable Diffusion is still running" }
              : s
          )
        );
      }
    } finally {
      setGenerating(false);
      abortRef.current = null;
    }
  };

  const handleSSE = (event: string, data: Record<string, unknown>) => {
    switch (event) {
      case "progress":
        setSlots((prev) =>
          prev.map((s) =>
            s.index === (data.index as number)
              ? {
                  ...s,
                  status: (data.phase as string) === "loading" ? "loading" : "generating",
                  message: data.message as string,
                }
              : s
          )
        );
        break;

      case "image": {
        const img: GeneratedImage = {
          index: data.index as number,
          model: data.model as string,
          image: data.image as string,
          seed: data.seed as number,
        };
        setSlots((prev) =>
          prev.map((s) =>
            s.index === img.index
              ? { ...s, status: "done", message: "Complete", image: img.image, seed: img.seed }
              : s
          )
        );
        setGallery((prev) => [...prev, img]);
        break;
      }

      case "error":
        setSlots((prev) =>
          prev.map((s) =>
            s.index === (data.index as number)
              ? { ...s, status: "error", message: data.error as string }
              : s
          )
        );
        break;

      case "done":
        // all done
        break;
    }
  };

  const cancel = () => {
    abortRef.current?.abort();
  };

  const downloadImage = (img: GeneratedImage) => {
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${img.image}`;
    link.download = `rnrvibe-${img.model.split(".")[0]}-${img.seed}.png`;
    link.click();
  };

  const modelShortName = (title: string) => {
    return title.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
  };

  const RESOLUTIONS = [
    { label: "512x512", w: 512, h: 512 },
    { label: "512x768", w: 512, h: 768 },
    { label: "768x512", w: 768, h: 512 },
    { label: "768x768", w: 768, h: 768 },
    { label: "1024x1024", w: 1024, h: 1024 },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <BlogNav />
      <div className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">AI Image Generator</h1>
        <p className="mb-8 text-neutral-400">
          Generate images from text descriptions using Stable Diffusion. Select up to 4 models to compare results side by side.
        </p>

        {/* Connection Status / Model Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-neutral-300">
              Select Models <span className="text-neutral-500">({selectedModels.length}/4)</span>
            </h2>
            <button
              onClick={fetchModels}
              disabled={modelsLoading}
              className="text-xs text-neutral-500 hover:text-white transition"
            >
              {modelsLoading ? "Connecting..." : "Refresh"}
            </button>
          </div>

          {modelsError && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300 mb-4">
              <div className="font-medium mb-1">Cannot connect to Stable Diffusion</div>
              <div className="text-red-400 text-xs">{modelsError}</div>
              <button
                onClick={fetchModels}
                className="mt-2 text-xs text-red-300 underline hover:text-white"
              >
                Retry connection
              </button>
            </div>
          )}

          {modelsLoading && !modelsError && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 rounded-lg bg-neutral-800 animate-pulse" />
              ))}
            </div>
          )}

          {!modelsLoading && models.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
              {models.map((model) => {
                const selected = selectedModels.includes(model.title);
                return (
                  <button
                    key={model.title}
                    onClick={() => toggleModel(model.title)}
                    disabled={!selected && selectedModels.length >= 4}
                    className={`text-left p-3 rounded-lg border text-xs transition truncate ${
                      selected
                        ? "border-purple-500 bg-purple-500/20 text-purple-300"
                        : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed"
                    }`}
                    title={model.title}
                  >
                    <div className="font-medium truncate">{modelShortName(model.title)}</div>
                    {model.loaded && (
                      <span className="text-green-400 text-[10px]">Currently loaded</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {selectedModels.length > 1 && (
            <div className="mt-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-300">
              Generating with {selectedModels.length} models requires switching between them. Each switch takes 1-3 minutes on limited VRAM. For faster results, select only one model.
            </div>
          )}
        </div>

        {/* Prompt Input */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm text-neutral-400 mb-1">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A serene mountain lake at sunset, photorealistic, golden hour lighting, reflections in water, 8k detail"
              rows={3}
              maxLength={2000}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-sm text-neutral-200 placeholder-neutral-600 focus:border-purple-500/50 focus:outline-none resize-y"
            />
            <div className="text-xs text-neutral-600 mt-1 text-right">{prompt.length}/2000</div>
          </div>

          {/* Settings Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-xs text-neutral-500 hover:text-neutral-300 transition flex items-center gap-1"
          >
            <svg
              className={`w-3 h-3 transition-transform ${showSettings ? "rotate-90" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            Advanced Settings
          </button>

          {showSettings && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Negative Prompt</label>
                <textarea
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-800 p-3 text-sm text-neutral-200 placeholder-neutral-600 focus:border-purple-500/50 focus:outline-none resize-y"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-2">Resolution</label>
                <div className="flex flex-wrap gap-2">
                  {RESOLUTIONS.map((r) => (
                    <button
                      key={r.label}
                      onClick={() => { setWidth(r.w); setHeight(r.h); }}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition ${
                        width === r.w && height === r.h
                          ? "border-purple-500 bg-purple-500/20 text-purple-300"
                          : "border-neutral-700 text-neutral-400 hover:border-neutral-600"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Steps ({steps})</label>
                  <input
                    type="range"
                    min={1}
                    max={50}
                    value={steps}
                    onChange={(e) => setSteps(Number(e.target.value))}
                    className="w-full accent-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">CFG Scale ({cfgScale})</label>
                  <input
                    type="range"
                    min={1}
                    max={20}
                    step={0.5}
                    value={cfgScale}
                    onChange={(e) => setCfgScale(Number(e.target.value))}
                    className="w-full accent-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Seed</label>
                  <input
                    type="number"
                    value={seed}
                    onChange={(e) => setSeed(Number(e.target.value))}
                    placeholder="-1 for random"
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-neutral-200 focus:border-purple-500/50 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Generate / Cancel */}
          <div className="flex gap-3">
            <button
              onClick={generate}
              disabled={generating || !prompt.trim() || selectedModels.length === 0 || !!modelsError}
              className="rounded-lg bg-purple-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating
                ? "Generating..."
                : `Generate ${selectedModels.length > 1 ? `(${selectedModels.length} models)` : ""}`}
            </button>
            {generating && (
              <button
                onClick={cancel}
                className="rounded-lg border border-red-500/30 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Generation Progress Slots */}
        {slots.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-neutral-400 mb-3">Generation Progress</h2>
            <div className={`grid gap-4 ${slots.length === 1 ? "grid-cols-1 max-w-lg" : "grid-cols-1 sm:grid-cols-2"}`}>
              {slots.map((slot) => (
                <div
                  key={slot.index}
                  className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden"
                >
                  <div className="px-4 py-2 border-b border-neutral-800 flex items-center justify-between">
                    <span className="text-xs font-medium text-neutral-300 truncate">
                      {modelShortName(slot.model)}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        slot.status === "done"
                          ? "bg-green-500/20 text-green-400"
                          : slot.status === "error"
                          ? "bg-red-500/20 text-red-400"
                          : slot.status === "generating"
                          ? "bg-purple-500/20 text-purple-400"
                          : slot.status === "loading"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-neutral-800 text-neutral-500"
                      }`}
                    >
                      {slot.status === "done"
                        ? "Complete"
                        : slot.status === "error"
                        ? "Failed"
                        : slot.status === "generating"
                        ? "Generating"
                        : slot.status === "loading"
                        ? "Loading Model"
                        : "Waiting"}
                    </span>
                  </div>

                  <div className="aspect-square relative bg-neutral-950">
                    {slot.image ? (
                      <img
                        src={`data:image/png;base64,${slot.image}`}
                        alt={`Generated by ${slot.model}`}
                        className="w-full h-full object-contain cursor-pointer"
                        onClick={() =>
                          setLightbox({
                            index: slot.index,
                            model: slot.model,
                            image: slot.image!,
                            seed: slot.seed || -1,
                          })
                        }
                      />
                    ) : slot.status === "error" ? (
                      <div className="flex items-center justify-center h-full p-4">
                        <div className="text-center">
                          <div className="text-red-400 text-2xl mb-2">!</div>
                          <div className="text-xs text-red-400">{slot.message}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-3" />
                          <div className="text-xs text-neutral-500 px-4">{slot.message}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {slot.image && (
                    <div className="px-4 py-2 border-t border-neutral-800 flex items-center justify-between">
                      <span className="text-[10px] text-neutral-500">Seed: {slot.seed}</span>
                      <button
                        onClick={() =>
                          downloadImage({
                            index: slot.index,
                            model: slot.model,
                            image: slot.image!,
                            seed: slot.seed || -1,
                          })
                        }
                        className="text-xs text-neutral-400 hover:text-white transition px-2 py-0.5 rounded border border-neutral-700 hover:border-neutral-600"
                      >
                        Download
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gallery */}
        {gallery.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-neutral-400">
                Gallery ({gallery.length} images)
              </h2>
              <button
                onClick={() => setGallery([])}
                className="text-xs text-neutral-500 hover:text-red-400 transition"
              >
                Clear
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {gallery.map((img, i) => (
                <div
                  key={`${img.model}-${img.seed}-${i}`}
                  className="rounded-lg border border-neutral-800 overflow-hidden group cursor-pointer"
                  onClick={() => setLightbox(img)}
                >
                  <img
                    src={`data:image/png;base64,${img.image}`}
                    alt={`Generated by ${img.model}`}
                    className="w-full aspect-square object-cover"
                  />
                  <div className="px-2 py-1.5 bg-neutral-900">
                    <div className="text-[10px] text-neutral-500 truncate">
                      {modelShortName(img.model)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lightbox */}
        {lightbox && (
          <div
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <div
              className="relative max-w-4xl max-h-[90vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={`data:image/png;base64,${lightbox.image}`}
                alt={`Generated by ${lightbox.model}`}
                className="w-full h-full object-contain rounded-xl"
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent rounded-b-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{modelShortName(lightbox.model)}</div>
                    <div className="text-xs text-neutral-400">Seed: {lightbox.seed}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => downloadImage(lightbox)}
                      className="text-xs bg-purple-500 hover:bg-purple-600 px-3 py-1.5 rounded-lg transition"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => setLightbox(null)}
                      className="text-xs border border-neutral-600 hover:border-neutral-500 px-3 py-1.5 rounded-lg transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
