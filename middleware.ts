import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Block external access to dashboard
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/api/dashboard")) {
    const host = req.headers.get("host") || "";
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "";

    const isLocal =
      host.startsWith("localhost") ||
      host.startsWith("127.0.0.1") ||
      ip === "127.0.0.1" ||
      ip === "::1" ||
      ip === "";

    if (!isLocal) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/dashboard/:path*"],
};
