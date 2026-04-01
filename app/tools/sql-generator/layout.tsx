export const metadata = {
  title: "SQL Generator — Free AI Tool | RnR Vibe",
  description: "Describe your data needs in plain English and get SQL queries with schema suggestions. Supports PostgreSQL, MySQL, and SQLite. Free, no sign-up.",
  alternates: { canonical: "https://www.rnrvibe.com/tools/sql-generator" },
  openGraph: {
    title: "SQL Generator — RnR Vibe",
    description: "Generate SQL queries from plain English with AI. Free, no sign-up.",
    images: ["/api/og?title=SQL%20Generator&type=article"],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "SQL Generator — RnR Vibe",
    description: "Generate SQL queries from plain English with AI. Free, no sign-up.",
    images: ["/api/og?title=SQL%20Generator&type=article"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
