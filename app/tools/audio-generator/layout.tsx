import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Audio Generator — Free Music & Sound Effects | RnR Vibe",
  description:
    "Generate music and sound effects from text prompts. Free AI audio tool powered by MusicGen and AudioGen — no account, no subscription, no API keys.",
  keywords: [
    "AI music generator",
    "AI sound effects",
    "MusicGen",
    "AudioGen",
    "free AI audio",
    "text to music AI",
    "text to sound effects",
    "local AI audio",
    "vibecoding",
  ],
  alternates: { canonical: "https://www.rnrvibe.com/tools/audio-generator" },
  openGraph: {
    title: "AI Audio Generator — Free Music & Sound Effects",
    description:
      "Generate music and sound effects from text prompts. Powered by MusicGen and AudioGen.",
    images: ["/api/og?title=AI%20Audio%20Generator&type=article"],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Audio Generator — Free Music & Sound Effects",
    description:
      "Generate music and sound effects from text prompts. Powered by MusicGen and AudioGen.",
    images: ["/api/og?title=AI%20Audio%20Generator&type=article"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
