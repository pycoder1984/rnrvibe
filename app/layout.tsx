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

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "RnR Vibe",
  url: "https://www.rnrvibe.com",
  description:
    "Lightweight vibecoding platform with free AI-powered tools, guides, and resources.",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://www.rnrvibe.com/blog?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
