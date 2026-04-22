import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "RnR Vibe — Lightweight Vibecoding Platform",
    template: "%s — RnR Vibe",
  },
  description:
    "Code with the vibe, ship with confidence. Free AI-powered vibecoding tools, guides, and resources. No sign-up required.",
  applicationName: "RnR Vibe",
  keywords: [
    "rnrvibe",
    "rnr vibe",
    "RnR Vibe",
    "RnRVibe",
    "vibecoding",
    "vibe coding",
    "vibe coding tutorial",
    "AI coding tools",
    "AI coding assistant",
    "AI developer tools",
    "AI code generator",
    "free AI tools",
    "free AI chat",
    "free AI image generator",
    "AI research tool",
    "local AI",
    "local LLM",
    "Ollama tools",
    "Ollama web UI",
    "Stable Diffusion online",
    "MusicGen",
    "open source AI tools",
    "self-hosted AI",
    "AI pair programming",
    "prompt engineering",
  ],
  metadataBase: new URL("https://www.rnrvibe.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.rnrvibe.com",
    siteName: "RnR Vibe",
    title: "RnR Vibe — Lightweight Vibecoding Platform",
    description:
      "Code with the vibe, ship with confidence. Free AI-powered vibecoding tools, guides, and resources.",
  },
  twitter: {
    card: "summary_large_image",
    title: "RnR Vibe — Lightweight Vibecoding Platform",
    description:
      "Code with the vibe, ship with confidence. Free AI-powered vibecoding tools, guides, and resources.",
  },
  verification: {
    google: "MbAFJ3VwwWxvXrUlvfxWw1gz-1q4k3rML_sYQmtCnVE",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://www.rnrvibe.com",
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "RnR Vibe",
  alternateName: ["RnRVibe", "rnrvibe", "rnr vibe", "RNR Vibe"],
  url: "https://www.rnrvibe.com",
  description:
    "Lightweight vibecoding platform with free AI-powered tools, guides, and resources.",
  inLanguage: "en-US",
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "RnR Vibe",
  alternateName: ["RnRVibe", "rnrvibe", "rnr vibe", "RNR Vibe"],
  url: "https://www.rnrvibe.com",
  logo: "https://www.rnrvibe.com/favicon.ico",
  description:
    "RnR Vibe is a lightweight vibecoding platform offering free AI-powered tools, guides, and interactive projects for developers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <link rel="alternate" type="application/rss+xml" title="RnR Vibe RSS Feed" href="/feed.xml" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
