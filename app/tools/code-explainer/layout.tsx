import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Code Explainer — Understand Any Code with AI",
  description: "Paste any code snippet and get a plain-English explanation. Perfect for learning from AI-generated code. Free vibecoding tool.",
  alternates: { canonical: "https://www.rnrvibe.com/tools/code-explainer" },
  openGraph: {
    title: "Code Explainer — Understand Any Code with AI",
    description: "Paste any code snippet and get a plain-English explanation. Perfect for learning from AI-generated code.",
    images: ["/api/og?title=Code%20Explainer&type=article"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Code Explainer — Understand Any Code with AI",
    description: "Paste any code snippet and get a plain-English explanation. Perfect for learning from AI-generated code.",
    images: ["/api/og?title=Code%20Explainer&type=article"],
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is the Code Explainer free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The Code Explainer is free to use, with no sign-up, no subscription, and no API key required.",
      },
    },
    {
      "@type": "Question",
      name: "What programming languages can it explain?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Any language the underlying LLM recognizes — JavaScript, TypeScript, Python, Go, Rust, Java, C#, C++, PHP, Ruby, Swift, Kotlin, SQL, Bash, and more. The model detects the language from syntax, so you don't need to specify it.",
      },
    },
    {
      "@type": "Question",
      name: "Can it explain a specific section of a larger file?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Paste only the snippet you want explained. For best results, include just enough surrounding code that variable and function references are resolvable — the imports, the enclosing function signature, and any relevant type definitions.",
      },
    },
    {
      "@type": "Question",
      name: "Does it explain regex, SQL, or shell scripts?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The explainer works well on regex patterns, SQL queries, shell pipelines, and configuration DSLs (YAML, TOML, Dockerfile, nginx.conf). For complex regex, the dedicated Regex Generator tool provides a more structured token-by-token breakdown.",
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
