import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Regex Generator — Natural Language to Regex",
  description: "Describe what you want to match in plain English and get the regex pattern with examples. Free AI-powered regex tool for vibecoding.",
  alternates: { canonical: "https://www.rnrvibe.com/tools/regex-generator" },
  openGraph: {
    title: "Regex Generator — Natural Language to Regex",
    description: "Describe what you want to match in plain English and get the regex pattern with examples.",
    images: ["/api/og?title=Regex%20Generator&type=article"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Regex Generator — Natural Language to Regex",
    description: "Describe what you want to match in plain English and get the regex pattern with examples.",
    images: ["/api/og?title=Regex%20Generator&type=article"],
  },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
