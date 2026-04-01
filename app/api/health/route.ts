import { NextResponse } from "next/server";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const startedAt = new Date().toISOString();

export async function GET() {
  let ollamaStatus = "unknown";

  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(3000) });
    ollamaStatus = res.ok ? "connected" : "error";
  } catch {
    ollamaStatus = "unreachable";
  }

  return NextResponse.json({
    status: "ok",
    startedAt,
    uptime: process.uptime(),
    ollama: ollamaStatus,
    timestamp: new Date().toISOString(),
  });
}
