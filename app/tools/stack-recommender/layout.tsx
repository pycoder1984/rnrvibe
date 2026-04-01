export const metadata = {
  title: "Tech Stack Recommender — Free AI Tool | RnR Vibe",
  description: "Describe your project idea and get detailed tech stack comparisons with pros, cons, and complexity ratings. Free, no sign-up required.",
  alternates: { canonical: "https://www.rnrvibe.com/tools/stack-recommender" },
  openGraph: {
    title: "Tech Stack Recommender — RnR Vibe",
    description: "Get AI-powered tech stack recommendations. Free, no sign-up.",
    images: ["/api/og?title=Tech%20Stack%20Recommender&type=article"],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Tech Stack Recommender — RnR Vibe",
    description: "Get AI-powered tech stack recommendations. Free, no sign-up.",
    images: ["/api/og?title=Tech%20Stack%20Recommender&type=article"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
