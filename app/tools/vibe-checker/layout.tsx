import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Vibe Checker — Free AI Code Review Tool",
  description: "Paste AI-generated code and get an instant review for bugs, security issues, and improvements. Free vibecoding code review powered by AI.",
  alternates: { canonical: "https://www.rnrvibe.com/tools/vibe-checker" },
  openGraph: {
    title: "Vibe Checker — Free AI Code Review Tool",
    description: "Paste AI-generated code and get an instant review for bugs, security issues, and improvements.",
    images: ["/api/og?title=Vibe%20Checker&type=article"],
  },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
