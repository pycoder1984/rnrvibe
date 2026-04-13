import { NextRequest, NextResponse } from "next/server";
import { addLog } from "@/lib/request-log";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";
import { generate } from "@/lib/llm-provider";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SD_URL = process.env.SD_URL || "http://127.0.0.1:7860";

const LLM_TIMEOUT_MS = 60_000;
const SD_TIMEOUT_MS = 5 * 60 * 1000;
const TOTAL_TIMEOUT_MS = 15 * 60 * 1000;

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 5 * 60 * 1000;

// Simple hex to color name lookup
const COLOR_NAMES: Record<string, string> = {
  "#000000": "black", "#ffffff": "white", "#ff0000": "red", "#00ff00": "green",
  "#0000ff": "blue", "#ffff00": "yellow", "#ff00ff": "magenta", "#00ffff": "cyan",
  "#6366f1": "indigo purple", "#8b5cf6": "violet purple", "#a855f7": "purple",
  "#ec4899": "pink", "#ef4444": "red", "#f97316": "orange", "#eab308": "yellow",
  "#22c55e": "green", "#10b981": "emerald green", "#14b8a6": "teal",
  "#06b6d4": "cyan", "#3b82f6": "blue", "#1d4ed8": "dark blue",
  "#7c3aed": "violet", "#db2777": "deep pink", "#f59e0b": "amber",
  "#84cc16": "lime green", "#64748b": "slate gray", "#78716c": "stone gray",
};

function hexToColorName(hex: string): string {
  const lower = hex.toLowerCase();
  if (COLOR_NAMES[lower]) return COLOR_NAMES[lower];

  // Parse RGB and approximate
  const r = parseInt(lower.slice(1, 3), 16);
  const g = parseInt(lower.slice(3, 5), 16);
  const b = parseInt(lower.slice(5, 7), 16);

  const hue = Math.atan2(Math.sqrt(3) * (g - b), 2 * r - g - b) * (180 / Math.PI);
  const h = hue < 0 ? hue + 360 : hue;
  const lightness = (Math.max(r, g, b) + Math.min(r, g, b)) / 2 / 255;
  const saturation = Math.max(r, g, b) === Math.min(r, g, b) ? 0 :
    lightness > 0.5
      ? (Math.max(r, g, b) - Math.min(r, g, b)) / (510 - Math.max(r, g, b) - Math.min(r, g, b))
      : (Math.max(r, g, b) - Math.min(r, g, b)) / (Math.max(r, g, b) + Math.min(r, g, b));

  if (saturation < 0.1) {
    if (lightness < 0.2) return "black";
    if (lightness > 0.8) return "white";
    return "gray";
  }

  const prefix = lightness < 0.3 ? "dark " : lightness > 0.7 ? "light " : "";
  if (h < 15 || h >= 345) return prefix + "red";
  if (h < 45) return prefix + "orange";
  if (h < 75) return prefix + "yellow";
  if (h < 150) return prefix + "green";
  if (h < 195) return prefix + "teal";
  if (h < 255) return prefix + "blue";
  if (h < 285) return prefix + "purple";
  if (h < 345) return prefix + "pink";
  return prefix + "red";
}

interface LogoPrompt {
  style: string;
  prompt: string;
  negativePrompt: string;
}

const STYLE_KEYWORDS: Record<string, string> = {
  minimalist: "minimal, simple shapes, flat design, single icon, whitespace, modern",
  geometric: "geometric shapes, abstract, polygonal, symmetrical, mathematical",
  wordmark: "typographic, lettermark, monogram, letter-based icon, clean typography",
  mascot: "character design, friendly mascot, illustration style, cartoon, brand character",
  vintage: "retro, classic, badge style, emblem, stamp, traditional",
  gradient: "gradient colors, modern gradient, vibrant, colorful, smooth transitions",
};

async function generatePromptsWithLLM(
  brandName: string,
  industry: string,
  description: string,
  colors: string[],
  styles: string[],
  background: string
): Promise<LogoPrompt[]> {
  const colorNames = colors.map((c) => hexToColorName(c)).join(", ");
  const styleList = styles.map((s) => `- ${s}: "${STYLE_KEYWORDS[s] || s}"`).join("\n");

  const systemPrompt = `You are an expert logo designer and Stable Diffusion prompt engineer. Given a brand description, generate exactly ${styles.length} Stable Diffusion prompts for different logo styles.

Rules:
- Each prompt must include: "logo design, vector style, clean lines, professional"
- Include the brand's color palette as color keywords: ${colorNames}
- Include style-specific keywords (see below)
- Keep prompts under 200 tokens each
- Do NOT include the brand name as text in the prompt (SD can't render text well)
- Focus on iconography and symbols that represent the brand
${background === "transparent" ? '- Append "white background, solid white background" to each prompt' : ""}
- Output valid JSON array of objects: [{ "style": "...", "prompt": "...", "negativePrompt": "..." }]

Style keywords:
${styleList}

The base negative prompt should include: "photo, realistic, photograph, blurry, low quality, text, watermark, signature, human face, complex background, noisy, pixelated, 3d render"
${background === "transparent" ? 'Also add "colored background, gradient background" to negative prompts.' : ""}`;

  const userPrompt = `Brand: ${brandName}
Industry: ${industry}
Description: ${description}
Colors: ${colorNames}
Styles to generate: ${styles.join(", ")}
Generate the ${styles.length} SD prompts now as a JSON array.`;

  const { text: raw } = await generate({
    prompt: userPrompt,
    system: systemPrompt,
    signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
  });

  // Try JSON.parse, fallback to regex extraction
  let prompts: LogoPrompt[];
  try {
    const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    prompts = JSON.parse(cleaned);
  } catch {
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("Failed to parse prompts from AI response");
    prompts = JSON.parse(match[0]);
  }

  if (!Array.isArray(prompts) || prompts.length === 0) {
    throw new Error("AI returned empty prompts array");
  }

  return prompts.slice(0, styles.length);
}

async function generateLogoImage(
  prompt: string,
  negativePrompt: string
): Promise<{ image: string; seed: number } | { error: string }> {
  try {
    const res = await fetch(`${SD_URL}/sdapi/v1/txt2img`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        negative_prompt: negativePrompt,
        width: 512,
        height: 512,
        steps: 30,
        cfg_scale: 9,
        seed: -1,
        sampler_name: "DPM++ 2M",
        scheduler: "Karras",
        batch_size: 1,
        n_iter: 1,
      }),
      signal: AbortSignal.timeout(SD_TIMEOUT_MS),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "Unknown error");
      return { error: `Generation failed (${res.status}): ${text.slice(0, 200)}` };
    }

    const data = await res.json();
    if (!data.images || data.images.length === 0) {
      return { error: "No image returned from Stable Diffusion" };
    }

    let seed = -1;
    try { seed = JSON.parse(data.info).seed; } catch { /* ignore */ }

    return { image: data.images[0], seed };
  } catch (err) {
    if (err instanceof DOMException && (err.name === "AbortError" || err.name === "TimeoutError")) {
      return { error: "Generation timed out" };
    }
    return { error: "Lost connection to Stable Diffusion" };
  }
}


export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { limited } = checkRateLimit("logo-gen", ip, RATE_LIMIT, RATE_WINDOW_MS);

  if (limited) {
    addLog({
      timestamp: new Date().toISOString(), ip, tool: "logo-generator",
      prompt: "", response: "", responseTimeMs: 0, status: "blocked",
      error: "Rate limited",
    });
    return NextResponse.json(
      { error: "Too many logo requests. Please wait a few minutes." },
      { status: 429 }
    );
  }

  let body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    brandName,
    industry = "",
    description,
    colors = [],
    styles = ["minimalist"],
    background = "white",
  } = body;

  if (!brandName || typeof brandName !== "string" || brandName.length > 50) {
    return NextResponse.json({ error: "Brand name is required (max 50 characters)" }, { status: 400 });
  }
  if (!description || typeof description !== "string" || description.length > 500) {
    return NextResponse.json({ error: "Description is required (max 500 characters)" }, { status: 400 });
  }
  if (!Array.isArray(styles) || styles.length === 0 || styles.length > 4) {
    return NextResponse.json({ error: "Select 1-4 styles" }, { status: 400 });
  }

  // Verify SD is reachable
  try {
    const ping = await fetch(`${SD_URL}/sdapi/v1/progress`, { signal: AbortSignal.timeout(5000) });
    if (!ping.ok) throw new Error();
  } catch {
    return NextResponse.json(
      { error: "Stable Diffusion is not running. Start it with --api flag." },
      { status: 502 }
    );
  }

  const totalAbort = new AbortController();
  const totalTimeout = setTimeout(() => totalAbort.abort(), TOTAL_TIMEOUT_MS);
  const requestStartTime = Date.now();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // Phase 1: Generate prompts with Ollama
        send("status", { message: "Generating logo prompts with AI...", phase: "prompts" });

        let prompts: LogoPrompt[];
        try {
          prompts = await generatePromptsWithLLM(brandName, industry, description, colors, styles, background);
        } catch (err) {
          send("error", { index: -1, style: "", error: `Failed to generate prompts: ${err instanceof Error ? err.message : "Unknown error"}` });
          addLog({
            timestamp: new Date().toISOString(), ip, tool: "logo-generator",
            prompt: `${brandName}: ${description}`.slice(0, 500), response: "",
            responseTimeMs: Date.now() - requestStartTime, status: "error",
            error: "Ollama prompt generation failed",
          });
          send("done", { message: "Generation failed" });
          return;
        }

        // Send prompts to frontend for preview
        send("prompts", { prompts });

        // Phase 2: Generate images with SD
        for (let i = 0; i < prompts.length; i++) {
          if (totalAbort.signal.aborted) {
            send("error", { index: i, style: prompts[i].style, error: "Total timeout exceeded" });
            break;
          }

          const p = prompts[i];
          send("progress", {
            index: i,
            style: p.style,
            phase: "generating",
            message: `Generating ${p.style} logo...`,
          });

          const result = await generateLogoImage(p.prompt, p.negativePrompt);

          if ("error" in result) {
            send("error", { index: i, style: p.style, error: result.error });
            addLog({
              timestamp: new Date().toISOString(), ip, tool: "logo-generator",
              prompt: p.prompt.slice(0, 500), response: `Style: ${p.style}`,
              responseTimeMs: Date.now() - requestStartTime, status: "error",
              error: result.error,
            });
          } else {
            send("image", {
              index: i,
              style: p.style,
              image: result.image,
              seed: result.seed,
              prompt: p.prompt,
            });
            addLog({
              timestamp: new Date().toISOString(), ip, tool: "logo-generator",
              prompt: p.prompt.slice(0, 500),
              response: `Style: ${p.style}, Seed: ${result.seed}`,
              responseTimeMs: Date.now() - requestStartTime, status: "success",
            });
          }
        }

        send("done", { message: "All logo generations complete" });
      } catch (err) {
        send("error", {
          index: -1, style: "",
          error: err instanceof Error ? err.message : "Unexpected error",
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
