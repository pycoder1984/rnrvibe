import { NextRequest, NextResponse } from "next/server";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";
import {
  listOllamaModels,
  isOpenRouterConfigured,
  FREE_MODELS,
  DEFAULT_OLLAMA_MODEL,
} from "@/lib/llm-provider";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const { limited } = checkRateLimit("models", ip, 30, 60_000);
  if (limited) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const ollamaModels = await listOllamaModels();

  return NextResponse.json({
    ollama: {
      available: ollamaModels.length > 0,
      models: ollamaModels,
      default: DEFAULT_OLLAMA_MODEL,
    },
    openrouter: {
      available: isOpenRouterConfigured(),
      models: FREE_MODELS,
    },
  });
}
