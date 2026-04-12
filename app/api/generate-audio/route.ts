import { NextRequest, NextResponse } from "next/server";
import { addLog } from "@/lib/request-log";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const AUDIO_URL = process.env.AUDIO_URL || "http://127.0.0.1:7870";

// Audio generation is slow — give it plenty of room (up to 30s audio, CPU path)
const GENERATION_TIMEOUT_MS = 10 * 60 * 1000;
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 5 * 60 * 1000;

const ALLOWED_MODES = ["music", "sfx"] as const;
type Mode = (typeof ALLOWED_MODES)[number];

const MAX_DURATION: Record<Mode, number> = { music: 30, sfx: 10 };
const MIN_DURATION = 1;

const ALLOWED_MUSIC_MODELS = new Set([
  "facebook/musicgen-small",
  "facebook/musicgen-medium",
  "facebook/musicgen-large",
]);

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { limited } = checkRateLimit("audio-gen", ip, RATE_LIMIT, RATE_WINDOW_MS);

  if (limited) {
    addLog({
      timestamp: new Date().toISOString(),
      ip,
      tool: "audio-generator",
      prompt: "",
      response: "",
      responseTimeMs: 0,
      status: "blocked",
      error: "Rate limited",
    });
    return NextResponse.json(
      { error: "Too many audio requests. Please wait a few minutes." },
      { status: 429 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { prompt, mode, duration, model } = body as {
    prompt?: string;
    mode?: string;
    duration?: number;
    model?: string;
  };

  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }
  if (prompt.length > 500) {
    return NextResponse.json({ error: "Prompt too long (max 500 characters)" }, { status: 400 });
  }
  if (!mode || !ALLOWED_MODES.includes(mode as Mode)) {
    return NextResponse.json({ error: "mode must be 'music' or 'sfx'" }, { status: 400 });
  }
  const safeMode = mode as Mode;

  const parsedDuration = typeof duration === "number" ? duration : Number(duration);
  if (!Number.isFinite(parsedDuration)) {
    return NextResponse.json({ error: "duration must be a number" }, { status: 400 });
  }
  const clampedDuration = Math.min(
    Math.max(parsedDuration, MIN_DURATION),
    MAX_DURATION[safeMode]
  );

  let safeModel: string | undefined;
  if (safeMode === "music" && typeof model === "string" && model.length > 0) {
    if (!ALLOWED_MUSIC_MODELS.has(model)) {
      return NextResponse.json({ error: "Unsupported music model" }, { status: 400 });
    }
    safeModel = model;
  }

  // Probe the audio server before kicking off the long request
  try {
    const ping = await fetch(`${AUDIO_URL}/health`, { signal: AbortSignal.timeout(5000) });
    if (!ping.ok) throw new Error();
  } catch {
    return NextResponse.json(
      { error: "Audio server is not running. Start it with: python scripts/audio_server.py" },
      { status: 502 }
    );
  }

  const started = Date.now();
  const endpoint = safeMode === "music" ? "/music" : "/sfx";
  const reqBody =
    safeMode === "music"
      ? { prompt, duration: clampedDuration, ...(safeModel ? { model: safeModel } : {}) }
      : { prompt, duration: clampedDuration };

  try {
    const res = await fetch(`${AUDIO_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reqBody),
      signal: AbortSignal.timeout(GENERATION_TIMEOUT_MS),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const msg = text || `Audio server returned ${res.status}`;
      addLog({
        timestamp: new Date().toISOString(),
        ip,
        tool: "audio-generator",
        prompt: prompt.slice(0, 500),
        response: `${safeMode}, ${clampedDuration}s`,
        responseTimeMs: Date.now() - started,
        status: "error",
        error: msg.slice(0, 200),
      });
      return NextResponse.json(
        { error: "Generation failed. Check the audio server logs." },
        { status: 502 }
      );
    }

    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUrl = `data:audio/wav;base64,${base64}`;

    addLog({
      timestamp: new Date().toISOString(),
      ip,
      tool: "audio-generator",
      prompt: prompt.slice(0, 500),
      response: `${safeMode}, ${clampedDuration}s${safeModel ? `, ${safeModel}` : ""}`,
      responseTimeMs: Date.now() - started,
      status: "success",
    });

    return NextResponse.json({
      audio: dataUrl,
      mode: safeMode,
      duration: clampedDuration,
      model: safeModel,
    });
  } catch (err) {
    const isTimeout =
      err instanceof DOMException && (err.name === "AbortError" || err.name === "TimeoutError");
    addLog({
      timestamp: new Date().toISOString(),
      ip,
      tool: "audio-generator",
      prompt: prompt.slice(0, 500),
      response: `${safeMode}, ${clampedDuration}s`,
      responseTimeMs: Date.now() - started,
      status: isTimeout ? "timeout" : "error",
      error: isTimeout ? "Generation timed out" : "Lost connection to audio server",
    });
    return NextResponse.json(
      {
        error: isTimeout
          ? "Generation timed out. Try a shorter duration."
          : "Lost connection to audio server during generation.",
      },
      { status: isTimeout ? 504 : 502 }
    );
  }
}
