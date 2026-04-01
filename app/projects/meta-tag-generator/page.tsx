"use client";

import BlogNav from "@/components/BlogNav";
import { useState } from "react";

export default function MetaTagGeneratorPage() {
  const [title, setTitle] = useState("My Awesome Project");
  const [description, setDescription] = useState("A cool project built with vibecoding. Fast, modern, and open source.");
  const [url, setUrl] = useState("https://example.com");
  const [image, setImage] = useState("https://example.com/og-image.png");
  const [siteName, setSiteName] = useState("My Project");
  const [twitterHandle, setTwitterHandle] = useState("@myhandle");
  const [copied, setCopied] = useState(false);

  const metaTags = `<!-- Primary Meta Tags -->
<title>${title}</title>
<meta name="title" content="${title}" />
<meta name="description" content="${description}" />

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website" />
<meta property="og:url" content="${url}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:image" content="${image}" />
<meta property="og:site_name" content="${siteName}" />

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image" />
<meta property="twitter:url" content="${url}" />
<meta property="twitter:title" content="${title}" />
<meta property="twitter:description" content="${description}" />
<meta property="twitter:image" content="${image}" />
<meta property="twitter:site" content="${twitterHandle}" />

<!-- Canonical -->
<link rel="canonical" href="${url}" />`;

  const copy = () => {
    navigator.clipboard.writeText(metaTags);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const prompt = `Build a meta tag generator in React with:
- Input fields for: title, description, URL, OG image URL, site name, Twitter handle
- Live preview of generated meta tags (Primary, Open Graph, Twitter Card, Canonical)
- Google search result preview showing title and description
- Twitter/social card preview
- Copy all tags button
- Syntax-highlighted output
- Dark theme`;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <BlogNav />
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Meta Tag Generator</h1>
        <p className="mb-8 text-neutral-400">An SEO meta tag builder built with vibecoding in ~5 minutes.</p>

        {/* Demo */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Inputs */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Details</h3>
              {[
                { label: "Title", value: title, set: setTitle, placeholder: "Page title" },
                { label: "Description", value: description, set: setDescription, placeholder: "Page description" },
                { label: "URL", value: url, set: setUrl, placeholder: "https://..." },
                { label: "OG Image URL", value: image, set: setImage, placeholder: "https://.../image.png" },
                { label: "Site Name", value: siteName, set: setSiteName, placeholder: "Your site" },
                { label: "Twitter Handle", value: twitterHandle, set: setTwitterHandle, placeholder: "@handle" },
              ].map((field) => (
                <div key={field.label}>
                  <label className="text-xs text-neutral-500 block mb-1">{field.label}</label>
                  <input
                    value={field.value}
                    onChange={(e) => field.set(e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-200 placeholder-neutral-600 focus:border-purple-500/50 focus:outline-none"
                  />
                </div>
              ))}
            </div>

            {/* Previews */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Previews</h3>

              {/* Google preview */}
              <div className="rounded-lg bg-white p-4">
                <div className="text-sm text-green-700 truncate">{url}</div>
                <div className="text-lg text-blue-700 truncate hover:underline cursor-pointer">{title}</div>
                <div className="text-sm text-gray-600 line-clamp-2">{description}</div>
              </div>

              {/* Social card preview */}
              <div className="rounded-lg border border-neutral-700 overflow-hidden">
                <div className="h-32 bg-neutral-800 flex items-center justify-center text-neutral-600 text-xs">
                  {image ? "OG Image Preview" : "No image set"}
                </div>
                <div className="p-3 bg-neutral-800">
                  <div className="text-xs text-neutral-500 uppercase">{siteName}</div>
                  <div className="text-sm font-semibold text-neutral-200 truncate">{title}</div>
                  <div className="text-xs text-neutral-400 line-clamp-2">{description}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Output */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Generated Tags</h3>
              <button
                onClick={copy}
                className="rounded-lg bg-purple-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-purple-600 transition"
              >
                {copied ? "Copied!" : "Copy All"}
              </button>
            </div>
            <pre className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 font-mono text-xs text-neutral-300 overflow-x-auto whitespace-pre-wrap">
              {metaTags}
            </pre>
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
