export const metadata = {
  title: "CSS to Tailwind Converter — Free AI Tool | RnR Vibe",
  description: "Paste vanilla CSS and get the equivalent Tailwind CSS classes with responsive variants. Free, no sign-up required.",
  alternates: { canonical: "https://www.rnrvibe.com/tools/css-to-tailwind" },
  openGraph: {
    title: "CSS to Tailwind Converter — RnR Vibe",
    description: "Convert CSS to Tailwind classes with AI. Free, no sign-up.",
    images: ["/api/og?title=CSS%20to%20Tailwind&type=article"],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "CSS to Tailwind Converter — RnR Vibe",
    description: "Convert CSS to Tailwind classes with AI. Free, no sign-up.",
    images: ["/api/og?title=CSS%20to%20Tailwind&type=article"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
