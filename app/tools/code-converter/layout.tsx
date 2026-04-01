import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Code Converter — Translate Between 12 Languages",
  description: "Translate code between JavaScript, Python, Go, Rust, and 8 more languages. Free AI-powered code conversion tool with side-by-side view.",
  alternates: { canonical: "https://www.rnrvibe.com/tools/code-converter" },
  openGraph: {
    title: "Code Converter — Translate Between 12 Languages",
    description: "Translate code between JavaScript, Python, Go, Rust, and 8 more languages.",
    images: ["/api/og?title=Code%20Converter&type=article"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Code Converter — Translate Between 12 Languages",
    description: "Translate code between JavaScript, Python, Go, Rust, and 8 more languages.",
    images: ["/api/og?title=Code%20Converter&type=article"],
  },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
