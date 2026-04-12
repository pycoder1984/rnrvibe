"use client";
import { getApiBase } from "@/lib/api-config";

import BlogNav from "@/components/BlogNav";
import { useCallback, useEffect, useState } from "react";

type Mode = "music" | "sfx";

interface HealthInfo {
  ready: boolean;
  device?: string;
  defaults?: { music?: string; sfx?: string };
  limits?: { music_max_seconds?: number; sfx_max_seconds?: number };
  error?: string;
}

interface GeneratedClip {
  id: number;
  mode: Mode;
  prompt: string;
  duration: number;
  model?: string;
  audio: string;
  createdAt: number;
}

const MUSIC_MODELS = [
  { value: "facebook/musicgen-small", label: "MusicGen small (~2 GB VRAM, fast)" },
  { value: "facebook/musicgen-medium", label: "MusicGen medium (~8 GB VRAM)" },
  { value: "facebook/musicgen-large", label: "MusicGen large (~16 GB VRAM, slow)" },
];

const MUSIC_IDEAS = [
  "lo-fi hip hop beat with warm piano and vinyl crackle",
  "upbeat 8-bit chiptune for a retro platformer",
  "cinematic orchestral build with strings and timpani",
  "relaxing ambient synth pads with soft rain",
];

const SFX_IDEAS = [
  "heavy wooden door slamming shut in an empty hall",
  "a swarm of bees buzzing around flowers",
  "rain hitting a tin roof with distant thunder",
  "UI click followed by a satisfying notification chime",
];

export default function AudioGeneratorPage() {
  const [mode, setMode] = useState<Mode>("music");
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(10);
  const [musicModel, setMusicModel] = useState(MUSIC_MODELS[0].value);
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [healthError, setHealthError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [clips, setClips] = useState<GeneratedClip[]>([]);

  const maxDuration = mode === "music" ? 30 : 10;
  const ideas = mode === "music" ? MUSIC_IDEAS : SFX_IDEAS;

  const checkHealth = useCallback(async () => {
    setHealthError("");
    try {
      const res = await fetch(`${getApiBase()}/api/audio-health`, {
        signal: AbortSignal.timeout(8000),
      });
      const data = (await res.json()) as HealthInfo;
      if (!res.ok || !data.ready) {
        setHealth(null);
        setHealthError(data.error || "Audio server is not reachable");
        return;
      }
      setHealth(data);
    } catch {
      setHealth(null);
      setHealthError(
        "Cannot reach the audio server. Start it with: python scripts/audio_server.py"
      );
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  useEffect(() => {
    if (duration > maxDuration) setDuration(maxDuration);
  }, [mode, maxDuration, duration]);

  const generate = async () => {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    setError("");

    try {
      const res = await fetch(`${getApiBase()}/api/generate-audio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          mode,
          duration,
          ...(mode === "music" ? { model: musicModel } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Generation failed (${res.status})`);
        return;
      }
      const clip: GeneratedClip = {
        id: Date.now(),
        mode,
        prompt: prompt.trim(),
        duration,
        model: data.model,
        audio: data.audio,
        createdAt: Date.now(),
      };
      setClips((prev) => [clip, ...prev]);
    } catch {
      setError("Lost connection during generation. Is the server still running?");
    } finally {
      setGenerating(false);
    }
  };

  const download = (clip: GeneratedClip) => {
    const a = document.createElement("a");
    a.href = clip.audio;
    const safePrompt = clip.prompt.slice(0, 40).replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    a.download = `${clip.mode}-${safePrompt || "clip"}-${clip.id}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const remove = (id: number) => setClips((prev) => prev.filter((c) => c.id !== id));

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <BlogNav />
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">AI Audio Generator</h1>
          <p className="mt-2 text-sm text-neutral-400">
            Local music and sound-effect generation via Meta&apos;s MusicGen and AudioGen. Runs on
            your own hardware — nothing leaves the machine.
          </p>
        </div>

        {/* Health banner */}
        {healthError && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">Audio server is offline</div>
                <div className="mt-1 text-red-300/80">{healthError}</div>
                <div className="mt-2 text-xs text-red-300/70">
                  See <code className="rounded bg-red-500/20 px-1 py-0.5">scripts/README.md</code>{" "}
                  for setup.
                </div>
              </div>
              <button
                onClick={checkHealth}
                className="shrink-0 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-1.5 text-xs font-medium hover:bg-red-500/20 transition"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {health && (
          <div className="mb-6 rounded-xl border border-neutral-800 bg-neutral-900/50 px-4 py-2.5 text-xs text-neutral-400 flex flex-wrap gap-x-4 gap-y-1">
            <span>
              <span className="text-neutral-500">Device:</span>{" "}
              <span className="text-neutral-200">{health.device ?? "unknown"}</span>
            </span>
            {health.defaults?.music && (
              <span>
                <span className="text-neutral-500">Music:</span>{" "}
                <span className="text-neutral-200">{health.defaults.music.split("/").pop()}</span>
              </span>
            )}
            {health.defaults?.sfx && (
              <span>
                <span className="text-neutral-500">SFX:</span>{" "}
                <span className="text-neutral-200">{health.defaults.sfx.split("/").pop()}</span>
              </span>
            )}
          </div>
        )}

        {/* Mode tabs */}
        <div className="mb-4 inline-flex rounded-xl border border-neutral-800 bg-neutral-900 p-1">
          <button
            onClick={() => setMode("music")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              mode === "music"
                ? "bg-purple-500 text-white"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Music
          </button>
          <button
            onClick={() => setMode("sfx")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              mode === "sfx"
                ? "bg-purple-500 text-white"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Sound effect
          </button>
        </div>

        {/* Input card */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 space-y-5">
          <div>
            <label className="mb-1.5 flex items-center justify-between text-sm text-neutral-300">
              <span>
                {mode === "music" ? "Describe the music" : "Describe the sound"}
              </span>
              <span className="text-xs text-neutral-600">{prompt.length}/500</span>
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value.slice(0, 500))}
              rows={3}
              placeholder={
                mode === "music"
                  ? "e.g. lo-fi hip hop beat with warm piano and vinyl crackle"
                  : "e.g. heavy wooden door slamming shut in an empty hall"
              }
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-200 placeholder-neutral-600 focus:border-purple-500/50 focus:outline-none"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {ideas.map((idea) => (
                <button
                  key={idea}
                  onClick={() => setPrompt(idea)}
                  className="rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1 text-xs text-neutral-400 hover:border-purple-500/50 hover:text-neutral-200 transition"
                >
                  {idea.length > 50 ? idea.slice(0, 47) + "..." : idea}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center justify-between text-sm text-neutral-300">
                <span>Duration</span>
                <span className="text-xs text-neutral-400">{duration.toFixed(0)}s</span>
              </label>
              <input
                type="range"
                min={1}
                max={maxDuration}
                step={1}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full accent-purple-500"
              />
              <div className="mt-1 flex justify-between text-xs text-neutral-600">
                <span>1s</span>
                <span>{maxDuration}s max</span>
              </div>
            </div>

            {mode === "music" && (
              <div>
                <label className="mb-1.5 block text-sm text-neutral-300">Model</label>
                <select
                  value={musicModel}
                  onChange={(e) => setMusicModel(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-sm text-neutral-200 focus:border-purple-500/50 focus:outline-none"
                >
                  {MUSIC_MODELS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={generate}
              disabled={generating || !prompt.trim() || !health}
              className="rounded-xl bg-purple-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? "Generating..." : "Generate"}
            </button>
            {generating && (
              <span className="text-xs text-neutral-500">
                This can take anywhere from 15s to a few minutes depending on duration, model, and
                whether you&apos;re on GPU or CPU.
              </span>
            )}
          </div>
        </div>

        {/* Clips */}
        {clips.length > 0 && (
          <div className="mt-8 space-y-3">
            <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">
              Generated clips
            </h2>
            {clips.map((clip) => (
              <div
                key={clip.id}
                className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1">
                      <span
                        className={`rounded px-1.5 py-0.5 ${
                          clip.mode === "music"
                            ? "bg-purple-500/20 text-purple-300"
                            : "bg-indigo-500/20 text-indigo-300"
                        }`}
                      >
                        {clip.mode === "music" ? "Music" : "SFX"}
                      </span>
                      <span>{clip.duration}s</span>
                      {clip.model && <span>· {clip.model.split("/").pop()}</span>}
                    </div>
                    <div className="text-sm text-neutral-200 break-words">{clip.prompt}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => download(clip)}
                      className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-neutral-200 hover:border-purple-500/50 transition"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => remove(clip.id)}
                      className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-500 hover:text-red-400 transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <audio controls src={clip.audio} className="w-full" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
