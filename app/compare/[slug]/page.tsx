import BlogNav from "@/components/BlogNav";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface ComparisonData {
  title: string;
  metaDescription: string;
  intro: string;
  rnrvibe: { pros: string[]; cons: string[] };
  competitor: { name: string; pros: string[]; cons: string[] };
  table: { feature: string; rnrvibe: string; competitor: string }[];
  verdict: string;
}

const comparisons: Record<string, ComparisonData> = {
  "rnrvibe-vs-cursor": {
    title: "RnR Vibe vs Cursor",
    metaDescription: "Compare RnR Vibe and Cursor — free browser tools vs a full AI code editor. Features, pricing, and privacy compared.",
    intro: "Cursor is a powerful AI-first code editor built on VS Code. RnR Vibe is a free, browser-based platform with AI tools powered by a local LLM. They serve different use cases — here's how they compare.",
    rnrvibe: {
      pros: [
        "Completely free — no subscription",
        "No installation needed — runs in browser",
        "Privacy-first — AI runs locally via Ollama",
        "Built-in educational content (blog, guides)",
        "24 specialized tools for specific tasks",
      ],
      cons: [
        "Not a code editor — no file management",
        "Requires self-hosted Ollama for AI features",
        "Smaller model (8B) vs Cursor's cloud models",
      ],
    },
    competitor: {
      name: "Cursor",
      pros: [
        "Full IDE with file explorer and terminal",
        "Inline code generation and editing",
        "Uses GPT-4 / Claude for higher quality output",
        "Git integration built in",
        "Tab autocomplete in context",
      ],
      cons: [
        "Paid subscription ($20/mo for Pro)",
        "Requires desktop installation",
        "Code sent to cloud for processing",
        "Can be overwhelming for beginners",
      ],
    },
    table: [
      { feature: "Price", rnrvibe: "Free", competitor: "$0-20/mo" },
      { feature: "Setup", rnrvibe: "Open browser", competitor: "Download + install" },
      { feature: "AI Model", rnrvibe: "Local (Llama 3.1 8B)", competitor: "Cloud (GPT-4, Claude)" },
      { feature: "Privacy", rnrvibe: "100% local", competitor: "Cloud-processed" },
      { feature: "Code Editing", rnrvibe: "Copy/paste workflow", competitor: "Full IDE" },
      { feature: "Learning Resources", rnrvibe: "Blog, guides, tools", competitor: "Documentation" },
      { feature: "Best For", rnrvibe: "Learning, quick tasks", competitor: "Full-time development" },
    ],
    verdict: "Use RnR Vibe when you want free, private, quick AI tools for learning and specific tasks. Use Cursor when you need a full AI-powered development environment and don't mind the subscription.",
  },
  "rnrvibe-vs-v0": {
    title: "RnR Vibe vs v0",
    metaDescription: "Compare RnR Vibe and v0 by Vercel — local AI tools vs hosted UI generation. Features, cost, and approach compared.",
    intro: "v0 by Vercel generates UI components from text prompts using cloud AI. RnR Vibe offers a broader set of AI-powered development tools running on local models. Different philosophies, different strengths.",
    rnrvibe: {
      pros: [
        "24 tools covering code review, conversion, regex, testing, and more",
        "Completely free — no token limits",
        "Local AI — your code stays private",
        "Educational content alongside tools",
        "Works offline once Ollama is running",
      ],
      cons: [
        "UI generation isn't a dedicated feature",
        "Smaller AI model than v0's cloud models",
        "Requires Ollama setup for AI features",
      ],
    },
    competitor: {
      name: "v0",
      pros: [
        "Exceptional UI/component generation",
        "Uses cutting-edge cloud models",
        "One-click deploy to Vercel",
        "Generates React/Tailwind by default",
        "Iterative refinement in chat",
      ],
      cons: [
        "Free tier has generation limits",
        "Focused only on UI — no code review, regex, etc.",
        "Code processed in the cloud",
        "Locked to React/Next.js ecosystem",
      ],
    },
    table: [
      { feature: "Price", rnrvibe: "Free", competitor: "Free tier + paid" },
      { feature: "Focus", rnrvibe: "Multi-tool platform", competitor: "UI generation" },
      { feature: "AI Model", rnrvibe: "Local (Llama 3.1 8B)", competitor: "Cloud (proprietary)" },
      { feature: "Privacy", rnrvibe: "100% local", competitor: "Cloud-processed" },
      { feature: "Framework", rnrvibe: "Any", competitor: "React/Next.js" },
      { feature: "Tools Count", rnrvibe: "24 specialized tools", competitor: "1 (UI gen)" },
      { feature: "Best For", rnrvibe: "Full workflow support", competitor: "Rapid UI prototyping" },
    ],
    verdict: "Use v0 when you need to quickly generate beautiful React UI components. Use RnR Vibe when you need a broader toolkit — code review, conversion, regex, palettes — with full privacy and zero cost.",
  },
  "rnrvibe-vs-github-copilot": {
    title: "RnR Vibe vs GitHub Copilot",
    metaDescription: "Compare RnR Vibe and GitHub Copilot — standalone vibecoding tools vs in-editor AI autocomplete.",
    intro: "GitHub Copilot is the most popular AI coding assistant, integrated directly into your editor. RnR Vibe takes a different approach with standalone, specialized tools. Here's how they compare.",
    rnrvibe: {
      pros: [
        "Completely free — no subscription",
        "Specialized tools for specific tasks",
        "Privacy-first — runs on local Ollama",
        "Educational content (blog, guides)",
        "No editor lock-in",
      ],
      cons: [
        "Not integrated into your editor",
        "Copy/paste workflow between tool and editor",
        "Smaller local model",
      ],
    },
    competitor: {
      name: "GitHub Copilot",
      pros: [
        "Inline autocomplete as you type",
        "Deep context awareness of your codebase",
        "Works in VS Code, JetBrains, Neovim",
        "Chat mode for questions",
        "Backed by OpenAI models",
      ],
      cons: [
        "$10-19/mo subscription",
        "Code sent to cloud for processing",
        "Can generate incorrect suggestions confidently",
        "No standalone tools (regex, palette, etc.)",
      ],
    },
    table: [
      { feature: "Price", rnrvibe: "Free", competitor: "$10-19/mo" },
      { feature: "Integration", rnrvibe: "Browser (standalone)", competitor: "In-editor" },
      { feature: "AI Model", rnrvibe: "Local (Llama 3.1 8B)", competitor: "Cloud (OpenAI)" },
      { feature: "Privacy", rnrvibe: "100% local", competitor: "Cloud-processed" },
      { feature: "Autocomplete", rnrvibe: "No", competitor: "Yes (inline)" },
      { feature: "Specialized Tools", rnrvibe: "24 tools", competitor: "Chat only" },
      { feature: "Best For", rnrvibe: "Task-specific AI help", competitor: "In-editor assistance" },
    ],
    verdict: "These tools complement each other well. Use Copilot for inline autocomplete while coding, and RnR Vibe for specific tasks like code review, regex generation, or code conversion — all for free and private.",
  },
  "rnrvibe-vs-bolt": {
    title: "RnR Vibe vs Bolt.new",
    metaDescription: "Compare RnR Vibe and Bolt.new — local AI development tools vs cloud-based full-stack app generation.",
    intro: "Bolt.new by StackBlitz generates full-stack applications from prompts in a cloud sandbox. RnR Vibe offers 24 specialized AI tools running locally. Here's how they stack up.",
    rnrvibe: {
      pros: [
        "Completely free — no token limits or credits",
        "24 specialized tools for specific development tasks",
        "Privacy-first — all AI runs locally via Ollama",
        "Educational content: blog posts, guides, demo projects",
        "No vendor lock-in — works with any stack",
      ],
      cons: [
        "Doesn't generate full applications from a single prompt",
        "Requires local Ollama setup for AI features",
        "Copy/paste workflow (not an integrated environment)",
      ],
    },
    competitor: {
      name: "Bolt.new",
      pros: [
        "Generates complete full-stack apps from prompts",
        "Integrated preview environment in browser",
        "One-click deploy to various hosts",
        "Uses powerful cloud AI models",
        "No local setup required",
      ],
      cons: [
        "Free tier has limited generations",
        "Code sent to cloud for processing",
        "Less control over architecture decisions",
        "Generated apps can be hard to customize",
      ],
    },
    table: [
      { feature: "Price", rnrvibe: "Free", competitor: "Free tier + paid plans" },
      { feature: "Approach", rnrvibe: "24 specialized tools", competitor: "Full app generation" },
      { feature: "AI Model", rnrvibe: "Local (Llama 3.1 8B)", competitor: "Cloud (various)" },
      { feature: "Privacy", rnrvibe: "100% local", competitor: "Cloud-processed" },
      { feature: "Learning", rnrvibe: "Guides, blog, projects", competitor: "Generated code" },
      { feature: "Customization", rnrvibe: "Full control", competitor: "Prompt-based iteration" },
      { feature: "Best For", rnrvibe: "Learning + specific tasks", competitor: "Rapid full-app prototypes" },
    ],
    verdict: "Use Bolt.new when you need a complete working app fast and don't mind cloud processing. Use RnR Vibe when you want to learn, use specific tools, and keep everything private and free.",
  },
  "rnrvibe-vs-replit-ai": {
    title: "RnR Vibe vs Replit AI",
    metaDescription: "Compare RnR Vibe and Replit AI — free local AI tools vs a cloud IDE with AI features. Privacy, cost, and capabilities compared.",
    intro: "Replit AI combines a cloud IDE with AI code generation, debugging, and deployment. RnR Vibe focuses on specialized AI tools running locally. Two different philosophies for AI-assisted development.",
    rnrvibe: {
      pros: [
        "Completely free — no subscription tiers",
        "24 specialized tools for targeted tasks",
        "Local AI — your code stays on your machine",
        "Rich educational content and demo projects",
        "No account required",
      ],
      cons: [
        "Not a code editor or IDE",
        "Requires local Ollama for AI features",
        "Tools are standalone (not integrated into a coding environment)",
      ],
    },
    competitor: {
      name: "Replit AI",
      pros: [
        "Full cloud IDE — code from any device",
        "AI integrated into the coding experience",
        "Built-in hosting and deployment",
        "Collaborative coding features",
        "Mobile app available",
      ],
      cons: [
        "Core plan starts at $25/month",
        "Code runs and is stored in the cloud",
        "Performance depends on internet connection",
        "AI quality varies by task type",
      ],
    },
    table: [
      { feature: "Price", rnrvibe: "Free", competitor: "$0-25/mo" },
      { feature: "Type", rnrvibe: "Specialized tools", competitor: "Cloud IDE" },
      { feature: "AI Model", rnrvibe: "Local (Llama 3.1 8B)", competitor: "Cloud (proprietary)" },
      { feature: "Privacy", rnrvibe: "100% local", competitor: "Cloud-hosted" },
      { feature: "Setup", rnrvibe: "Open browser + Ollama", competitor: "Open browser" },
      { feature: "Collaboration", rnrvibe: "No", competitor: "Yes (real-time)" },
      { feature: "Best For", rnrvibe: "Privacy-focused development", competitor: "Cloud-first development" },
    ],
    verdict: "Use Replit AI when you want an all-in-one cloud development environment with collaboration. Use RnR Vibe when privacy, cost, and specialized tools matter more than an integrated IDE.",
  },
  "rnrvibe-vs-claude-code": {
    title: "RnR Vibe vs Claude Code",
    metaDescription: "Compare RnR Vibe and Claude Code — browser-based AI tools vs an agentic CLI coding assistant.",
    intro: "Claude Code is Anthropic's CLI-based AI coding agent that works directly in your terminal and codebase. RnR Vibe offers browser-based specialized tools. Here's how these different approaches to AI-assisted coding compare.",
    rnrvibe: {
      pros: [
        "Completely free — no API costs",
        "No installation — runs in browser",
        "24 specialized tools for specific tasks",
        "Built-in learning resources (blog, guides, projects)",
        "Local AI via Ollama for privacy",
      ],
      cons: [
        "Not a coding agent — doesn't modify your files directly",
        "Copy/paste workflow between tool and project",
        "Smaller local model compared to Claude's capabilities",
      ],
    },
    competitor: {
      name: "Claude Code",
      pros: [
        "Agentic — reads, writes, and modifies your codebase directly",
        "Deep context understanding across your entire project",
        "Runs tests, commits, and creates PRs",
        "Powered by Claude (state-of-the-art reasoning)",
        "Terminal-native workflow",
      ],
      cons: [
        "Costs per API usage (Claude API pricing)",
        "Requires CLI installation and setup",
        "Code sent to Anthropic's API for processing",
        "Requires comfort with terminal workflows",
      ],
    },
    table: [
      { feature: "Price", rnrvibe: "Free", competitor: "API usage-based" },
      { feature: "Approach", rnrvibe: "Browser tools", competitor: "CLI agent" },
      { feature: "AI Model", rnrvibe: "Local (Llama 3.1 8B)", competitor: "Cloud (Claude)" },
      { feature: "File Access", rnrvibe: "None (copy/paste)", competitor: "Full codebase access" },
      { feature: "Autonomy", rnrvibe: "User-driven tools", competitor: "Agentic (plans & executes)" },
      { feature: "Learning", rnrvibe: "Guides, blog, projects", competitor: "Documentation" },
      { feature: "Best For", rnrvibe: "Specific tasks, learning", competitor: "Complex multi-file changes" },
    ],
    verdict: "Claude Code excels at complex, multi-file development tasks where an AI agent can plan and execute across your codebase. RnR Vibe is better for targeted tasks, learning, and when you want free, private tools without API costs.",
  },
};

export function generateStaticParams() {
  return Object.keys(comparisons).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = comparisons[slug];
  if (!data) return { title: "Not Found" };
  return {
    title: data.title,
    description: data.metaDescription,
    alternates: { canonical: `https://www.rnrvibe.com/compare/${slug}` },
    openGraph: {
      title: data.title,
      description: data.metaDescription,
      images: [`/api/og?title=${encodeURIComponent(data.title)}&type=compare`],
    },
    twitter: {
      card: "summary_large_image" as const,
      title: data.title,
      description: data.metaDescription,
      images: [`/api/og?title=${encodeURIComponent(data.title)}&type=compare`],
    },
  };
}

export default async function ComparisonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = comparisons[slug];
  if (!data) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: data.title,
    description: data.metaDescription,
    url: `https://www.rnrvibe.com/compare/${slug}`,
    publisher: {
      "@type": "Organization",
      name: "RnR Vibe",
      url: "https://www.rnrvibe.com",
    },
    mainEntityOfPage: `https://www.rnrvibe.com/compare/${slug}`,
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogNav />
      <article className="mx-auto max-w-4xl px-6 py-16">
        <Link
          href="/compare"
          className="mb-8 inline-flex items-center gap-1 text-sm text-neutral-500 transition hover:text-purple-400"
        >
          &larr; All Comparisons
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">{data.title}</h1>
        <p className="text-neutral-400 mb-12 max-w-2xl">{data.intro}</p>

        {/* Comparison table */}
        <div className="overflow-x-auto mb-12">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="py-3 px-4 text-left text-neutral-500 font-medium">Feature</th>
                <th className="py-3 px-4 text-left text-purple-400 font-medium">RnR Vibe</th>
                <th className="py-3 px-4 text-left text-neutral-400 font-medium">{data.competitor.name}</th>
              </tr>
            </thead>
            <tbody>
              {data.table.map((row) => (
                <tr key={row.feature} className="border-b border-neutral-800/50">
                  <td className="py-3 px-4 text-neutral-300 font-medium">{row.feature}</td>
                  <td className="py-3 px-4 text-neutral-400">{row.rnrvibe}</td>
                  <td className="py-3 px-4 text-neutral-400">{row.competitor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pros/Cons side by side */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="p-6 rounded-xl border border-purple-500/20 bg-purple-500/5">
            <h3 className="font-semibold text-purple-400 mb-4">RnR Vibe</h3>
            <div className="mb-4">
              <h4 className="text-xs uppercase tracking-wider text-neutral-500 mb-2">Strengths</h4>
              <ul className="space-y-1.5">
                {data.rnrvibe.pros.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-neutral-300">
                    <span className="text-green-400 mt-0.5 shrink-0">+</span> {p}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-wider text-neutral-500 mb-2">Limitations</h4>
              <ul className="space-y-1.5">
                {data.rnrvibe.cons.map((c) => (
                  <li key={c} className="flex items-start gap-2 text-sm text-neutral-400">
                    <span className="text-neutral-600 mt-0.5 shrink-0">-</span> {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900">
            <h3 className="font-semibold text-neutral-300 mb-4">{data.competitor.name}</h3>
            <div className="mb-4">
              <h4 className="text-xs uppercase tracking-wider text-neutral-500 mb-2">Strengths</h4>
              <ul className="space-y-1.5">
                {data.competitor.pros.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-neutral-300">
                    <span className="text-green-400 mt-0.5 shrink-0">+</span> {p}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-wider text-neutral-500 mb-2">Limitations</h4>
              <ul className="space-y-1.5">
                {data.competitor.cons.map((c) => (
                  <li key={c} className="flex items-start gap-2 text-sm text-neutral-400">
                    <span className="text-neutral-600 mt-0.5 shrink-0">-</span> {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Verdict */}
        <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900">
          <h3 className="font-semibold text-white mb-2">The Verdict</h3>
          <p className="text-neutral-400 text-sm leading-relaxed">{data.verdict}</p>
        </div>

        <div className="mt-12 text-center">
          <a
            href="/tools"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500 text-white font-semibold rounded-xl hover:bg-purple-600 transition-colors"
          >
            Try RnR Vibe Tools — Free
          </a>
        </div>
      </article>
    </div>
  );
}
