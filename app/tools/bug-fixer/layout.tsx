export const metadata = {
  title: "Bug Fixer — Free AI Debugging Tool | RnR Vibe",
  description: "Paste broken code and error messages to get instant AI-powered fixes with explanations. Free, no sign-up required.",
  alternates: { canonical: "https://www.rnrvibe.com/tools/bug-fixer" },
  openGraph: {
    title: "Bug Fixer — RnR Vibe",
    description: "Fix broken code instantly with AI. Free, no sign-up.",
    images: ["/api/og?title=Bug%20Fixer&type=article"],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Bug Fixer — RnR Vibe",
    description: "Fix broken code instantly with AI. Free, no sign-up.",
    images: ["/api/og?title=Bug%20Fixer&type=article"],
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is the bug fixer free to use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. RnR Vibe's Bug Fixer is completely free, with no sign-up, no subscription, and no API keys required. It runs on a local LLM hosted by RnR Vibe.",
      },
    },
    {
      "@type": "Question",
      name: "What languages does the AI bug fixer support?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The Bug Fixer works with any programming language the underlying model understands — JavaScript, TypeScript, Python, Go, Rust, Java, C#, PHP, Ruby, SQL, and more. Paste the broken code and the error message; the model picks up the language from the syntax.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need to share my API key or credentials?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. The Bug Fixer never asks for API keys, login, or payment. Your code is sent to the LLM for analysis and the response is streamed back to your browser.",
      },
    },
    {
      "@type": "Question",
      name: "How should I format my input?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Paste the broken code and then paste the full error message or stack trace below it. Including the exact error text dramatically improves fix quality over describing the symptom in prose.",
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
