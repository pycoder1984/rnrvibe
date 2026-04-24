import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ControlNet Image Generator — Pose, Depth, Edges | RnR Vibe",
  description:
    "Guide Stable Diffusion with a reference image. Transfer body pose, preserve scene depth, or match edges exactly. Free local AI, no account, no watermark.",
  keywords: [
    "ControlNet",
    "Stable Diffusion ControlNet",
    "pose transfer AI",
    "depth to image",
    "canny edge to image",
    "openpose",
    "free AI image generator",
    "reference image AI",
  ],
  alternates: { canonical: "https://www.rnrvibe.com/tools/controlnet" },
  openGraph: {
    title: "ControlNet Image Generator — Pose, Depth, Edges",
    description:
      "Guide Stable Diffusion with a reference image. Pose transfer, depth-preserving restyles, and edge-matched compositions.",
    images: ["/api/og?title=ControlNet&type=article"],
  },
  twitter: {
    card: "summary_large_image",
    title: "ControlNet Image Generator — Pose, Depth, Edges",
    description:
      "Guide Stable Diffusion with a reference image. Pose transfer, depth-preserving restyles, and edge-matched compositions.",
    images: ["/api/og?title=ControlNet&type=article"],
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is ControlNet?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ControlNet is a Stable Diffusion add-on that lets a reference image constrain the output. The prompt decides what things look like; ControlNet decides where they go. Common uses: transferring a body pose from a photo, keeping a scene's 3D layout while changing its style, or matching the exact outline of a sketch.",
      },
    },
    {
      "@type": "Question",
      name: "What is the difference between pose, depth, and canny?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Pose (OpenPose) extracts a stick-figure skeleton and guides the generation to match it — great for portraits and character art. Depth (MiDaS) estimates a 3D depth map — best for landscapes, interiors, and preserving composition. Canny extracts a line drawing of the reference's edges and the output matches those edges exactly — the sharpest form of control, good for product shots and architectural reinterpretation.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need a GPU to use this?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "RnR Vibe runs Stable Diffusion and ControlNet on the host machine's GPU (AUTOMATIC1111 WebUI via Cloudflare Tunnel). You only need a browser — no local install, no API key.",
      },
    },
    {
      "@type": "Question",
      name: "What is Control Strength?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A weight between 0 and 2 that controls how strictly the generation follows the reference. 1.0 is balanced. Below 1.0 the prompt has more freedom (looser pose / softer depth adherence). Above 1.0 the reference dominates, which is useful when the prompt keeps winning — but can produce artifacts at very high values.",
      },
    },
    {
      "@type": "Question",
      name: "Why does generation take longer than the plain image generator?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ControlNet runs two passes on the GPU: first the preprocessor (extracting the skeleton / depth map / edges from your reference), then the main SD generation with that conditioning layered in. Expect roughly 1.5–2x the time of a plain txt2img.",
      },
    },
  ],
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      {children}
    </>
  );
}
