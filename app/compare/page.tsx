import BlogNav from "@/components/BlogNav";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare Vibecoding Tools — RnR Vibe",
  description: "Side-by-side comparisons of the top vibecoding and AI coding tools — Cursor, v0, GitHub Copilot, and RnR Vibe. Honest feature and pricing breakdowns.",
  alternates: { canonical: "https://www.rnrvibe.com/compare" },
  openGraph: {
    title: "Compare Vibecoding Tools — RnR Vibe",
    description: "Side-by-side comparisons of the top vibecoding tools.",
    images: ["/api/og?title=Compare%20Vibecoding%20Tools&type=article"],
  },
};

const comparisons = [
  {
    slug: "rnrvibe-vs-cursor",
    title: "RnR Vibe vs Cursor",
    description: "Free browser-based tools vs a full AI code editor. Which approach fits your workflow?",
  },
  {
    slug: "rnrvibe-vs-v0",
    title: "RnR Vibe vs v0",
    description: "Open local AI tools vs Vercel's hosted UI generator. Compare features, cost, and privacy.",
  },
  {
    slug: "rnrvibe-vs-github-copilot",
    title: "RnR Vibe vs GitHub Copilot",
    description: "Standalone vibecoding platform vs in-editor AI autocomplete. Different tools for different needs.",
  },
  {
    slug: "rnrvibe-vs-bolt",
    title: "RnR Vibe vs Bolt.new",
    description: "Specialized local AI tools vs cloud-based full-stack app generation. Two approaches to vibecoding.",
  },
  {
    slug: "rnrvibe-vs-replit-ai",
    title: "RnR Vibe vs Replit AI",
    description: "Free local tools vs a cloud IDE with built-in AI. Privacy, cost, and capabilities compared.",
  },
  {
    slug: "rnrvibe-vs-claude-code",
    title: "RnR Vibe vs Claude Code",
    description: "Browser-based AI tools vs an agentic CLI assistant. Different philosophies for AI-assisted coding.",
  },
];

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <BlogNav />
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-4xl font-bold tracking-tight mb-3">Compare Tools</h1>
        <p className="text-neutral-400 mb-12 max-w-2xl">
          See how RnR Vibe stacks up against other vibecoding tools. Honest, side-by-side comparisons.
        </p>
        <div className="space-y-4">
          {comparisons.map((c) => (
            <Link
              key={c.slug}
              href={`/compare/${c.slug}`}
              className="group block p-6 rounded-xl border border-neutral-800 bg-neutral-900 hover:border-purple-500/30 transition-all"
            >
              <h2 className="text-xl font-semibold group-hover:text-purple-400 transition-colors">
                {c.title}
              </h2>
              <p className="mt-2 text-sm text-neutral-400">{c.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
