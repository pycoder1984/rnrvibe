import { NextRequest, NextResponse } from "next/server";
import { addLog } from "@/lib/request-log";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const SD_URL = process.env.SD_URL || "http://127.0.0.1:7860";

// Per-model generation timeout: 5 minutes
const MODEL_TIMEOUT_MS = 5 * 60 * 1000;
// Total request timeout: 20 minutes (for 4 models with model switching)
const TOTAL_TIMEOUT_MS = 20 * 60 * 1000;

const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 5 * 60 * 1000;

async function getCurrentModel(): Promise<string | null> {
  try {
    const res = await fetch(`${SD_URL}/sdapi/v1/options`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.sd_model_checkpoint || null;
  } catch {
    return null;
  }
}

async function switchModel(modelTitle: string): Promise<boolean> {
  try {
    // Skip switch if the model is already loaded
    const current = await getCurrentModel();
    if (current === modelTitle) return true;

    const res = await fetch(`${SD_URL}/sdapi/v1/options`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sd_model_checkpoint: modelTitle }),
      signal: AbortSignal.timeout(120000), // model loading can take up to 2 min
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function generateImage(
  prompt: string,
  negativePrompt: string,
  width: number,
  height: number,
  steps: number,
  cfgScale: number,
  seed: number
): Promise<{ image: string; seed: number; info: string } | { error: string }> {
  try {
    const res = await fetch(`${SD_URL}/sdapi/v1/txt2img`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        negative_prompt: negativePrompt,
        width,
        height,
        steps,
        cfg_scale: cfgScale,
        seed: seed === -1 ? -1 : seed,
        sampler_name: "DPM++ 2M",
        scheduler: "Karras",
        batch_size: 1,
        n_iter: 1,
      }),
      signal: AbortSignal.timeout(MODEL_TIMEOUT_MS),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "Unknown error");
      return { error: "Image generation failed. Try different settings or a different model." };
    }

    const data = await res.json();
    if (!data.images || data.images.length === 0) {
      return { error: "No image returned from Stable Diffusion" };
    }

    let parsedInfo = { seed: -1 };
    try {
      parsedInfo = JSON.parse(data.info);
    } catch { /* ignore */ }

    return {
      image: data.images[0],
      seed: parsedInfo.seed ?? -1,
      info: data.info || "",
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { error: "Generation timed out — try fewer steps or a smaller resolution" };
    }
    if (err instanceof DOMException && err.name === "TimeoutError") {
      return { error: "Generation timed out — try fewer steps or a smaller resolution" };
    }
    return { error: "Lost connection to Stable Diffusion during generation" };
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { limited } = checkRateLimit("image-gen", ip, RATE_LIMIT, RATE_WINDOW_MS);

  if (limited) {
    addLog({
      timestamp: new Date().toISOString(), ip, tool: "image-generator",
      prompt: "", response: "", responseTimeMs: 0, status: "blocked",
      error: "Rate limited",
    });
    return NextResponse.json(
      { error: "Too many image requests. Please wait a few minutes." },
      { status: 429 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    prompt,
    negativePrompt = "blurry, bad quality, distorted, deformed",
    models,
    width = 512,
    height = 512,
    steps = 20,
    cfgScale = 7,
    seed = -1,
  } = body;

  if (!prompt || typeof prompt !== "string" || prompt.length > 2000) {
    return NextResponse.json(
      { error: "Prompt is required (max 2000 characters)" },
      { status: 400 }
    );
  }

  if (!Array.isArray(models) || models.length === 0 || models.length > 4) {
    return NextResponse.json(
      { error: "Select 1-4 models" },
      { status: 400 }
    );
  }

  // Validate dimensions
  const clampedWidth = Math.min(Math.max(Math.round(width / 64) * 64, 256), 1024);
  const clampedHeight = Math.min(Math.max(Math.round(height / 64) * 64, 256), 1024);
  const clampedSteps = Math.min(Math.max(steps, 1), 50);
  const clampedCfg = Math.min(Math.max(cfgScale, 1), 20);

  // Verify SD is reachable before starting the long process
  try {
    const ping = await fetch(`${SD_URL}/sdapi/v1/progress`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!ping.ok) throw new Error();
  } catch {
    return NextResponse.json(
      { error: "Stable Diffusion is not running. Start it with --api flag." },
      { status: 502 }
    );
  }

  // Stream results via SSE as each model completes
  const totalAbort = new AbortController();
  const totalTimeout = setTimeout(() => totalAbort.abort(), TOTAL_TIMEOUT_MS);
  const requestStartTime = Date.now();

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        // Pad small events to flush through any buffering layers
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      try {
        send("status", { message: `Starting generation with ${models.length} model(s)...`, total: models.length });

        for (let i = 0; i < models.length; i++) {
          if (totalAbort.signal.aborted) {
            send("error", { model: models[i], index: i, error: "Request cancelled — total timeout exceeded" });
            break;
          }

          const modelTitle = models[i];

          // Switch model
          send("progress", {
            index: i,
            model: modelTitle,
            phase: "loading",
            message: `Loading model: ${modelTitle.split(".")[0]}...`,
          });

          const switched = await switchModel(modelTitle);
          if (!switched) {
            send("error", {
              index: i,
              model: modelTitle,
              error: `Failed to load model: ${modelTitle}`,
            });
            continue;
          }

          // Generate
          send("progress", {
            index: i,
            model: modelTitle,
            phase: "generating",
            message: `Generating image ${i + 1}/${models.length}...`,
          });

          const result = await generateImage(
            prompt,
            negativePrompt,
            clampedWidth,
            clampedHeight,
            clampedSteps,
            clampedCfg,
            seed
          );

          if ("error" in result) {
            send("error", { index: i, model: modelTitle, error: result.error });
            addLog({
              timestamp: new Date().toISOString(), ip, tool: "image-generator",
              prompt: prompt.slice(0, 500),
              response: `Model: ${modelTitle}`,
              responseTimeMs: Date.now() - requestStartTime,
              status: "error",
              error: result.error,
            });
          } else {
            send("image", {
              index: i,
              model: modelTitle,
              image: result.image,
              seed: result.seed,
            });
            addLog({
              timestamp: new Date().toISOString(), ip, tool: "image-generator",
              prompt: prompt.slice(0, 500),
              response: `Model: ${modelTitle}, Seed: ${result.seed}, ${clampedWidth}x${clampedHeight}, ${clampedSteps} steps`,
              responseTimeMs: Date.now() - requestStartTime,
              status: "success",
            });
          }
        }

        send("done", { message: "All generations complete" });
      } catch (err) {
        send("error", {
          index: -1,
          model: "",
          error: err instanceof Error ? err.message : "Unexpected error during generation",
        });
      } finally {
        clearTimeout(totalTimeout);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
