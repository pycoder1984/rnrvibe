import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Project Starter — AI Tech Stack Generator",
  description: "Describe your project idea and get a recommended tech stack, file structure, and starter prompts. Free vibecoding project planning tool.",
  alternates: { canonical: "https://www.rnrvibe.com/tools/project-starter" },
  openGraph: {
    title: "Project Starter — AI Tech Stack Generator",
    description: "Describe your project idea and get a recommended tech stack, file structure, and starter prompts.",
    images: ["/api/og?title=Project%20Starter&type=article"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Project Starter — AI Tech Stack Generator",
    description: "Describe your project idea and get a recommended tech stack, file structure, and starter prompts.",
    images: ["/api/og?title=Project%20Starter&type=article"],
  },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
