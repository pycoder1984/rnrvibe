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

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is this SQL generator free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The SQL Generator is completely free, with no sign-up, no subscription, and no API key required.",
      },
    },
    {
      "@type": "Question",
      name: "What SQL dialects are supported?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "PostgreSQL, MySQL, and SQLite are the default targets. Ask for SQL Server, Oracle, BigQuery, Snowflake, or DuckDB syntax and the tool will adapt functions, types, and quoting rules.",
      },
    },
    {
      "@type": "Question",
      name: "Can I paste my schema to get queries?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Paste your CREATE TABLE statements or a table description alongside your request; the generator will produce queries that match your actual column names and relationships instead of inventing plausible-sounding ones.",
      },
    },
    {
      "@type": "Question",
      name: "Does it handle JOINs, CTEs, and window functions?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The generator handles complex multi-table queries, common table expressions, window functions, aggregations, and subqueries. Always review generated SQL against your schema and test on representative data.",
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
