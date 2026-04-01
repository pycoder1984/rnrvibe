"use client";

import BlogNav from "@/components/BlogNav";
import { useState, useRef } from "react";

interface LogoPrompt {
  style: string;
  prompt: string;
  negativePrompt: string;
}

interface GeneratedLogo {
  index: number;
  style: string;
  image: string;
  seed: number;
  prompt: string;
}

interface LogoSlot {
  index: number;
  style: string;
  status: "waiting" | "generating" | "done" | "error";
  message: string;
  image?: string;
  seed?: number;
  prompt?: string;
}

const LOGO_STYLES = [
  { id: "minimalist", name: "Minimalist", icon: "\u25EF", desc: "Clean, simple single-icon logos" },
  { id: "geometric", name: "Geometric", icon: "\u25B3", desc: "Abstract shapes and patterns" },
  { id: "wordmark", name: "Wordmark", icon: "A", desc: "Letter-based / monogram icons" },
  { id: "mascot", name: "Mascot", icon: "\uD83D\uDC3E", desc: "Character / illustration style" },
  { id: "vintage", name: "Vintage", icon: "\u2605", desc: "Badge / emblem / retro style" },
  { id: "gradient", name: "Gradient", icon: "\uD83C\uDF08", desc: "Modern colorful gradient logos" },
];

const PRESET_PALETTES = [
  { name: "Professional Blue", colors: ["#3b82f6", "#1d4ed8", "#60a5fa"] },
  { name: "Nature Green", colors: ["#22c55e", "#10b981", "#86efac"] },
  { name: "Bold Red", colors: ["#ef4444", "#dc2626", "#fca5a5"] },
  { name: "Royal Purple", colors: ["#8b5cf6", "#6366f1", "#a78bfa"] },
  { name: "Warm Orange", colors: ["#f97316", "#f59e0b", "#fdba74"] },
  { name: "Monochrome", colors: ["#171717", "#525252", "#d4d4d4"] },
];

const INDUSTRIES = [
  "Technology", "Food & Beverage", "Fashion", "Healthcare", "Education",
  "Finance", "Sports", "Entertainment", "Real Estate", "Travel",
];

export default function LogoGeneratorPage() {
  const [brandName, setBrandName] = useState("");
  const [industry, setIndustry] = useState("");
  const [description, setDescription] = useState("");
  const [colors, setColors] = useState<string[]>([]);
  const [customColor, setCustomColor] = useState("#6366f1");
  const [background, setBackground] = useState<"white" | "transparent">("white");
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [prompts, setPrompts] = useState<LogoPrompt[]>([]);
  const [showPrompts, setShowPrompts] = useState(false);
  const [slots, setSlots] = useState<LogoSlot[]>([]);
  const [gallery, setGallery] = useState<GeneratedLogo[]>([]);
  const [lightbox, setLightbox] = useState<GeneratedLogo | null>(null);
  const [sdError, setSdError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const toggleStyle = (id: string) => {
    setSelectedStyles((prev) => {
      if (prev.includes(id)) return prev.filter((s) => s !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  const addColor = (hex: string) => {
    if (colors.length >= 3 || colors.includes(hex)) return;
    setColors((prev) => [...prev, hex]);
  };

  const removeColor = (hex: string) => {
    setColors((prev) => prev.filter((c) => c !== hex));
  };

  const canGenerate = brandName.trim() && description.trim() && selectedStyles.length > 0 && !generating;

  const generate = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    setSdError("");
    setPrompts([]);
    setShowPrompts(false);

    const initialSlots: LogoSlot[] = selectedStyles.map((style, i) => ({
      index: i,
      style,
      status: "waiting",
      message: "Waiting for AI prompts...",
    }));
    setSlots(initialSlots);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/generate-logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: brandName.trim(),
          industry: industry.trim(),
          description: description.trim(),
          colors: colors.length > 0 ? colors : ["#171717", "#525252", "#d4d4d4"],
          styles: selectedStyles,
          background,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Generation failed" }));
        if (data.error?.includes("Stable Diffusion")) setSdError(data.error);
        else setSlots((prev) => prev.map((s) => ({ ...s, status: "error" as const, message: data.error || "Failed" })));
        setGenerating(false);
        return;
      }

      if (!res.body) { setGenerating(false); return; }

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
            } catch { /* skip */ }
            eventType = "";
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setSlots((prev) =>
          prev.map((s) =>
            s.status === "done" ? s : { ...s, status: "error" as const, message: "Cancelled" }
          )
        );
      } else {
        setSlots((prev) =>
          prev.map((s) =>
            s.status !== "done" ? { ...s, status: "error" as const, message: "Connection lost" } : s
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
      case "status":
        // Update all waiting slots with status message
        if ((data.phase as string) === "prompts") {
          setSlots((prev) => prev.map((s) => ({ ...s, message: data.message as string })));
        }
        break;

      case "prompts":
        setPrompts(data.prompts as LogoPrompt[]);
        break;

      case "progress":
        setSlots((prev) =>
          prev.map((s) =>
            s.index === (data.index as number)
              ? { ...s, status: "generating", message: data.message as string }
              : s
          )
        );
        break;

      case "image": {
        const logo: GeneratedLogo = {
          index: data.index as number,
          style: data.style as string,
          image: data.image as string,
          seed: data.seed as number,
          prompt: data.prompt as string,
        };
        setSlots((prev) =>
          prev.map((s) =>
            s.index === logo.index
              ? { ...s, status: "done", message: "Complete", image: logo.image, seed: logo.seed, prompt: logo.prompt }
              : s
          )
        );
        setGallery((prev) => [...prev, logo]);
        break;
      }

      case "error":
        if ((data.index as number) === -1) {
          setSlots((prev) =>
            prev.map((s) =>
              s.status !== "done" ? { ...s, status: "error", message: data.error as string } : s
            )
          );
        } else {
          setSlots((prev) =>
            prev.map((s) =>
              s.index === (data.index as number)
                ? { ...s, status: "error", message: data.error as string }
                : s
            )
          );
        }
        break;

      case "done":
        break;
    }
  };

  const cancel = () => { abortRef.current?.abort(); };

  const downloadImage = (logo: GeneratedLogo) => {
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${logo.image}`;
    link.download = `${brandName.replace(/\s+/g, "-").toLowerCase()}-${logo.style}-${logo.seed}.png`;
    link.click();
  };

  const downloadAll = () => {
    gallery.forEach((logo) => {
      setTimeout(() => downloadImage(logo), 100);
    });
  };

  const startOver = () => {
    setSlots([]);
    setPrompts([]);
    setShowPrompts(false);
    setGallery([]);
    setSdError("");
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <BlogNav />
      <div className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">AI Logo Generator</h1>
        <p className="mb-8 text-neutral-400">
          Describe your brand and get professional logo concepts in seconds — powered by local AI.
        </p>

        {/* SD Error */}
        {sdError && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300 mb-6">
            <div className="font-medium mb-1">Cannot connect to Stable Diffusion</div>
            <div className="text-red-400 text-xs">{sdError}</div>
          </div>
        )}

        {/* Brand Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-neutral-400 mb-1">Brand Name *</label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value.slice(0, 50))}
                placeholder="e.g. TechFlow"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm text-neutral-200 placeholder-neutral-600 focus:border-purple-500/50 focus:outline-none"
              />
              <div className="text-xs text-neutral-600 mt-1 text-right">{brandName.length}/50</div>
            </div>

            <div>
              <label className="block text-sm text-neutral-400 mb-1">Industry</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Technology"
                list="industries"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm text-neutral-200 placeholder-neutral-600 focus:border-purple-500/50 focus:outline-none"
              />
              <datalist id="industries">
                {INDUSTRIES.map((ind) => <option key={ind} value={ind} />)}
              </datalist>
            </div>

            <div>
              <label className="block text-sm text-neutral-400 mb-1">Brand Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                placeholder="What does your brand do? What feeling should the logo convey?"
                rows={3}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm text-neutral-200 placeholder-neutral-600 focus:border-purple-500/50 focus:outline-none resize-y"
              />
              <div className="text-xs text-neutral-600 mt-1 text-right">{description.length}/500</div>
            </div>

            {/* Background Toggle */}
            <div>
              <label className="block text-sm text-neutral-400 mb-2">Background</label>
              <div className="flex gap-2">
                {(["white", "transparent"] as const).map((bg) => (
                  <button
                    key={bg}
                    onClick={() => setBackground(bg)}
                    className={`px-4 py-2 rounded-lg text-xs font-medium transition ${
                      background === bg
                        ? "bg-purple-500/20 border-purple-500 text-purple-300 border"
                        : "bg-neutral-900 border-neutral-800 text-neutral-400 border hover:border-neutral-700"
                    }`}
                  >
                    {bg === "white" ? "White" : "Transparent (approx.)"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm text-neutral-400 mb-2">Brand Colors (up to 3)</label>

            {/* Selected Colors */}
            <div className="flex gap-2 mb-3 min-h-[40px]">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => removeColor(c)}
                  className="group relative w-10 h-10 rounded-lg border-2 border-neutral-700 hover:border-red-500/50 transition"
                  style={{ backgroundColor: c }}
                  title={`Remove ${c}`}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 text-xs font-bold drop-shadow-lg">
                    x
                  </span>
                </button>
              ))}
              {colors.length === 0 && (
                <span className="text-xs text-neutral-600 self-center">No colors selected — defaults to monochrome</span>
              )}
            </div>

            {/* Custom Color */}
            <div className="flex gap-2 mb-3">
              <input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-neutral-800 cursor-pointer bg-transparent"
              />
              <button
                onClick={() => addColor(customColor)}
                disabled={colors.length >= 3}
                className="px-3 py-2 rounded-lg text-xs border border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Add Color
              </button>
            </div>

            {/* Preset Palettes */}
            <div className="space-y-2">
              <span className="text-xs text-neutral-500">Or choose a preset:</span>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_PALETTES.map((palette) => (
                  <button
                    key={palette.name}
                    onClick={() => setColors([...palette.colors])}
                    className="flex items-center gap-2 p-2 rounded-lg border border-neutral-800 bg-neutral-900 hover:border-neutral-700 transition text-left"
                  >
                    <div className="flex gap-0.5">
                      {palette.colors.map((c) => (
                        <div key={c} className="w-4 h-4 rounded-full" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <span className="text-xs text-neutral-400">{palette.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Style Selection */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-neutral-300 mb-3">
            Select Styles <span className="text-neutral-500">({selectedStyles.length}/4)</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {LOGO_STYLES.map((style) => {
              const selected = selectedStyles.includes(style.id);
              return (
                <button
                  key={style.id}
                  onClick={() => toggleStyle(style.id)}
                  disabled={!selected && selectedStyles.length >= 4}
                  className={`p-4 rounded-xl border text-center transition ${
                    selected
                      ? "border-purple-500 bg-purple-500/10 text-purple-300"
                      : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed"
                  }`}
                >
                  <div className="text-2xl mb-1">{style.icon}</div>
                  <div className="text-xs font-medium">{style.name}</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">{style.desc}</div>
                  {selected && (
                    <div className="text-purple-400 text-xs mt-1">&#10003;</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={generate}
            disabled={!canGenerate}
            className="rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {generating ? "Generating..." : "Generate Logos"}
          </button>
          {generating && (
            <button
              onClick={cancel}
              className="rounded-xl border border-red-500/30 px-4 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
            >
              Cancel
            </button>
          )}
          {gallery.length > 0 && !generating && (
            <>
              <button
                onClick={downloadAll}
                className="rounded-xl border border-neutral-700 px-4 py-3 text-sm font-medium text-neutral-300 transition hover:bg-neutral-900"
              >
                Download All
              </button>
              <button
                onClick={startOver}
                className="rounded-xl border border-neutral-800 px-4 py-3 text-sm font-medium text-neutral-500 transition hover:text-neutral-300"
              >
                Start Over
              </button>
            </>
          )}
        </div>

        {/* AI Prompts Preview */}
        {prompts.length > 0 && (
          <div className="mb-8">
            <button
              onClick={() => setShowPrompts(!showPrompts)}
              className="text-xs text-neutral-500 hover:text-neutral-300 transition flex items-center gap-1 mb-2"
            >
              <svg
                className={`w-3 h-3 transition-transform ${showPrompts ? "rotate-90" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              AI-Generated Prompts ({prompts.length})
            </button>
            {showPrompts && (
              <div className="space-y-2">
                {prompts.map((p, i) => (
                  <div key={i} className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
                    <div className="text-xs font-medium text-purple-400 mb-1 capitalize">{p.style}</div>
                    <div className="text-xs text-neutral-400 break-words">{p.prompt}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Generation Progress */}
        {slots.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-neutral-400 mb-3">Generation Progress</h2>
            <div className={`grid gap-4 ${
              slots.length === 1 ? "grid-cols-1 max-w-lg"
                : slots.length === 2 ? "grid-cols-1 sm:grid-cols-2"
                  : "grid-cols-1 sm:grid-cols-2"
            }`}>
              {slots.map((slot) => (
                <div
                  key={slot.index}
                  className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden"
                >
                  <div className="px-4 py-2 border-b border-neutral-800 flex items-center justify-between">
                    <span className="text-xs font-medium text-neutral-300 capitalize">{slot.style}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        slot.status === "done"
                          ? "bg-green-500/20 text-green-400"
                          : slot.status === "error"
                            ? "bg-red-500/20 text-red-400"
                            : slot.status === "generating"
                              ? "bg-purple-500/20 text-purple-400"
                              : "bg-neutral-800 text-neutral-500"
                      }`}
                    >
                      {slot.status === "done" ? "Complete"
                        : slot.status === "error" ? "Failed"
                          : slot.status === "generating" ? "Generating"
                            : "Waiting"}
                    </span>
                  </div>

                  <div className="aspect-square relative bg-neutral-950">
                    {slot.image ? (
                      <img
                        src={`data:image/png;base64,${slot.image}`}
                        alt={`${brandName} ${slot.style} logo`}
                        className="w-full h-full object-contain cursor-pointer"
                        onClick={() =>
                          setLightbox({
                            index: slot.index,
                            style: slot.style,
                            image: slot.image!,
                            seed: slot.seed || -1,
                            prompt: slot.prompt || "",
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
                            style: slot.style,
                            image: slot.image!,
                            seed: slot.seed || -1,
                            prompt: slot.prompt || "",
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
        {gallery.length > 0 && !generating && (
          <div>
            <h2 className="text-sm font-semibold text-neutral-400 mb-3">
              Gallery ({gallery.length} logos)
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {gallery.map((logo, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden group cursor-pointer"
                  onClick={() => setLightbox(logo)}
                >
                  <div className="aspect-square relative bg-neutral-950">
                    <img
                      src={`data:image/png;base64,${logo.image}`}
                      alt={`${brandName} ${logo.style} logo`}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <span className="text-xs text-white font-medium">View</span>
                    </div>
                  </div>
                  <div className="px-3 py-2 text-xs text-neutral-400 capitalize">{logo.style}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lightbox */}
        {lightbox && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <div
              className="relative max-w-2xl w-full bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
                <span className="text-sm font-medium text-neutral-200 capitalize">
                  {lightbox.style} Logo
                </span>
                <button
                  onClick={() => setLightbox(null)}
                  className="text-neutral-500 hover:text-white text-lg"
                >
                  x
                </button>
              </div>
              <div className="bg-neutral-950 p-4">
                <img
                  src={`data:image/png;base64,${lightbox.image}`}
                  alt={`${brandName} ${lightbox.style} logo`}
                  className="w-full h-auto max-h-[70vh] object-contain mx-auto"
                />
              </div>
              <div className="px-4 py-3 border-t border-neutral-800 flex items-center justify-between">
                <span className="text-xs text-neutral-500">Seed: {lightbox.seed}</span>
                <button
                  onClick={() => downloadImage(lightbox)}
                  className="text-xs text-purple-400 hover:text-purple-300 transition px-3 py-1 rounded border border-purple-500/30 hover:border-purple-500/50"
                >
                  Download PNG
                </button>
              </div>
              {lightbox.prompt && (
                <div className="px-4 py-2 border-t border-neutral-800">
                  <div className="text-[10px] text-neutral-600 mb-1">Prompt used:</div>
                  <div className="text-xs text-neutral-500 break-words">{lightbox.prompt}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
