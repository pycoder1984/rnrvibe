"use client";

import BlogNav from "@/components/BlogNav";
import { useState } from "react";

const defaultMarkdown = `# Hello Vibecoder!

This is a **markdown previewer** built with vibecoding.

## Features
- Live preview as you type
- Supports **bold**, *italic*, and \`inline code\`
- Lists, headings, links, and more

### Code Block
\`\`\`javascript
const greeting = "Hello, world!";
console.log(greeting);
\`\`\`

> "The best way to predict the future is to vibecode it."

---

Try editing this text on the left!`;

function parseMarkdown(md: string): string {
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-neutral-950 border border-neutral-800 rounded-lg p-3 my-2 overflow-x-auto"><code>$2</code></pre>');
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="bg-neutral-800 px-1.5 py-0.5 rounded text-purple-300 text-sm">$1</code>');
  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-5 mb-2">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-3">$1</h1>');
  // Bold & italic
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  // Blockquote
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote class="border-l-4 border-purple-500 pl-4 my-3 text-neutral-400 italic">$1</blockquote>');
  // Unordered list
  html = html.replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>');
  html = html.replace(/(<li.*<\/li>\n?)+/g, '<ul class="my-2">$&</ul>');
  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr class="border-neutral-700 my-4" />');
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match: string, text: string, url: string) => {
    if (/^(https?:\/\/|\/|#|mailto:)/i.test(url)) {
      return `<a href="${url}" class="text-purple-400 underline" rel="noopener noreferrer">${text}</a>`;
    }
    return `<span class="text-purple-400">${text}</span>`;
  });
  // Paragraphs
  html = html.replace(/^(?!<[hupblo]|<hr|<pre|<code)(.+)$/gm, '<p class="my-1.5">$1</p>');

  return html;
}

export default function MarkdownPreviewerPage() {
  const [markdown, setMarkdown] = useState(defaultMarkdown);

  const prompt = `Build a markdown previewer in React with:
- Split pane: editor on the left, preview on the right
- Live preview that updates as you type
- Support for headings, bold, italic, code blocks, lists, blockquotes, links, and horizontal rules
- Syntax highlighting for code blocks
- Dark theme with clean typography
- Default sample markdown content`;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <BlogNav />
      <div className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Markdown Previewer</h1>
        <p className="mb-8 text-neutral-400">A live markdown editor built with vibecoding in ~5 minutes.</p>

        {/* Demo */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden mb-8">
          <div className="flex border-b border-neutral-800">
            <div className="flex-1 px-4 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider border-r border-neutral-800">
              Markdown
            </div>
            <div className="flex-1 px-4 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Preview
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-800" style={{ minHeight: 400 }}>
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              className="w-full h-full min-h-[400px] bg-neutral-950 p-4 font-mono text-sm text-neutral-200 focus:outline-none resize-none"
              spellCheck={false}
            />
            <div
              className="p-4 text-sm text-neutral-200 overflow-auto prose-invert"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(markdown) }}
            />
          </div>
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
