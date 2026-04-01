import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Color Palette Generator — AI Color Schemes",
  description: "Describe a mood or brand and get a 5-color palette with CSS variables and Tailwind config. Free AI color palette tool.",
  alternates: { canonical: "https://www.rnrvibe.com/tools/color-palette" },
  openGraph: {
    title: "Color Palette Generator — AI Color Schemes",
    description: "Describe a mood or brand and get a 5-color palette with CSS variables and Tailwind config.",
    images: ["/api/og?title=Color%20Palette&type=article"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Color Palette Generator — AI Color Schemes",
    description: "Describe a mood or brand and get a 5-color palette with CSS variables and Tailwind config.",
    images: ["/api/og?title=Color%20Palette&type=article"],
  },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
