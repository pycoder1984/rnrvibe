export const metadata = {
  title: "Component Generator — Free AI Tool | RnR Vibe",
  description: "Describe a UI component and get clean React + Tailwind CSS code ready to paste. Responsive and accessible by default. Free, no sign-up.",
  alternates: { canonical: "https://www.rnrvibe.com/tools/component-generator" },
  openGraph: {
    title: "Component Generator — RnR Vibe",
    description: "Generate React UI components with AI. Free, no sign-up.",
    images: ["/api/og?title=Component%20Generator&type=article"],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Component Generator — RnR Vibe",
    description: "Generate React UI components with AI. Free, no sign-up.",
    images: ["/api/og?title=Component%20Generator&type=article"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
