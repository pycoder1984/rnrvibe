export const metadata = {
  title: "TypeScript Generator — Free AI Tool | RnR Vibe",
  description: "Describe your data and get TypeScript interfaces, types, and Zod schemas. Free AI-powered type generation, no sign-up required.",
  alternates: { canonical: "https://www.rnrvibe.com/tools/typescript-generator" },
  openGraph: {
    title: "TypeScript Generator — RnR Vibe",
    description: "Generate TypeScript types and Zod schemas with AI. Free, no sign-up.",
    images: ["/api/og?title=TypeScript%20Generator&type=article"],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "TypeScript Generator — RnR Vibe",
    description: "Generate TypeScript types and Zod schemas with AI. Free, no sign-up.",
    images: ["/api/og?title=TypeScript%20Generator&type=article"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
