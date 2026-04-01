export const metadata = {
  title: "Test Generator — Free AI Tool | RnR Vibe",
  description: "Paste a function or component and get comprehensive unit tests for Jest, Vitest, pytest, or Mocha. Free, no sign-up required.",
  alternates: { canonical: "https://www.rnrvibe.com/tools/test-generator" },
  openGraph: {
    title: "Test Generator — RnR Vibe",
    description: "Generate unit tests with AI for any framework. Free, no sign-up.",
    images: ["/api/og?title=Test%20Generator&type=article"],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Test Generator — RnR Vibe",
    description: "Generate unit tests with AI for any framework. Free, no sign-up.",
    images: ["/api/og?title=Test%20Generator&type=article"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
