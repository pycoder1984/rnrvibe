export const metadata = {
  title: "Cron Expression Builder — Free AI Tool | RnR Vibe",
  description: "Describe a schedule in plain English and get the cron expression with usage examples for Node.js, Linux, and GitHub Actions. Free, no sign-up.",
  alternates: { canonical: "https://www.rnrvibe.com/tools/cron-builder" },
  openGraph: {
    title: "Cron Expression Builder — RnR Vibe",
    description: "Build cron expressions from plain English. Free, no sign-up.",
    images: ["/api/og?title=Cron%20Expression%20Builder&type=article"],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Cron Expression Builder — RnR Vibe",
    description: "Build cron expressions from plain English. Free, no sign-up.",
    images: ["/api/og?title=Cron%20Expression%20Builder&type=article"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
