export const metadata = {
  title: "JSON Schema Generator — Free AI Tool | RnR Vibe",
  description: "Describe your data structure and get a JSON Schema with validation rules, types, and examples. Free, no sign-up required.",
  alternates: { canonical: "https://www.rnrvibe.com/tools/schema-validator" },
  openGraph: {
    title: "JSON Schema Generator — RnR Vibe",
    description: "Generate JSON Schema from descriptions with AI. Free, no sign-up.",
    images: ["/api/og?title=JSON%20Schema%20Generator&type=article"],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "JSON Schema Generator — RnR Vibe",
    description: "Generate JSON Schema from descriptions with AI. Free, no sign-up.",
    images: ["/api/og?title=JSON%20Schema%20Generator&type=article"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
