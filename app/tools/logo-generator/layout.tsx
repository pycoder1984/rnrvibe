import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "AI Logo Generator — Free Logo Design Tool",
  description: "Describe your brand and get professional logo concepts in seconds. Powered by local AI — no cloud, no cost, no watermarks.",
  alternates: { canonical: "https://www.rnrvibe.com/tools/logo-generator" },
  openGraph: {
    title: "AI Logo Generator — Free Logo Design Tool",
    description: "Describe your brand and get professional logo concepts in seconds. Powered by local AI.",
    images: ["/api/og?title=AI%20Logo%20Generator&type=article"],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "AI Logo Generator — RnR Vibe",
    description: "Describe your brand and get professional logo concepts in seconds.",
    images: ["/api/og?title=AI%20Logo%20Generator&type=article"],
  },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
