import { NextRequest, NextResponse } from "next/server";
import { addLog } from "@/lib/request-log";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const SD_URL = process.env.SD_URL || "http://127.0.0.1:7860";

// ControlNet fans out to a preprocessor + a second model pass on the GPU,
// so each request is ~2x a plain txt2img. Rate limit is tighter than
// image-studio's to match that cost.
const RATE_LIMIT = 8;
const RATE_WINDOW_MS = 5 * 60 * 1000;

// Model IDs as reported by /controlnet/model_list on this install. The
// bracketed hashes disambiguate revisions and must match exactly or A1111
// will silently fall back to "no model" and produce a base txt2img output.
const MODEL_IDS: Record<string, string> = {
  pose: "control_v11p_sd15_openpose [cab727d4]",
  depth: "control_v11f1p_sd15_depth [cfd03158]",
  canny: "control_v11p_sd15_canny [d14c016b]",
};

// Preprocessor module names. "depth_midas" is the default MiDaS depth
// estimator shipped with the extension; "openpose" detects body keypoints
// only (use "openpose_full" if we ever add face/hand preprocessing).
const PREPROCESSORS: Record<string, string> = {
  pose: "openpose",
  depth: "depth_midas",
  canny: "canny",
};

type Mode = keyof typeof MODEL_IDS;

function isValidMode(m: unknown): m is Mode {
  return typeof m === "string" && m in MODEL_IDS;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { limited } = checkRateLimit("controlnet", ip, RATE_LIMIT, RATE_WINDOW_MS);

  if (limited) {
    addLog({
      timestamp: new Date().toISOString(), ip, tool: "controlnet",
      prompt: "", response: "", responseTimeMs: 0, status: "blocked", error: "Rate limited",
    });
    return NextResponse.json({ error: "Too many requests. Please wait a few minutes." }, { status: 429 });
  }

  try {
    const ping = await fetch(`${SD_URL}/sdapi/v1/progress`, { signal: AbortSignal.timeout(5000) });
    if (!ping.ok) throw new Error();
  } catch {
    return NextResponse.json({ error: "Stable Diffusion is not running. Start it with --api flag." }, { status: 502 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    mode, image, prompt, negativePrompt, width, height, steps,
    cfgScale, seed, controlWeight, showPreprocessed,
  } = body;

  if (!isValidMode(mode)) {
    return NextResponse.json({ error: "Mode must be 'pose', 'depth', or 'canny'" }, { status: 400 });
  }
  if (!image || typeof image !== "string") {
    return NextResponse.json({ error: "Reference image is required" }, { status: 400 });
  }
  if (!prompt || typeof prompt !== "string" || prompt.length > 2000) {
    return NextResponse.json({ error: "Prompt is required (max 2000 characters)" }, { status: 400 });
  }

  // Clamp to values that fit the 6 GB VRAM envelope for SD 1.5 + ControlNet.
  const w = Math.min(Math.max(Math.round((Number(width) || 512) / 64) * 64, 256), 768);
  const h = Math.min(Math.max(Math.round((Number(height) || 512) / 64) * 64, 256), 768);
  const s = Math.min(Math.max(Number(steps) || 20, 10), 40);
  const cfg = Math.min(Math.max(Number(cfgScale) || 7, 1), 20);
  const weight = Math.min(Math.max(Number(controlWeight) || 1.0, 0), 2);
  const seedVal = Number(seed) || -1;

  const startTime = Date.now();

  try {
    const res = await fetch(`${SD_URL}/sdapi/v1/txt2img`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: prompt as string,
        negative_prompt: (negativePrompt as string) || "blurry, bad quality, distorted, deformed, ugly",
        width: w,
        height: h,
        steps: s,
        cfg_scale: cfg,
        seed: seedVal,
        sampler_name: "DPM++ 2M",
        scheduler: "Karras",
        batch_size: 1,
        n_iter: 1,
        alwayson_scripts: {
          controlnet: {
            args: [
              {
                enabled: true,
                input_image: image as string,
                module: PREPROCESSORS[mode],
                model: MODEL_IDS[mode],
                weight,
                resize_mode: "Crop and Resize",
                pixel_perfect: true,
                control_mode: "Balanced",
                processor_res: 512,
                // Include the detected conditioning image in the response so
                // the UI can show users the skeleton / depth map / edge map
                // that ControlNet actually saw. Adds one entry to data.images.
                save_detected_map: Boolean(showPreprocessed),
              },
            ],
          },
        },
      }),
      signal: AbortSignal.timeout(300000),
    });

    if (!res.ok) {
      addLog({
        timestamp: new Date().toISOString(), ip, tool: "controlnet",
        prompt: `${mode}: ${(prompt as string).slice(0, 200)}`,
        response: "", responseTimeMs: Date.now() - startTime,
        status: "error", error: `SD ${res.status}`,
      });
      return NextResponse.json({ error: "Generation failed. Try a different reference or settings." }, { status: 502 });
    }

    const data = await res.json();
    if (!data.images || data.images.length === 0) {
      return NextResponse.json({ error: "No image returned" }, { status: 502 });
    }

    let resultSeed = -1;
    try { resultSeed = JSON.parse(data.info).seed; } catch { /* ignore */ }

    // With save_detected_map, the first image is the generation, subsequent
    // entries are the preprocessed conditioning maps. We only return the
    // first two (main + single map) to avoid ballooning the response.
    const response: { image: string; seed: number; preprocessed?: string } = {
      image: data.images[0],
      seed: resultSeed,
    };
    if (showPreprocessed && data.images[1]) {
      response.preprocessed = data.images[1];
    }

    addLog({
      timestamp: new Date().toISOString(), ip, tool: "controlnet",
      prompt: `${mode}: ${(prompt as string).slice(0, 200)}`,
      response: `${mode} @ ${w}x${h}, ${s} steps, weight ${weight}, seed ${resultSeed}`,
      responseTimeMs: Date.now() - startTime,
      status: "success",
    });

    return NextResponse.json(response);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    addLog({
      timestamp: new Date().toISOString(), ip, tool: "controlnet",
      prompt: `${mode}`, response: "", responseTimeMs: Date.now() - startTime,
      status: "error", error: errMsg,
    });
    if (err instanceof DOMException && (err.name === "AbortError" || err.name === "TimeoutError")) {
      return NextResponse.json({ error: "Generation timed out — try fewer steps or a smaller resolution" }, { status: 504 });
    }
    return NextResponse.json({ error: "Lost connection to Stable Diffusion" }, { status: 502 });
  }
}

// Probe handler so the tool page can verify the ControlNet extension is
// loaded before the user hits Generate. Returns the list of models A1111
// reports. Clients should treat any non-2xx (or a response missing our
// three models) as "extension unavailable".
export async function GET() {
  try {
    const res = await fetch(`${SD_URL}/controlnet/model_list`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error();
    const data = await res.json();
    return NextResponse.json({ models: data.model_list || [] });
  } catch {
    return NextResponse.json({ models: [], error: "ControlNet extension not loaded" }, { status: 502 });
  }
}
