export const metadata = {
  title: "Bug Fixer — Free AI Debugging Tool | RnR Vibe",
  description: "Paste broken code and error messages to get instant AI-powered fixes with explanations. Free, no sign-up required.",
  alternates: { canonical: "https://www.rnrvibe.com/tools/bug-fixer" },
  openGraph: {
    title: "Bug Fixer — RnR Vibe",
    description: "Fix broken code instantly with AI. Free, no sign-up.",
    images: ["/api/og?title=Bug%20Fixer&type=article"],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Bug Fixer — RnR Vibe",
    description: "Fix broken code instantly with AI. Free, no sign-up.",
    images: ["/api/og?title=Bug%20Fixer&type=article"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
