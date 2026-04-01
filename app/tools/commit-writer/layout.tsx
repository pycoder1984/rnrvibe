export const metadata = {
  title: "Commit Message Writer — Free AI Tool | RnR Vibe",
  description: "Describe your code changes or paste a diff and get a proper conventional commit message. Free, no sign-up required.",
  alternates: { canonical: "https://www.rnrvibe.com/tools/commit-writer" },
  openGraph: {
    title: "Commit Message Writer — RnR Vibe",
    description: "Write perfect commit messages with AI. Free, no sign-up.",
    images: ["/api/og?title=Commit%20Message%20Writer&type=article"],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Commit Message Writer — RnR Vibe",
    description: "Write perfect commit messages with AI. Free, no sign-up.",
    images: ["/api/og?title=Commit%20Message%20Writer&type=article"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
