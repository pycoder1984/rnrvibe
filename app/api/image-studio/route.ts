import { NextRequest, NextResponse } from "next/server";
import { addLog } from "@/lib/request-log";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const SD_URL = process.env.SD_URL || "http://127.0.0.1:7860";
const OUTPUT_DIR = process.env.SD_OUTPUT_DIR || path.join(process.cwd(), "data", "generated-images");

const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 5 * 60 * 1000;

async function saveImage(base64: string, prefix: string): Promise<string> {
  try {
    await mkdir(OUTPUT_DIR, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `${timestamp}_${prefix}.png`;
    await writeFile(path.join(OUTPUT_DIR, filename), Buffer.from(base64, "base64"));
    return filename;
  } catch {
    return "";
  }
}

// ─── Upscale & Enhance ───────────────────────────────────────────────

async function handleUpscale(body: Record<string, unknown>) {
  const { image, upscaler, scaleFactor, faceRestore, faceRestoreModel, faceRestoreStrength } = body;

  if (!image || typeof image !== "string") {
    return NextResponse.json({ error: "Image is required" }, { status: 400 });
  }

  const res = await fetch(`${SD_URL}/sdapi/v1/extra-single-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image: image as string,
      resize_mode: 0,
      upscaling_resize: Number(scaleFactor) || 2,
      upscaler_1: (upscaler as string) || "R-ESRGAN 4x+",
      upscaler_2: "None",
      gfpgan_visibility: faceRestore && faceRestoreModel === "gfpgan" ? Number(faceRestoreStrength) || 0.8 : 0,
      codeformer_visibility: faceRestore && faceRestoreModel === "codeformer" ? Number(faceRestoreStrength) || 0.8 : 0,
      codeformer_weight: 0.5,
      upscale_first: false,
    }),
    signal: AbortSignal.timeout(120000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return NextResponse.json({ error: `Upscale failed. Try a different image or settings.` }, { status: 502 });
  }

  const data = await res.json();
  if (!data.image) {
    return NextResponse.json({ error: "No image returned" }, { status: 502 });
  }

  const saved = await saveImage(data.image, `upscale_${(upscaler as string || "esrgan").replace(/[^a-zA-Z0-9]/g, "_")}_${scaleFactor}x`);
  return NextResponse.json({ image: data.image, savedAs: saved });
}

// ─── Restyle (img2img) ───────────────────────────────────────────────

async function handleRestyle(body: Record<string, unknown>) {
  const { image, prompt, negativePrompt, denoisingStrength, steps, cfgScale, seed } = body;

  if (!image || typeof image !== "string") {
    return NextResponse.json({ error: "Image is required" }, { status: 400 });
  }
  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  const res = await fetch(`${SD_URL}/sdapi/v1/img2img`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      init_images: [image as string],
      prompt: prompt as string,
      negative_prompt: (negativePrompt as string) || "blurry, bad quality, distorted",
      denoising_strength: Number(denoisingStrength) || 0.55,
      width: 512,
      height: 512,
      steps: Math.min(Math.max(Number(steps) || 25, 1), 50),
      cfg_scale: Math.min(Math.max(Number(cfgScale) || 7, 1), 20),
      seed: Number(seed) || -1,
      sampler_name: "DPM++ 2M",
      scheduler: "Karras",
      resize_mode: 1,
    }),
    signal: AbortSignal.timeout(180000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return NextResponse.json({ error: `Restyle failed. Try a different style or image.` }, { status: 502 });
  }

  const data = await res.json();
  if (!data.images || data.images.length === 0) {
    return NextResponse.json({ error: "No image returned" }, { status: 502 });
  }

  let resultSeed = -1;
  try { resultSeed = JSON.parse(data.info).seed; } catch { /* ignore */ }

  const saved = await saveImage(data.images[0], `restyle_${resultSeed}`);
  return NextResponse.json({ image: data.images[0], seed: resultSeed, savedAs: saved });
}

// ─── Inpaint ─────────────────────────────────────────────────────────

async function handleInpaint(body: Record<string, unknown>) {
  const { image, mask, prompt, negativePrompt, denoisingStrength, steps, cfgScale, seed } = body;

  if (!image || typeof image !== "string") {
    return NextResponse.json({ error: "Image is required" }, { status: 400 });
  }
  if (!mask || typeof mask !== "string") {
    return NextResponse.json({ error: "Mask is required" }, { status: 400 });
  }
  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  const res = await fetch(`${SD_URL}/sdapi/v1/img2img`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      init_images: [image as string],
      mask: mask as string,
      prompt: prompt as string,
      negative_prompt: (negativePrompt as string) || "blurry, bad quality, distorted",
      denoising_strength: Number(denoisingStrength) || 0.75,
      width: 512,
      height: 512,
      steps: Math.min(Math.max(Number(steps) || 25, 1), 50),
      cfg_scale: Math.min(Math.max(Number(cfgScale) || 7, 1), 20),
      seed: Number(seed) || -1,
      sampler_name: "DPM++ 2M",
      scheduler: "Karras",
      resize_mode: 1,
      inpainting_fill: 1,
      inpaint_full_res: true,
      inpaint_full_res_padding: 32,
      inpainting_mask_invert: 0,
      mask_blur_x: 4,
      mask_blur_y: 4,
    }),
    signal: AbortSignal.timeout(180000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return NextResponse.json({ error: `Inpaint failed. Try a different mask or prompt.` }, { status: 502 });
  }

  const data = await res.json();
  if (!data.images || data.images.length === 0) {
    return NextResponse.json({ error: "No image returned" }, { status: 502 });
  }

  let resultSeed = -1;
  try { resultSeed = JSON.parse(data.info).seed; } catch { /* ignore */ }

  const saved = await saveImage(data.images[0], `inpaint_${resultSeed}`);
  return NextResponse.json({ image: data.images[0], seed: resultSeed, savedAs: saved });
}

// ─── Caption (Interrogate) ───────────────────────────────────────────

async function handleCaption(body: Record<string, unknown>) {
  const { image, model } = body;

  if (!image || typeof image !== "string") {
    return NextResponse.json({ error: "Image is required" }, { status: 400 });
  }

  const res = await fetch(`${SD_URL}/sdapi/v1/interrogate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image: image as string,
      model: (model as string) || "clip",
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return NextResponse.json({ error: `Caption generation failed. Try a different image.` }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json({ caption: data.caption || "" });
}

// ─── Main POST handler ──────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { limited } = checkRateLimit("image-studio", ip, RATE_LIMIT, RATE_WINDOW_MS);

  if (limited) {
    addLog({
      timestamp: new Date().toISOString(), ip, tool: "image-studio",
      prompt: "", response: "", responseTimeMs: 0, status: "blocked", error: "Rate limited",
    });
    return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 });
  }

  // Verify SD is reachable
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

  const action = body.action as string;
  const startTime = Date.now();

  try {
    let result: NextResponse;

    switch (action) {
      case "upscale":
        result = await handleUpscale(body);
        break;
      case "restyle":
        result = await handleRestyle(body);
        break;
      case "inpaint":
        result = await handleInpaint(body);
        break;
      case "caption":
        result = await handleCaption(body);
        break;
      default:
        return NextResponse.json({ error: "Invalid action. Use: upscale, restyle, inpaint, caption" }, { status: 400 });
    }

    addLog({
      timestamp: new Date().toISOString(), ip, tool: "image-studio",
      prompt: `${action}: ${(body.prompt as string || "").slice(0, 200)}`,
      response: `Action: ${action}`,
      responseTimeMs: Date.now() - startTime,
      status: "success",
    });

    return result;
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    addLog({
      timestamp: new Date().toISOString(), ip, tool: "image-studio",
      prompt: `${action}`, response: "", responseTimeMs: Date.now() - startTime,
      status: "error", error: errMsg,
    });

    if (err instanceof DOMException && (err.name === "AbortError" || err.name === "TimeoutError")) {
      return NextResponse.json({ error: "Request timed out — try a smaller image or fewer steps" }, { status: 504 });
    }
    return NextResponse.json({ error: "Lost connection to Stable Diffusion" }, { status: 502 });
  }
}

// ─── GET upscalers list ──────────────────────────────────────────────

export async function GET() {
  try {
    const res = await fetch(`${SD_URL}/sdapi/v1/upscalers`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error();
    const upscalers = await res.json();
    const names = upscalers.map((u: { name: string }) => u.name).filter((n: string) => n !== "None");
    return NextResponse.json({ upscalers: names });
  } catch {
    return NextResponse.json({ upscalers: ["R-ESRGAN 4x+", "R-ESRGAN 4x+ Anime6B", "ESRGAN_4x", "SwinIR 4x", "Lanczos"] });
  }
}
