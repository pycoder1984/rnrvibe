export const metadata = {
  title: "Sample Projects Built with Vibecoding — RnR Vibe",
  description: "Interactive sample projects built entirely with vibecoding. Try live demos, see the prompts used, and build your own. Pomodoro timer, markdown editor, expense tracker, and more.",
  alternates: { canonical: "https://www.rnrvibe.com/projects" },
  openGraph: {
    title: "Sample Projects Built with Vibecoding — RnR Vibe",
    description: "Interactive projects built with AI. Try live demos and see the prompts used.",
    images: ["/api/og?title=Vibecoded%20Projects&type=article"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
