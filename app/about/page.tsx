import BlogNav from "@/components/BlogNav";
import Link from "next/link";

export const metadata = {
  title: "About RnR Vibe — What is Vibecoding?",
  description: "RnR Vibe is a free vibecoding platform with AI-powered tools, guides, and resources. Learn what vibecoding is and how to build software with AI.",
  alternates: { canonical: "https://www.rnrvibe.com/about" },
  openGraph: {
    title: "About RnR Vibe — What is Vibecoding?",
    description: "Learn what vibecoding is and how to build software with AI.",
    images: ["/api/og?title=About%20RnR%20Vibe&type=article"],
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <BlogNav />
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="mb-6 text-3xl font-bold tracking-tight">About RnR Vibe</h1>

        <div className="prose">
          <p>
            <strong>RnR Vibe</strong> is a lightweight vibecoding platform and resource hub.
            We believe in building software by describing what you want in natural language
            and letting AI handle the code. No bloat. No friction. Just you, your ideas, and the flow.
          </p>

          <h2>What is Vibecoding?</h2>
          <p>
            Vibecoding is the practice of building software by communicating your intent
            to an AI assistant instead of writing every line of code by hand. You focus on
            the <strong>what</strong>, and AI handles the <strong>how</strong>.
          </p>

          <h2>What you&apos;ll find here</h2>
          <ul>
            <li>
              <strong>Blog posts</strong> covering vibecoding concepts, tool
              reviews, and practical tips
            </li>
            <li>
              <strong>Guides</strong> with step-by-step tutorials for getting
              started and leveling up
            </li>
            <li>
              <strong>Tool recommendations</strong> to help you choose the right
              AI assistant for your needs
            </li>
          </ul>

          <h2>Recommended Tools</h2>
          <ul>
            <li><strong>Claude Code</strong> — Anthropic&apos;s CLI for AI-powered coding</li>
            <li><strong>Cursor</strong> — AI-native code editor based on VS Code</li>
            <li><strong>Windsurf</strong> — AI editor with guided &quot;flows&quot;</li>
            <li><strong>Claude.ai / ChatGPT</strong> — General-purpose AI assistants</li>
          </ul>

          <h2>Get started</h2>
          <p>
            New to vibecoding? Start with our{" "}
            <Link href="/guides/getting-started">Getting Started guide</Link>,
            then check out{" "}
            <Link href="/blog/vibecoding-tips">5 Tips for Better Vibecoding</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
