import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "AI Image Studio — Upscale, Restyle, Inpaint & Caption",
  description: "Upload images and enhance them with AI — upscale with ESRGAN, restyle with img2img, inpaint regions, or generate captions. Powered by local Stable Diffusion.",
  alternates: { canonical: "https://www.rnrvibe.com/tools/image-studio" },
  openGraph: {
    title: "AI Image Studio — Upscale, Restyle, Inpaint & Caption",
    description: "Upload images and enhance them with AI — upscale, restyle, inpaint, or generate captions. Powered by local Stable Diffusion.",
    images: ["/api/og?title=AI%20Image%20Studio&type=article"],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "AI Image Studio — RnR Vibe",
    description: "Upload images and enhance them with AI — upscale, restyle, inpaint, or generate captions.",
    images: ["/api/og?title=AI%20Image%20Studio&type=article"],
  },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
