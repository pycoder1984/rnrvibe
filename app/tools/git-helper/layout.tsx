export const metadata = {
  title: "Git Command Helper — Free AI Tool | RnR Vibe",
  description: "Describe what you want to do in plain English and get the exact Git commands with explanations and safety warnings. Free, no sign-up.",
  alternates: { canonical: "https://www.rnrvibe.com/tools/git-helper" },
  openGraph: {
    title: "Git Command Helper — RnR Vibe",
    description: "Get Git commands from plain English descriptions. Free, no sign-up.",
    images: ["/api/og?title=Git%20Command%20Helper&type=article"],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Git Command Helper — RnR Vibe",
    description: "Get Git commands from plain English descriptions. Free, no sign-up.",
    images: ["/api/og?title=Git%20Command%20Helper&type=article"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
