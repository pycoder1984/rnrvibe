import { NextResponse } from "next/server";

const SD_URL = process.env.SD_URL || "http://127.0.0.1:7860";

export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`${SD_URL}/sdapi/v1/sd-models`, {
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        { error: "Stable Diffusion API not responding" },
        { status: 502 }
      );
    }

    const models = await res.json();

    // Also fetch the currently loaded model
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
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return NextResponse.json(
        { error: "Stable Diffusion is not running. Start it with --api flag." },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: "Cannot connect to Stable Diffusion. Make sure it is running on " + SD_URL },
      { status: 502 }
    );
  }
}
