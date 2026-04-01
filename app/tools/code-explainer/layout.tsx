import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Code Explainer — Understand Any Code with AI",
  description: "Paste any code snippet and get a plain-English explanation. Perfect for learning from AI-generated code. Free vibecoding tool.",
  alternates: { canonical: "https://www.rnrvibe.com/tools/code-explainer" },
  openGraph: {
    title: "Code Explainer — Understand Any Code with AI",
    description: "Paste any code snippet and get a plain-English explanation. Perfect for learning from AI-generated code.",
    images: ["/api/og?title=Code%20Explainer&type=article"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Code Explainer — Understand Any Code with AI",
    description: "Paste any code snippet and get a plain-English explanation. Perfect for learning from AI-generated code.",
    images: ["/api/og?title=Code%20Explainer&type=article"],
  },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
