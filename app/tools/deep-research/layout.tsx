import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Deep Research — Free AI Research Assistant | RnR Vibe",
  description:
    "Ask a question, get a cited answer. Free AI research tool that plans sub-queries, searches DuckDuckGo, Wikipedia and arXiv, reads the pages, and synthesizes a sourced summary. No sign-up, no API keys.",
  keywords: [
    "AI research tool",
    "free deep research",
    "AI search assistant",
    "cited AI answers",
    "AI web search",
    "local AI research",
    "open source research assistant",
    "vibecoding",
  ],
  alternates: { canonical: "https://www.rnrvibe.com/tools/deep-research" },
  openGraph: {
    title: "Deep Research — Free AI Research Assistant",
    description:
      "Plans sub-queries, searches the web, reads sources, and synthesizes a cited answer. Free, no sign-up.",
    images: ["/api/og?title=Deep%20Research&type=article"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Deep Research — Free AI Research Assistant",
    description:
      "Plans sub-queries, searches the web, reads sources, and synthesizes a cited answer. Free, no sign-up.",
    images: ["/api/og?title=Deep%20Research&type=article"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
