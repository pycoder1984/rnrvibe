import { NextRequest, NextResponse } from "next/server";
import { getLogs, getStats, clearLogs } from "@/lib/request-log";

function isLocal(req: NextRequest): boolean {
  // If cf-connecting-ip exists, request came through Cloudflare (external)
  if (req.headers.get("cf-connecting-ip")) return false;

  const host = req.headers.get("host") || "";
  return host.startsWith("localhost") || host.startsWith("127.0.0.1");
}

export async function GET(req: NextRequest) {
  if (!isLocal(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);
  const offset = parseInt(searchParams.get("offset") || "0");

  return NextResponse.json({
    stats: getStats(),
    logs: getLogs(limit, offset),
  });
}

export async function DELETE(req: NextRequest) {
  if (!isLocal(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  clearLogs();
  return NextResponse.json({ success: true });
}
