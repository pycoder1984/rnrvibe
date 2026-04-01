import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Prompt Library — Ready-Made Vibecoding Prompts",
  description: "Browse and copy ready-made AI coding prompts for landing pages, APIs, auth systems, and more. Free prompt templates for vibecoding.",
  alternates: { canonical: "https://www.rnrvibe.com/tools/prompt-library" },
  openGraph: {
    title: "Prompt Library — Ready-Made Vibecoding Prompts",
    description: "Browse and copy ready-made AI coding prompts for landing pages, APIs, auth systems, and more.",
    images: ["/api/og?title=Prompt%20Library&type=article"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prompt Library — Ready-Made Vibecoding Prompts",
    description: "Browse and copy ready-made AI coding prompts for landing pages, APIs, auth systems, and more.",
    images: ["/api/og?title=Prompt%20Library&type=article"],
  },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
