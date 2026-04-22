import BlogNav from "@/components/BlogNav";
import Link from "next/link";

export const metadata = {
  title: "FAQ — RnR Vibe",
  description: "Answers to common questions about RnR Vibe's free AI tools, vibecoding, Ollama fallback, privacy, and how to self-host the stack.",
  alternates: { canonical: "https://www.rnrvibe.com/faq" },
  openGraph: {
    title: "FAQ — RnR Vibe",
    description: "Answers to common questions about RnR Vibe's free AI tools and vibecoding platform.",
    images: ["/api/og?title=FAQ&type=article"],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "FAQ — RnR Vibe",
    description: "Answers to common questions about RnR Vibe's free AI tools and vibecoding platform.",
    images: ["/api/og?title=FAQ&type=article"],
  },
};

type QA = { q: string; a: string };

const faqs: QA[] = [
  {
    q: "Is RnR Vibe really free?",
    a: "Yes. Every AI tool on the site is free — no sign-up, no subscription, no API keys required. You can open the chat, bug fixer, image generator, or any other tool and use it immediately.",
  },
  {
    q: "What is vibecoding?",
    a: "Vibecoding is the practice of building software by describing what you want in natural language and letting an AI assistant handle the code. You focus on intent and iteration; the model fills in the implementation. RnR Vibe is designed around this workflow.",
  },
  {
    q: "Do I need to sign up to use the tools?",
    a: "No. There is no account system. Rate limiting is applied per-IP to prevent abuse, but nothing gates the tools behind a login or email.",
  },
  {
    q: "Which AI model powers the chat and code tools?",
    a: "Requests route through a local Ollama-hosted model (Gemma 3 / Gemma 3n class) on the RnR Vibe host machine. When the local machine is offline, requests transparently fall back to a free OpenRouter model so the tools stay available.",
  },
  {
    q: "What does image generation use?",
    a: "Image tools (Image Generator, Image Studio, Logo Generator) call a local Stable Diffusion WebUI (AUTOMATIC1111) running on the host machine. When the GPU service is offline, the tool shows a banner and lets you retry.",
  },
  {
    q: "Is my input stored or used for training?",
    a: "No. Your prompts are not persisted to a database and are not used to train any model. Request metadata (timestamp, IP, prompt hash) is logged for rate limiting and abuse prevention, and is rotated out.",
  },
  {
    q: "Can I use the tools offline or self-host them?",
    a: "The code is open on GitHub and the stack is designed to be self-hostable. You need Node.js, Ollama, and optionally AUTOMATIC1111 for image tools and the audio server for music/SFX. See the Guides section for setup walk-throughs.",
  },
  {
    q: "How does the Ollama → OpenRouter fallback work?",
    a: "A background health probe polls Ollama every 30 seconds. If it stops responding, the chat API routes new requests to OpenRouter instead. When Ollama comes back, the next successful probe flips the switch back. The swap is invisible to the user beyond a model-name difference in advanced debug output.",
  },
  {
    q: "Why do I sometimes see a 'Stable Diffusion is offline' banner?",
    a: "Image tools only run when the host machine is online and Stable Diffusion is started. SD is VRAM-heavy so it is started on demand rather than left running. If you see the banner, it usually clears within a minute or two — the retry button re-probes the service.",
  },
  {
    q: "What rate limits apply?",
    a: "Each tool has its own per-IP rate limit window in memory. The Deep Research tool is stricter (roughly 10 requests per hour per IP) because each request fans out to ~10 external HTTP calls. Most other tools allow several requests per minute. You will see a 429 response if you exceed the limit.",
  },
  {
    q: "What SDK or API can I use to call these tools programmatically?",
    a: "There is no public API or SDK. The tools are intended as a browser-first vibecoding sandbox. If you want programmatic access, self-host the repo — every tool is a thin wrapper over Ollama and Stable Diffusion, both of which expose HTTP APIs.",
  },
  {
    q: "How is RnR Vibe different from Cursor, v0, or Claude Code?",
    a: "Those are IDE-class agents designed for multi-file edits on a full codebase. RnR Vibe is a lightweight, browser-based sandbox with narrow, single-purpose AI tools (regex generator, SQL generator, image generator, bug fixer, etc.) that you reach in one click without installing anything. See the /compare pages for head-to-head breakdowns.",
  },
  {
    q: "Is there a mobile app?",
    a: "No. The site is responsive and works well on mobile browsers, but there is no dedicated iOS or Android app.",
  },
  {
    q: "Where can I report a bug or request a tool?",
    a: "RnR Vibe is run by a small team and issues/feature requests go through GitHub. The About page links the contact path. Critical bugs (tool returning wrong output, broken pipeline) are prioritized over cosmetic requests.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://www.rnrvibe.com" },
    { "@type": "ListItem", position: 2, name: "FAQ", item: "https://www.rnrvibe.com/faq" },
  ],
};

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <BlogNav />
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="mb-3 text-3xl font-bold tracking-tight">RnR Vibe FAQ</h1>
        <p className="mb-10 text-neutral-400">
          Common questions about the tools, the stack, privacy, and how everything is wired up.
        </p>

        <div className="space-y-8">
          {faqs.map((f) => (
            <section key={f.q}>
              <h2 className="mb-2 text-lg font-semibold text-white">{f.q}</h2>
              <p className="text-neutral-300 leading-relaxed">{f.a}</p>
            </section>
          ))}
        </div>

        <div className="mt-12 border-t border-neutral-800 pt-8 text-sm text-neutral-400">
          Still stuck? Check the{" "}
          <Link href="/guides" className="text-purple-400 hover:text-purple-300">
            Guides
          </Link>{" "}
          or read more on the{" "}
          <Link href="/blog" className="text-purple-400 hover:text-purple-300">
            Blog
          </Link>
          .
        </div>
      </div>
    </div>
  );
}
