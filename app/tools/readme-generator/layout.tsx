import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "README Generator — Create Professional READMEs",
  description: "Describe your project or paste a file tree and get a professional README.md ready for GitHub. Free AI-powered README generator.",
  alternates: { canonical: "https://www.rnrvibe.com/tools/readme-generator" },
  openGraph: {
    title: "README Generator — Create Professional READMEs",
    description: "Describe your project or paste a file tree and get a professional README.md ready for GitHub.",
    images: ["/api/og?title=README%20Generator&type=article"],
  },
  twitter: {
    card: "summary_large_image",
    title: "README Generator — Create Professional READMEs",
    description: "Describe your project or paste a file tree and get a professional README.md ready for GitHub.",
    images: ["/api/og?title=README%20Generator&type=article"],
  },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
