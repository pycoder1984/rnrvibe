import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

/**
 * Read the last N lines of one of the bat-file service logs.
 * Localhost-only. Files live on the user's Desktop by default.
 */

const DESKTOP_DIR = process.env.RNRVIBE_LOG_DIR || path.join(os.homedir(), "Desktop");

const LOG_FILES: Record<string, string> = {
  core: "rnrvibe-core.log",
  sd: "rnrvibe-sd.log",
  audio: "rnrvibe-audio.log",
};

const MAX_TAIL_LINES = 200;

function isLocal(req: NextRequest): boolean {
  if (req.headers.get("cf-connecting-ip")) return false;
  const host = req.headers.get("host") || "";
  return host.startsWith("localhost") || host.startsWith("127.0.0.1");
}

function tail(filePath: string, maxLines: number): { lines: string[]; size: number; mtime: string } | null {
  try {
    const stat = fs.statSync(filePath);
    const raw = fs.readFileSync(filePath, "utf-8");
    const all = raw.split(/\r?\n/);
    const lines = all.slice(-maxLines).filter((l, i, arr) => l !== "" || i !== arr.length - 1);
    return { lines, size: stat.size, mtime: stat.mtime.toISOString() };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  if (!isLocal(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const which = searchParams.get("log") || "";
  const lines = Math.min(parseInt(searchParams.get("lines") || "50", 10) || 50, MAX_TAIL_LINES);

  // Single log
  if (which && LOG_FILES[which]) {
    const filePath = path.join(DESKTOP_DIR, LOG_FILES[which]);
    const result = tail(filePath, lines);
    if (!result) {
      return NextResponse.json(
        { log: which, exists: false, path: filePath, message: "Log file not found yet. Start the service to create it." },
        { status: 200 }
      );
    }
    return NextResponse.json({ log: which, exists: true, path: filePath, ...result });
  }

  // All three, short tails
  const result: Record<string, unknown> = {};
  for (const [key, filename] of Object.entries(LOG_FILES)) {
    const filePath = path.join(DESKTOP_DIR, filename);
    const t = tail(filePath, lines);
    result[key] = t
      ? { exists: true, path: filePath, ...t }
      : { exists: false, path: filePath };
  }
  return NextResponse.json({ dir: DESKTOP_DIR, logs: result });
}
