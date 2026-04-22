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

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is the cron builder free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The Cron Expression Builder is free to use, with no account required and no usage limits.",
      },
    },
    {
      "@type": "Question",
      name: "What cron syntax does it support?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "It generates standard 5-field Unix cron expressions (minute, hour, day-of-month, month, day-of-week) by default. It can also produce 6-field expressions with seconds for schedulers like Quartz, node-cron, or cronexp — just ask for the target runtime.",
      },
    },
    {
      "@type": "Question",
      name: "Does it explain existing cron expressions?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Paste any cron expression and ask for a plain-English explanation; the tool will describe the schedule, next fire times, and any unusual patterns.",
      },
    },
    {
      "@type": "Question",
      name: "What schedulers is this compatible with?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Output works with Linux crontab, GitHub Actions, GitLab CI schedules, Kubernetes CronJobs, node-cron, Laravel Scheduler, Quartz (Java), and any scheduler accepting standard cron syntax.",
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
