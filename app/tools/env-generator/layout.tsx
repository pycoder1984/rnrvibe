export const metadata = {
  title: "Environment Variable Generator — Free AI Tool | RnR Vibe",
  description: "Describe your project stack and get a comprehensive .env.example file with all required variables and setup instructions. Free, no sign-up.",
  alternates: { canonical: "https://www.rnrvibe.com/tools/env-generator" },
  openGraph: {
    title: "Environment Variable Generator — RnR Vibe",
    description: "Generate .env files for any tech stack with AI. Free, no sign-up.",
    images: ["/api/og?title=Env%20Variable%20Generator&type=article"],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Environment Variable Generator — RnR Vibe",
    description: "Generate .env files for any tech stack with AI. Free, no sign-up.",
    images: ["/api/og?title=Env%20Variable%20Generator&type=article"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
