"use client";

import BlogNav from "@/components/BlogNav";
import { useState } from "react";

interface Prompt {
  title: string;
  category: string;
  prompt: string;
}

const prompts: Prompt[] = [
  {
    title: "Landing Page",
    category: "Frontend",
    prompt: `Build a modern landing page with:
- A hero section with a headline, subtitle, and CTA button
- A features section with 3 cards (icon, title, description)
- A testimonials section
- A footer with links
- Use a dark background with a purple accent color
- Make it responsive and mobile-friendly
- Use HTML, Tailwind CSS, and vanilla JavaScript`,
  },
  {
    title: "REST API",
    category: "Backend",
    prompt: `Create a REST API with these endpoints:
- GET /api/items — list all items (support ?page=1&limit=10)
- GET /api/items/:id — get a single item
- POST /api/items — create a new item (validate required fields)
- PUT /api/items/:id — update an item
- DELETE /api/items/:id — delete an item
- Return proper HTTP status codes and JSON error messages
- Use Express.js with TypeScript`,
  },
  {
    title: "Authentication System",
    category: "Backend",
    prompt: `Build a simple auth system with:
- User registration with email and password
- Password hashing with bcrypt
- Login endpoint that returns a JWT token
- Middleware to protect routes
- Input validation (email format, password minimum length)
- Use Node.js, Express, and a SQLite database`,
  },
  {
    title: "Dashboard UI",
    category: "Frontend",
    prompt: `Create an admin dashboard with:
- A sidebar navigation with icons and labels
- A top bar with search and user avatar
- A main content area with:
  - 4 stat cards (e.g. users, revenue, orders, growth)
  - A line chart placeholder
  - A recent activity table
- Collapsible sidebar on mobile
- Dark theme with neutral colors
- Use React and Tailwind CSS`,
  },
  {
    title: "Database Schema",
    category: "Database",
    prompt: `Design a database schema for a blog platform:
- Users: id, email, name, avatar, bio, created_at
- Posts: id, author_id, title, slug, content, published, created_at, updated_at
- Comments: id, post_id, author_id, body, created_at
- Tags: id, name, slug
- Post-tag relationship (many-to-many)
- Add proper indexes and foreign keys
- Use PostgreSQL with Prisma ORM, give me the schema.prisma file`,
  },
  {
    title: "React Form with Validation",
    category: "Frontend",
    prompt: `Build a contact form in React with:
- Fields: name, email, phone (optional), message
- Real-time validation:
  - Name required, min 2 characters
  - Email required, valid format
  - Message required, min 10 characters
- Show inline error messages below each field
- Disable submit button until form is valid
- Show a success message after submission
- Style with Tailwind CSS, clean minimal design`,
  },
  {
    title: "CLI Tool",
    category: "Tools",
    prompt: `Create a command-line tool in Node.js that:
- Accepts a directory path as an argument
- Scans all files recursively
- Outputs a tree view of the file structure
- Shows file sizes in human-readable format (KB, MB)
- Supports --ignore flag to skip directories (e.g. node_modules)
- Add colored output using chalk
- Include --help flag with usage instructions`,
  },
  {
    title: "Responsive Email Template",
    category: "Frontend",
    prompt: `Create an HTML email template for a welcome email:
- Company logo at the top
- Greeting with the user's name (use {{name}} placeholder)
- Welcome message paragraph
- A "Get Started" CTA button (purple background, white text)
- 3 feature highlights with icons
- Footer with unsubscribe link and company address
- Must work in Gmail, Outlook, and Apple Mail
- Use inline CSS only, table-based layout for compatibility`,
  },
  {
    title: "Cron Job / Scheduled Task",
    category: "Backend",
    prompt: `Create a Node.js script that runs as a scheduled task:
- Fetch data from a public API every hour
- Store the results in a local JSON file
- Keep only the last 24 entries (rotating log)
- Log each run with timestamp to a log file
- Handle errors gracefully (network timeouts, API errors)
- Use node-cron for scheduling
- Include a --run-now flag for manual testing`,
  },
];

const categories = ["All", ...Array.from(new Set(prompts.map((p) => p.category)))];

export default function PromptLibraryPage() {
  const [filter, setFilter] = useState("All");
  const [copied, setCopied] = useState<number | null>(null);

  const filtered = filter === "All" ? prompts : prompts.filter((p) => p.category === filter);

  const copyPrompt = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <BlogNav />
      <div className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Prompt Library</h1>
        <p className="mb-8 text-neutral-400">
          Ready-made vibecoding prompts. Click to copy, paste into your AI tool of choice.
        </p>

        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                filter === cat
                  ? "bg-purple-500 text-white"
                  : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => (
            <div
              key={i}
              className="group relative rounded-xl border border-neutral-800 bg-neutral-900 p-5 transition hover:border-purple-500/30"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs text-purple-300">
                  {p.category}
                </span>
                <button
                  onClick={() => copyPrompt(p.prompt, i)}
                  className="rounded-lg bg-neutral-800 px-3 py-1 text-xs text-neutral-400 transition hover:bg-purple-500 hover:text-white"
                >
                  {copied === i ? "Copied!" : "Copy"}
                </button>
              </div>
              <h3 className="mb-2 font-semibold">{p.title}</h3>
              <pre className="whitespace-pre-wrap text-xs leading-relaxed text-neutral-400 max-h-40 overflow-y-auto">
                {p.prompt}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
