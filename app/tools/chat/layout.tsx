import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "AI Chat — Free Vibecoding Assistant",
  description: "Chat with a free AI assistant about vibecoding, prompts, debugging, and project planning. Powered by a local LLM — no sign-up required.",
  alternates: { canonical: "https://www.rnrvibe.com/tools/chat" },
  openGraph: {
    title: "AI Chat — Free Vibecoding Assistant",
    description: "Chat with a free AI assistant about vibecoding, prompts, debugging, and project planning.",
    images: ["/api/og?title=AI%20Chat&type=article"],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Chat — Free Vibecoding Assistant",
    description: "Chat with a free AI assistant about vibecoding, prompts, debugging, and project planning.",
    images: ["/api/og?title=AI%20Chat&type=article"],
  },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
