"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface SearchResult {
  title: string;
  description: string;
  href: string;
  type: "blog" | "guide" | "tool" | "project";
}

const staticResults: SearchResult[] = [
  // Tools
  { title: "Prompt Library", description: "Browse and copy ready-made vibecoding prompts", href: "/tools/prompt-library", type: "tool" },
  { title: "Vibe Checker", description: "AI-powered code review for bugs and security", href: "/tools/vibe-checker", type: "tool" },
  { title: "Project Starter", description: "Get a tech stack and file structure for your idea", href: "/tools/project-starter", type: "tool" },
  { title: "Code Explainer", description: "Plain-English explanation of any code snippet", href: "/tools/code-explainer", type: "tool" },
  { title: "Regex Generator", description: "Natural language to regex patterns", href: "/tools/regex-generator", type: "tool" },
  { title: "Color Palette", description: "AI-generated color palettes from mood descriptions", href: "/tools/color-palette", type: "tool" },
  { title: "AI Chat", description: "Chat with an AI assistant about vibecoding", href: "/tools/chat", type: "tool" },
  { title: "Code Converter", description: "Translate code between 12 languages", href: "/tools/code-converter", type: "tool" },
  { title: "README Generator", description: "Generate professional README.md files", href: "/tools/readme-generator", type: "tool" },
  { title: "API Endpoint Generator", description: "Production-ready route handlers for Next.js, Express, FastAPI", href: "/tools/api-endpoint", type: "tool" },
  { title: "Bug Fixer", description: "Paste broken code and get an instant fix", href: "/tools/bug-fixer", type: "tool" },
  { title: "SQL Generator", description: "Plain English to SQL queries with schema suggestions", href: "/tools/sql-generator", type: "tool" },
  { title: "Component Generator", description: "React + Tailwind components from descriptions", href: "/tools/component-generator", type: "tool" },
  { title: "Git Command Helper", description: "Plain English to Git commands with safety warnings", href: "/tools/git-helper", type: "tool" },
  { title: "Cron Expression Builder", description: "Schedule descriptions to cron expressions", href: "/tools/cron-builder", type: "tool" },
  { title: "Env Variable Generator", description: "Generate .env.example files for any stack", href: "/tools/env-generator", type: "tool" },
  { title: "Commit Message Writer", description: "Conventional commit messages from diffs", href: "/tools/commit-writer", type: "tool" },
  { title: "Tech Stack Recommender", description: "Compare tech stacks for your project idea", href: "/tools/stack-recommender", type: "tool" },
  { title: "Accessibility Checker", description: "WCAG 2.1 AA accessibility audit for HTML/JSX", href: "/tools/accessibility-checker", type: "tool" },
  { title: "TypeScript Type Generator", description: "Plain English to TypeScript interfaces and types", href: "/tools/typescript-generator", type: "tool" },
  { title: "Docker Compose Generator", description: "Describe your stack, get docker-compose.yml", href: "/tools/docker-compose", type: "tool" },
  { title: "Test Generator", description: "Generate unit tests from code with Jest, Vitest, pytest", href: "/tools/test-generator", type: "tool" },
  { title: "CSS to Tailwind Converter", description: "Convert vanilla CSS to Tailwind classes", href: "/tools/css-to-tailwind", type: "tool" },
  { title: "Schema Validator", description: "JSON Schema generation and validation", href: "/tools/schema-validator", type: "tool" },
  { title: "AI Image Generator", description: "Generate images with local Stable Diffusion", href: "/tools/image-generator", type: "tool" },
  { title: "AI Logo Generator", description: "Generate logo concepts from brand descriptions", href: "/tools/logo-generator", type: "tool" },
  { title: "AI Image Studio", description: "Upscale, restyle, inpaint, and caption images", href: "/tools/image-studio", type: "tool" },
  // Projects
  { title: "USD to INR Rate Tracker", description: "Real-time exchange rate comparison", href: "/projects/exchange-rate-tracker", type: "project" },
  { title: "Pomodoro Timer", description: "25/5 focus timer with session tracking", href: "/projects/pomodoro-timer", type: "project" },
  { title: "Markdown Previewer", description: "Split-pane editor with live preview", href: "/projects/markdown-previewer", type: "project" },
  { title: "Expense Tracker", description: "Track income and expenses by category", href: "/projects/expense-tracker", type: "project" },
  { title: "Quiz Builder", description: "Create and take multiple-choice quizzes", href: "/projects/quiz-builder", type: "project" },
  { title: "Habit Tracker", description: "GitHub-style contribution grid for habits", href: "/projects/habit-tracker", type: "project" },
  { title: "JSON Formatter", description: "Format, validate, and minify JSON", href: "/projects/json-formatter", type: "project" },
  { title: "Password Generator", description: "Secure passwords with strength meter", href: "/projects/password-generator", type: "project" },
  { title: "Stopwatch & Lap Timer", description: "Precision stopwatch with lap tracking", href: "/projects/stopwatch", type: "project" },
  { title: "BMI Calculator", description: "BMI calculator with health range indicator", href: "/projects/bmi-calculator", type: "project" },
  { title: "Color Contrast Checker", description: "WCAG contrast ratio checker", href: "/projects/contrast-checker", type: "project" },
  { title: "URL Shortener", description: "Shorten URLs with custom aliases", href: "/projects/url-shortener", type: "project" },
];

export default function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [dynamicResults, setDynamicResults] = useState<SearchResult[]>([]);
  const hasFetched = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchIndex = useCallback(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetch("/api/search-index")
      .then((r) => r.json())
      .then((data) => setDynamicResults(data))
      .catch(() => {
        hasFetched.current = false;
      });
  }, []);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      fetchIndex();
    } else {
      setQuery("");
      setResults([]);
    }
  }, [open, fetchIndex]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const q = query.toLowerCase();
    const allResults = [...staticResults, ...dynamicResults];
    setResults(
      allResults.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q)
      ).slice(0, 8)
    );
  }, [query, dynamicResults]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const typeLabel = (type: string) => {
    switch (type) {
      case "blog": return "Blog";
      case "guide": return "Guide";
      case "tool": return "Tool";
      case "project": return "Project";
      default: return type;
    }
  };

  const typeColor = (type: string) => {
    switch (type) {
      case "blog": return "bg-blue-500/10 text-blue-400";
      case "guide": return "bg-green-500/10 text-green-400";
      case "tool": return "bg-purple-500/10 text-purple-400";
      case "project": return "bg-orange-500/10 text-orange-400";
      default: return "bg-neutral-500/10 text-neutral-400";
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg mx-4 bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-800">
          <svg className="w-5 h-5 text-neutral-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <label htmlFor="search-input" className="sr-only">Search</label>
          <input
            id="search-input"
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools, blog posts, guides..."
            className="flex-1 bg-transparent text-white placeholder-neutral-500 focus:outline-none text-sm"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-xs text-neutral-500 bg-neutral-800 rounded border border-neutral-700">
            ESC
          </kbd>
        </div>

        {query.trim() && (
          <div className="max-h-80 overflow-y-auto py-2">
            {results.length === 0 ? (
              <div className="px-5 py-8 text-center text-neutral-500 text-sm">
                No results for &ldquo;{query}&rdquo;
              </div>
            ) : (
              results.map((r) => (
                <a
                  key={r.href}
                  href={r.href}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-neutral-800/50 transition-colors"
                  onClick={onClose}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{r.title}</div>
                    <div className="text-xs text-neutral-500 truncate">{r.description}</div>
                  </div>
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${typeColor(r.type)}`}>
                    {typeLabel(r.type)}
                  </span>
                </a>
              ))
            )}
          </div>
        )}

        {!query.trim() && (
          <div className="px-5 py-6 text-center text-neutral-600 text-sm">
            Type to search across the entire site
          </div>
        )}
      </div>
    </div>
  );
}
