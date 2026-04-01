export const metadata = {
  title: "Docker Compose Generator — Free AI Tool | RnR Vibe",
  description: "Describe your services and get a production-ready docker-compose.yml with networking, volumes, and environment variables. Free, no sign-up.",
  alternates: { canonical: "https://www.rnrvibe.com/tools/docker-compose" },
  openGraph: {
    title: "Docker Compose Generator — RnR Vibe",
    description: "Generate docker-compose.yml files with AI. Free, no sign-up.",
    images: ["/api/og?title=Docker%20Compose%20Generator&type=article"],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Docker Compose Generator — RnR Vibe",
    description: "Generate docker-compose.yml files with AI. Free, no sign-up.",
    images: ["/api/og?title=Docker%20Compose%20Generator&type=article"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
