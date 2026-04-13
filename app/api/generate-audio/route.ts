import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { addLog } from "@/lib/request-log";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const AUDIO_URL = process.env.AUDIO_URL || "http://127.0.0.1:7870";

// Audio generation is slow — give it plenty of room (up to 30s audio, CPU path)
const GENERATION_TIMEOUT_MS = 10 * 60 * 1000;
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 5 * 60 * 1000;

// Job-record lifetime in the in-memory map. Generous so slow polls still find the result.
const JOB_TTL_MS = 20 * 60 * 1000;

const ALLOWED_MODES = ["music", "sfx"] as const;
type Mode = (typeof ALLOWED_MODES)[number];

const MAX_DURATION: Record<Mode, number> = { music: 30, sfx: 10 };
const MIN_DURATION = 1;

const ALLOWED_MUSIC_MODELS = new Set([
  "facebook/musicgen-small",
  "facebook/musicgen-medium",
  "facebook/musicgen-large",
]);

type JobBase = {
  createdAt: number;
  mode: Mode;
  duration: number;
  model?: string;
};
type Job =
  | (JobBase & { status: "pending" })
  | (JobBase & { status: "done"; audio: string })
  | (JobBase & { status: "error"; error: string });

// Long-running local server — in-memory state is fine (single process).
const jobs = new Map<string, Job>();

function sweepJobs() {
  const now = Date.now();
  for (const [id, job] of jobs) {
    if (now - job.createdAt > JOB_TTL_MS) jobs.delete(id);
  }
}

async function runJob(
  id: string,
  ip: string,
  prompt: string,
  safeMode: Mode,
  clampedDuration: number,
  safeModel: string | undefined
) {
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
      jobs.set(id, {
        status: "error",
        createdAt: Date.now(),
        mode: safeMode,
        duration: clampedDuration,
        model: safeModel,
        error: "Generation failed. Check the audio server logs.",
      });
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
      return;
    }

    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUrl = `data:audio/wav;base64,${base64}`;

    jobs.set(id, {
      status: "done",
      createdAt: Date.now(),
      mode: safeMode,
      duration: clampedDuration,
      model: safeModel,
      audio: dataUrl,
    });

    addLog({
      timestamp: new Date().toISOString(),
      ip,
      tool: "audio-generator",
      prompt: prompt.slice(0, 500),
      response: `${safeMode}, ${clampedDuration}s${safeModel ? `, ${safeModel}` : ""}`,
      responseTimeMs: Date.now() - started,
      status: "success",
    });
  } catch (err) {
    const isTimeout =
      err instanceof DOMException && (err.name === "AbortError" || err.name === "TimeoutError");
    jobs.set(id, {
      status: "error",
      createdAt: Date.now(),
      mode: safeMode,
      duration: clampedDuration,
      model: safeModel,
      error: isTimeout
        ? "Generation timed out. Try a shorter duration."
        : "Lost connection to audio server during generation.",
    });
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
  }
}

export async function POST(req: NextRequest) {
  sweepJobs();
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

  // Probe the audio server before creating a job
  try {
    const ping = await fetch(`${AUDIO_URL}/health`, { signal: AbortSignal.timeout(5000) });
    if (!ping.ok) throw new Error();
  } catch {
    return NextResponse.json(
      { error: "Audio server is not running. Start it with: python scripts/audio_server.py" },
      { status: 502 }
    );
  }

  const id = randomUUID();
  jobs.set(id, {
    status: "pending",
    createdAt: Date.now(),
    mode: safeMode,
    duration: clampedDuration,
    model: safeModel,
  });

  // Fire and forget — the client polls GET for status.
  void runJob(id, ip, prompt, safeMode, clampedDuration, safeModel);

  return NextResponse.json({ id, status: "pending" });
}

export async function GET(req: NextRequest) {
  sweepJobs();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const job = jobs.get(id);
  if (!job) return NextResponse.json({ error: "Job not found or expired" }, { status: 404 });

  if (job.status === "pending") {
    return NextResponse.json({ status: "pending" });
  }
  if (job.status === "error") {
    return NextResponse.json({ status: "error", error: job.error });
  }
  return NextResponse.json({
    status: "done",
    audio: job.audio,
    mode: job.mode,
    duration: job.duration,
    model: job.model,
  });
}
