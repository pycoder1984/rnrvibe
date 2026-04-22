import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Chat — Free Vibecoding Assistant",
  description: "Chat with a free AI assistant about vibecoding, prompts, debugging, and project planning. Powered by a local LLM — no sign-up required.",
  alternates: { canonical: "https://www.rnrvibe.com/tools/chat" },
  openGraph: {
    title: "AI Chat — Free Vibecoding Assistant",
    description: "Chat with a free AI assistant about vibecoding, prompts, debugging, and project planning.",
    images: ["/api/og?title=AI%20Chat&type=article"],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Chat — Free Vibecoding Assistant",
    description: "Chat with a free AI assistant about vibecoding, prompts, debugging, and project planning.",
    images: ["/api/og?title=AI%20Chat&type=article"],
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is the AI Chat free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The AI Chat is free, with no sign-up, no subscription, and no API keys required. It runs on a local LLM hosted by RnR Vibe with an automatic cloud fallback.",
      },
    },
    {
      "@type": "Question",
      name: "Which model powers the chat?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "By default it runs a local Ollama-hosted model (Gemma 3 / Gemma 3n class) on the RnR Vibe host machine. When the local machine is offline, requests transparently fall back to a free OpenRouter model so the chat stays available.",
      },
    },
    {
      "@type": "Question",
      name: "Is my conversation stored?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Conversations are not persisted to a database. Requests are logged (prompt hash, timestamp, IP) for abuse prevention and rate limiting, and are rotated out. The chat UI keeps history only in your browser tab.",
      },
    },
    {
      "@type": "Question",
      name: "What is this chat best at?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Vibecoding workflows: drafting prompts, explaining errors, brainstorming feature ideas, planning small projects, and reviewing short code snippets. For long-context refactors or multi-file edits, a dedicated IDE agent will outperform this chat.",
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
