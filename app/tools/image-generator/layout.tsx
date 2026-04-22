import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Image Generator — Free Stable Diffusion Tool | RnR Vibe",
  description:
    "Generate images from text prompts with Stable Diffusion. Free AI image generation — no account, no watermark, no usage limits. Runs on a local GPU via AUTOMATIC1111.",
  keywords: [
    "AI image generator",
    "free image generator",
    "Stable Diffusion online",
    "AUTOMATIC1111",
    "text to image AI",
    "free AI art",
    "local AI image",
    "vibecoding",
  ],
  alternates: { canonical: "https://www.rnrvibe.com/tools/image-generator" },
  openGraph: {
    title: "AI Image Generator — Free Stable Diffusion Tool",
    description:
      "Generate images from text prompts with Stable Diffusion. Free, no account, no watermark.",
    images: ["/api/og?title=AI%20Image%20Generator&type=article"],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Image Generator — Free Stable Diffusion Tool",
    description:
      "Generate images from text prompts with Stable Diffusion. Free, no account, no watermark.",
    images: ["/api/og?title=AI%20Image%20Generator&type=article"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
