import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Regex Generator — Natural Language to Regex",
  description: "Describe what you want to match in plain English and get the regex pattern with examples. Free AI-powered regex tool for vibecoding.",
  alternates: { canonical: "https://www.rnrvibe.com/tools/regex-generator" },
  openGraph: {
    title: "Regex Generator — Natural Language to Regex",
    description: "Describe what you want to match in plain English and get the regex pattern with examples.",
    images: ["/api/og?title=Regex%20Generator&type=article"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Regex Generator — Natural Language to Regex",
    description: "Describe what you want to match in plain English and get the regex pattern with examples.",
    images: ["/api/og?title=Regex%20Generator&type=article"],
  },
};
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is this regex generator free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The Regex Generator is free, with no sign-up, no usage limits, and no API keys required.",
      },
    },
    {
      "@type": "Question",
      name: "What regex flavor does it generate?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "By default it produces JavaScript-compatible regex (PCRE-like). Ask for a specific dialect — Python, Go, Ruby, POSIX — and it will adapt escape rules and capture-group syntax accordingly.",
      },
    },
    {
      "@type": "Question",
      name: "Can it explain an existing regex?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Paste a regex and ask for an explanation; the model will walk through each token, anchor, and quantifier in plain English.",
      },
    },
    {
      "@type": "Question",
      name: "How accurate are the generated patterns?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Always test generated regex against real inputs. Models are reliable for common patterns (email, URL, date, numeric range) but can miss edge cases on complex multi-capture patterns. Use the provided examples as a starting test set.",
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
