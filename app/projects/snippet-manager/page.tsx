"use client";

import BlogNav from "@/components/BlogNav";
import { useState, useMemo } from "react";
import { useLocalStorageState } from "@/lib/use-local-storage";

interface Snippet {
  id: number;
  title: string;
  language: string;
  code: string;
  tags: string[];
  createdAt: number;
}

const LANGUAGES = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Go",
  "Rust",
  "HTML",
  "CSS",
  "SQL",
  "Bash",
  "Other",
];

const STORAGE_KEY = "rnr-snippet-manager";

const EMPTY_SNIPPETS: Snippet[] = [];
const initialSnippets = () => EMPTY_SNIPPETS;

// Simple regex-based syntax highlighting (no external deps)
function highlightCode(code: string, language: string): string {
  let html = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Comments (single-line)
  if (["JavaScript", "TypeScript", "Go", "Rust", "CSS", "Other"].includes(language)) {
    html = html.replace(/(\/\/.*)/g, '<span class="text-neutral-500 italic">$1</span>');
  }
  if (["Python", "Bash"].includes(language)) {
    html = html.replace(/(#.*)/g, '<span class="text-neutral-500 italic">$1</span>');
  }
  if (["SQL"].includes(language)) {
    html = html.replace(/(--.*)/g, '<span class="text-neutral-500 italic">$1</span>');
  }
  if (["HTML"].includes(language)) {
    html = html.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="text-neutral-500 italic">$1</span>');
  }

  // Strings (double and single quoted)
  html = html.replace(
    /(?<!=)((&quot;|"|')(?:(?!\2).)*\2)/g,
    '<span class="text-green-400">$1</span>'
  );

  // Template literals
  html = html.replace(
    /(`[^`]*`)/g,
    '<span class="text-green-400">$1</span>'
  );

  // Numbers
  html = html.replace(
    /\b(\d+\.?\d*)\b/g,
    '<span class="text-orange-400">$1</span>'
  );

  // Keywords per language
  let keywords: string[] = [];
  if (["JavaScript", "TypeScript"].includes(language)) {
    keywords = ["const", "let", "var", "function", "return", "if", "else", "for", "while", "class", "import", "export", "from", "default", "async", "await", "new", "this", "try", "catch", "throw", "switch", "case", "break", "continue", "typeof", "instanceof", "null", "undefined", "true", "false"];
  } else if (language === "Python") {
    keywords = ["def", "class", "return", "if", "elif", "else", "for", "while", "import", "from", "as", "try", "except", "raise", "with", "lambda", "yield", "pass", "break", "continue", "and", "or", "not", "in", "is", "None", "True", "False", "self"];
  } else if (language === "Go") {
    keywords = ["func", "package", "import", "return", "if", "else", "for", "range", "switch", "case", "default", "struct", "interface", "map", "chan", "go", "defer", "select", "var", "const", "type", "nil", "true", "false", "make", "append"];
  } else if (language === "Rust") {
    keywords = ["fn", "let", "mut", "return", "if", "else", "for", "while", "loop", "match", "struct", "enum", "impl", "trait", "pub", "use", "mod", "crate", "self", "super", "where", "async", "await", "move", "true", "false", "Some", "None", "Ok", "Err"];
  } else if (language === "SQL") {
    keywords = ["SELECT", "FROM", "WHERE", "INSERT", "INTO", "UPDATE", "SET", "DELETE", "CREATE", "TABLE", "ALTER", "DROP", "JOIN", "LEFT", "RIGHT", "INNER", "OUTER", "ON", "AND", "OR", "NOT", "NULL", "AS", "ORDER", "BY", "GROUP", "HAVING", "LIMIT", "DISTINCT", "VALUES", "INDEX"];
  } else if (language === "HTML") {
    keywords = ["div", "span", "input", "button", "form", "table", "head", "body", "html", "script", "style", "link", "meta", "img", "src", "href", "class", "id"];
  } else if (language === "CSS") {
    keywords = ["display", "flex", "grid", "margin", "padding", "border", "color", "background", "font", "position", "absolute", "relative", "fixed", "width", "height", "top", "left", "right", "bottom", "z-index", "overflow", "transition", "transform", "opacity"];
  } else if (language === "Bash") {
    keywords = ["echo", "if", "then", "else", "fi", "for", "do", "done", "while", "case", "esac", "function", "return", "exit", "export", "source", "cd", "ls", "grep", "awk", "sed", "cat", "mkdir", "rm", "cp", "mv"];
  }

  if (keywords.length > 0) {
    const kwPattern = new RegExp(`\\b(${keywords.join("|")})\\b`, "g");
    html = html.replace(kwPattern, '<span class="text-purple-400 font-semibold">$1</span>');
  }

  return html;
}

export default function SnippetManagerPage() {
  const [snippets, setSnippets, loaded] = useLocalStorageState<Snippet[]>(STORAGE_KEY, initialSnippets);

  // Form state
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("JavaScript");
  const [code, setCode] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Search / filter state
  const [search, setSearch] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("All");
  const [filterTag, setFilterTag] = useState("");

  // Clipboard feedback
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // All unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    snippets.forEach((s) => s.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [snippets]);

  // Filtered snippets
  const filtered = useMemo(() => {
    return snippets.filter((s) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.language.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q)) ||
        s.code.toLowerCase().includes(q);
      const matchesLang = filterLanguage === "All" || s.language === filterLanguage;
      const matchesTag = !filterTag || s.tags.includes(filterTag);
      return matchesSearch && matchesLang && matchesTag;
    });
  }, [snippets, search, filterLanguage, filterTag]);

  const addSnippet = () => {
    if (!title.trim() || !code.trim()) return;
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const newSnippet: Snippet = {
      id: Date.now(),
      title: title.trim(),
      language,
      code: code.trim(),
      tags,
      createdAt: Date.now(),
    };
    setSnippets((prev) => [newSnippet, ...prev]);
    setTitle("");
    setCode("");
    setTagsInput("");
    setShowForm(false);
  };

  const deleteSnippet = (id: number) => {
    setSnippets((prev) => prev.filter((s) => s.id !== id));
  };

  const copyToClipboard = (snippet: Snippet) => {
    navigator.clipboard.writeText(snippet.code);
    setCopiedId(snippet.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const prompt = `Build a code snippet manager in React with:
- Add snippets with title, language dropdown, code, and optional tags
- Syntax highlighting using regex (keywords, strings, comments)
- Search and filter by title, language, or tags
- Copy to clipboard with visual feedback
- Delete snippets
- Tag-based filtering (click a tag to filter)
- Snippet count display
- All data persisted in localStorage
- Empty state with helpful message
- Dark theme with purple accents and monospace code display`;

  if (!loaded) return null;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <BlogNav />
      <div className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Code Snippet Manager</h1>
        <p className="mb-8 text-neutral-400">
          Save, organize, search, and copy code snippets — built with vibecoding in ~10 minutes.
        </p>

        {/* Controls bar */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search snippets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 transition"
              />
            </div>
            {/* Language filter */}
            <select
              value={filterLanguage}
              onChange={(e) => setFilterLanguage(e.target.value)}
              className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition"
            >
              <option value="All">All Languages</option>
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            {/* Add button */}
            <button
              onClick={() => setShowForm(!showForm)}
              className="rounded-lg bg-purple-600 hover:bg-purple-500 px-4 py-2 text-sm font-medium transition whitespace-nowrap"
            >
              {showForm ? "Cancel" : "+ New Snippet"}
            </button>
          </div>

          {/* Tag filter pills */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {filterTag && (
                <button
                  onClick={() => setFilterTag("")}
                  className="text-xs px-2.5 py-1 rounded-full bg-purple-600 text-white transition"
                >
                  {filterTag} ✕
                </button>
              )}
              {allTags
                .filter((t) => t !== filterTag)
                .map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setFilterTag(tag)}
                    className="text-xs px-2.5 py-1 rounded-full bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white border border-neutral-700 transition"
                  >
                    {tag}
                  </button>
                ))}
            </div>
          )}

          {/* Snippet count */}
          <div className="mt-3 text-xs text-neutral-500">
            {filtered.length} snippet{filtered.length !== 1 ? "s" : ""}
            {filtered.length !== snippets.length && ` (of ${snippets.length} total)`}
          </div>
        </div>

        {/* Add snippet form */}
        {showForm && (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Add New Snippet</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Snippet title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 transition"
              />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition"
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              placeholder="Paste your code here..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={8}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-purple-500 transition resize-none mb-4"
              spellCheck={false}
            />
            <input
              type="text"
              placeholder="Tags (comma-separated, e.g. react, hooks, api)"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 transition mb-4"
            />
            <button
              onClick={addSnippet}
              disabled={!title.trim() || !code.trim()}
              className="rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-2 text-sm font-medium transition"
            >
              Save Snippet
            </button>
          </div>
        )}

        {/* Snippets list */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-12 text-center">
            <div className="text-4xl mb-4">{"</>"}</div>
            <h3 className="text-lg font-semibold text-neutral-300 mb-2">
              {snippets.length === 0 ? "No snippets yet" : "No matching snippets"}
            </h3>
            <p className="text-sm text-neutral-500 max-w-md mx-auto">
              {snippets.length === 0
                ? "Click \"+ New Snippet\" to save your first code snippet. Organize your code with titles, languages, and tags for easy searching later."
                : "Try adjusting your search query, language filter, or selected tag to find what you're looking for."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((snippet) => (
              <div
                key={snippet.id}
                className="rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden"
              >
                {/* Snippet header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
                  <div className="flex items-center gap-3 min-w-0">
                    <h3 className="font-semibold truncate">{snippet.title}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 whitespace-nowrap">
                      {snippet.language}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <button
                      onClick={() => copyToClipboard(snippet)}
                      className="text-xs px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 transition"
                    >
                      {copiedId === snippet.id ? "Copied!" : "Copy"}
                    </button>
                    <button
                      onClick={() => deleteSnippet(snippet.id)}
                      className="text-xs px-3 py-1 rounded-lg bg-neutral-800 hover:bg-red-900/50 text-neutral-500 hover:text-red-400 border border-neutral-700 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Code block */}
                <div className="overflow-x-auto">
                  <pre className="p-4 text-sm font-mono leading-relaxed">
                    <code
                      dangerouslySetInnerHTML={{
                        __html: highlightCode(snippet.code, snippet.language),
                      }}
                    />
                  </pre>
                </div>

                {/* Tags */}
                {snippet.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 px-4 py-3 border-t border-neutral-800">
                    {snippet.tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setFilterTag(tag)}
                        className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 hover:bg-purple-500/20 hover:text-purple-300 border border-neutral-700 transition"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Prompt */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 mt-8">
          <h2 className="text-lg font-semibold text-purple-400 mb-3">Built with this prompt</h2>
          <pre className="text-sm text-neutral-300 whitespace-pre-wrap bg-neutral-950 rounded-xl p-4 border border-neutral-800">
            {prompt}
          </pre>
          <div className="flex items-center gap-4 mt-4">
            <button
              onClick={() => navigator.clipboard.writeText(prompt)}
              className="text-sm text-purple-400 hover:text-purple-300 transition"
            >
              Copy prompt
            </button>
            <a
              href="/tools/project-starter"
              className="text-sm text-neutral-500 hover:text-white transition"
            >
              Try in Project Starter →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
