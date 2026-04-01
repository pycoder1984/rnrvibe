"use client";

import BlogNav from "@/components/BlogNav";
import { useState } from "react";

const sampleCommits = `feat: add user authentication with JWT
fix: resolve login redirect loop on mobile
feat: implement dark mode toggle
docs: update API documentation
fix: fix typo in welcome email template
refactor: extract validation logic into shared utils
feat: add password reset flow
chore: update dependencies to latest versions
fix: handle empty search results gracefully
style: improve button hover animations
feat: add export to CSV feature
test: add unit tests for auth middleware`;

function parseCommits(input: string): string {
  const lines = input.trim().split("\n").filter((l) => l.trim());

  const groups: Record<string, string[]> = {};

  for (const line of lines) {
    const match = line.match(/^(\w+)(?:\([\w-]+\))?:\s*(.+)$/);
    if (match) {
      const [, type, msg] = match;
      const key = type.toLowerCase();
      if (!groups[key]) groups[key] = [];
      groups[key].push(msg.trim());
    } else {
      if (!groups["other"]) groups["other"] = [];
      groups["other"].push(line.trim());
    }
  }

  const typeLabels: Record<string, string> = {
    feat: "Features",
    fix: "Bug Fixes",
    docs: "Documentation",
    style: "Styling",
    refactor: "Refactoring",
    test: "Tests",
    chore: "Chores",
    perf: "Performance",
    ci: "CI/CD",
    build: "Build",
    other: "Other",
  };

  const order = ["feat", "fix", "refactor", "perf", "docs", "style", "test", "chore", "ci", "build", "other"];

  let changelog = `# Changelog\n\n## [Unreleased]\n`;

  for (const type of order) {
    if (groups[type] && groups[type].length > 0) {
      const label = typeLabels[type] || type;
      changelog += `\n### ${label}\n\n`;
      for (const msg of groups[type]) {
        changelog += `- ${msg.charAt(0).toUpperCase() + msg.slice(1)}\n`;
      }
    }
  }

  return changelog;
}

export default function ChangelogGeneratorPage() {
  const [input, setInput] = useState(sampleCommits);
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = () => {
    if (!input.trim()) return;
    setOutput(parseCommits(input));
  };

  const copy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const prompt = `Build a changelog generator in React with:
- Textarea for pasting conventional commit messages
- Parse commit types (feat, fix, docs, refactor, etc.)
- Group commits by type with proper headings
- Generate formatted CHANGELOG.md output
- Capitalize first letter of each entry
- Sample commit data pre-loaded
- Copy to clipboard button
- Dark theme, no dependencies`;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <BlogNav />
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Changelog Generator</h1>
        <p className="mb-8 text-neutral-400">A commit-to-changelog converter built with vibecoding in ~4 minutes.</p>

        {/* Demo */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 mb-8 space-y-4">
          <div>
            <label className="text-sm text-neutral-400 block mb-2">Paste commit messages (one per line)</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="feat: add new feature&#10;fix: resolve bug&#10;docs: update readme"
              rows={10}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 p-4 font-mono text-sm text-neutral-200 placeholder-neutral-600 focus:border-purple-500/50 focus:outline-none resize-y"
            />
          </div>

          <button
            onClick={generate}
            disabled={!input.trim()}
            className="rounded-lg bg-purple-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-purple-600 disabled:opacity-50 transition"
          >
            Generate Changelog
          </button>

          {output && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-neutral-400">CHANGELOG.md</h3>
                <button
                  onClick={copy}
                  className="rounded-lg bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-700 transition"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <pre className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 font-mono text-sm text-neutral-300 overflow-x-auto whitespace-pre-wrap">
                {output}
              </pre>
            </div>
          )}
        </div>

        {/* Prompt */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="text-lg font-semibold text-purple-400 mb-3">Built with this prompt</h2>
          <pre className="text-sm text-neutral-300 whitespace-pre-wrap bg-neutral-950 rounded-xl p-4 border border-neutral-800">{prompt}</pre>
          <div className="flex items-center gap-4 mt-4">
            <button
              onClick={() => navigator.clipboard.writeText(prompt)}
              className="text-sm text-purple-400 hover:text-purple-300 transition"
            >
              Copy prompt
            </button>
            <a href="/tools/project-starter" className="text-sm text-neutral-500 hover:text-white transition">
              Try in Project Starter →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
