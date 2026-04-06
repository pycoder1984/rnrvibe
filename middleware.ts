import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

const ALLOWED_ORIGINS = [
  "https://www.rnrvibe.com",
  "https://rnrvibe.com",
  "http://localhost:4000",
  "http://localhost:3000",
];

function getCorsOrigin(request: NextRequest): string | null {
  const origin = request.headers.get("origin");
  if (origin && ALLOWED_ORIGINS.includes(origin)) return origin;
  return null;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Block external access to dashboard — only allow true localhost
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/api/dashboard")) {
    const host = req.headers.get("host") || "";
    const cfIp = req.headers.get("cf-connecting-ip");

    // If cf-connecting-ip is present, the request came through Cloudflare (external)
    if (cfIp) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Only allow localhost host header
    const isLocal =
      host.startsWith("localhost") || host.startsWith("127.0.0.1");

    if (!isLocal) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  // CORS for API routes
  if (pathname.startsWith("/api/")) {
    const allowedOrigin = getCorsOrigin(req);

    // Handle preflight OPTIONS
    if (req.method === "OPTIONS") {
      if (!allowedOrigin) {
        return new NextResponse(null, { status: 403 });
      }
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": allowedOrigin,
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // Add CORS headers to actual response only if origin is allowed
    const response = NextResponse.next();
    if (allowedOrigin) {
      response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type");
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
