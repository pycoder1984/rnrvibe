export const metadata = {
  title: "API Endpoint Generator — Free AI Tool | RnR Vibe",
  description: "Generate production-ready API route handlers with validation and error handling. Supports Next.js, Express, and FastAPI. Free, no sign-up.",
  alternates: { canonical: "https://www.rnrvibe.com/tools/api-endpoint" },
  openGraph: {
    title: "API Endpoint Generator — RnR Vibe",
    description: "Generate production-ready API endpoints with AI. Free, no sign-up.",
    images: ["/api/og?title=API%20Endpoint%20Generator&type=article"],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "API Endpoint Generator — RnR Vibe",
    description: "Generate production-ready API endpoints with AI. Free, no sign-up.",
    images: ["/api/og?title=API%20Endpoint%20Generator&type=article"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
