import { NextRequest, NextResponse } from "next/server";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";

const AUDIO_URL = process.env.AUDIO_URL || "http://127.0.0.1:7870";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const { limited } = checkRateLimit("audio-health", ip, 30, 60_000);
  if (limited) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  try {
    const res = await fetch(`${AUDIO_URL}/health`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) {
      return NextResponse.json(
        { ready: false, error: "Audio server responded with an error" },
        { status: 502 }
      );
    }
    const data = await res.json();
    return NextResponse.json({ ready: true, ...data });
  } catch {
    return NextResponse.json(
      {
        ready: false,
        error: "Audio server is not running. Start it with: python scripts/audio_server.py",
      },
      { status: 502 }
    );
  }
}
