import { NextRequest, NextResponse } from "next/server";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";

const SD_URL = process.env.SD_URL || "http://127.0.0.1:7860";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const { limited } = checkRateLimit("sd-models", ip, 30, 60_000);
  if (limited) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`${SD_URL}/sdapi/v1/sd-models`, {
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        { error: "Stable Diffusion is not responding" },
        { status: 502 }
      );
    }

    const models = await res.json();

    let currentModel = "";
    try {
      const optRes = await fetch(`${SD_URL}/sdapi/v1/options`, {
        signal: AbortSignal.timeout(5000),
      });
      if (optRes.ok) {
        const opts = await optRes.json();
        currentModel = opts.sd_model_checkpoint || "";
      }
    } catch {
      // non-critical
    }

    const simplified = models.map((m: { title: string; model_name: string; hash: string }) => ({
      title: m.title,
      name: m.model_name,
      hash: m.hash,
      loaded: m.title === currentModel,
    }));

    return NextResponse.json({ models: simplified, current: currentModel });
  } catch {
    return NextResponse.json(
      { error: "Stable Diffusion is not running. Please start it locally." },
      { status: 502 }
    );
  }
}
