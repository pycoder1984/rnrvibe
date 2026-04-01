export const metadata = {
  title: "Accessibility Checker — Free AI Tool | RnR Vibe",
  description: "Paste HTML or JSX code and get a WCAG 2.1 AA accessibility audit with specific fixes and a compliance checklist. Free, no sign-up.",
  alternates: { canonical: "https://www.rnrvibe.com/tools/accessibility-checker" },
  openGraph: {
    title: "Accessibility Checker — RnR Vibe",
    description: "Check your code for accessibility issues with AI. Free, no sign-up.",
    images: ["/api/og?title=Accessibility%20Checker&type=article"],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Accessibility Checker — RnR Vibe",
    description: "Check your code for accessibility issues with AI. Free, no sign-up.",
    images: ["/api/og?title=Accessibility%20Checker&type=article"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
