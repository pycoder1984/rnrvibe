import { NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  "https://www.rnrvibe.com",
  "https://rnrvibe.com",
  "http://localhost:4000",
  "http://localhost:3000",
];

export function corsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin =
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export function handleCorsOptions(request: Request): NextResponse | null {
  if (request.method === "OPTIONS") {
    const origin = request.headers.get("origin");
    return NextResponse.json(null, { status: 204, headers: corsHeaders(origin) });
  }
  return null;
}
