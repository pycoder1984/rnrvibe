import { NextRequest, NextResponse } from "next/server";

/**
 * Services status probe for the local dashboard.
 * Localhost-only — exposes infrastructure topology that should never leave the box.
 */

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const SD_URL = process.env.SD_URL || "http://127.0.0.1:7860";
const AUDIO_URL = process.env.AUDIO_URL || "http://127.0.0.1:7870";
const PROBE_TIMEOUT_MS = 2500;

type Status = "up" | "down" | "error";

interface ServiceStatus {
  id: "ollama" | "website" | "sd" | "audio" | "tunnel";
  label: string;
  status: Status;
  url?: string;
  detail?: string;
  latencyMs?: number;
}

function isLocal(req: NextRequest): boolean {
  if (req.headers.get("cf-connecting-ip")) return false;
  const host = req.headers.get("host") || "";
  return host.startsWith("localhost") || host.startsWith("127.0.0.1");
}

async function probe(url: string): Promise<{ status: Status; detail?: string; latencyMs: number }> {
  const started = Date.now();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(PROBE_TIMEOUT_MS) });
    const latencyMs = Date.now() - started;
    return res.ok
      ? { status: "up", latencyMs }
      : { status: "error", detail: `HTTP ${res.status}`, latencyMs };
  } catch (err) {
    const latencyMs = Date.now() - started;
    const msg = err instanceof Error ? err.message : "unknown";
    return { status: "down", detail: msg, latencyMs };
  }
}

async function probeTunnel(): Promise<ServiceStatus> {
  // cloudflared doesn't expose a local health port by default; we just probe
  // the public tunnel. If it's reachable from this box, the tunnel is up.
  const { status, detail, latencyMs } = await probe("https://api.rnrvibe.com/api/health");
  return {
    id: "tunnel",
    label: "Cloudflare Tunnel",
    status,
    url: "https://api.rnrvibe.com",
    detail,
    latencyMs,
  };
}

export async function GET(req: NextRequest) {
  if (!isLocal(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [ollama, sd, audio, tunnel] = await Promise.all([
    probe(`${OLLAMA_URL}/api/tags`),
    probe(`${SD_URL}/sdapi/v1/progress`),
    probe(`${AUDIO_URL}/health`),
    probeTunnel(),
  ]);

  const services: ServiceStatus[] = [
    {
      id: "ollama",
      label: "Ollama",
      status: ollama.status,
      url: OLLAMA_URL,
      detail: ollama.detail,
      latencyMs: ollama.latencyMs,
    },
    {
      id: "website",
      label: "Website",
      status: "up", // if this route is responding, the website is up
      url: `http://${req.headers.get("host") || "localhost:3000"}`,
    },
    {
      id: "sd",
      label: "Stable Diffusion",
      status: sd.status,
      url: SD_URL,
      detail: sd.detail,
      latencyMs: sd.latencyMs,
    },
    {
      id: "audio",
      label: "Audio Server",
      status: audio.status,
      url: AUDIO_URL,
      detail: audio.detail,
      latencyMs: audio.latencyMs,
    },
    tunnel,
  ];

  return NextResponse.json({ services, timestamp: Date.now() });
}
