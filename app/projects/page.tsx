import BlogNav from "@/components/BlogNav";
import Link from "next/link";
import { projects } from "@/data/projects";
import Image from "next/image";

export const metadata = {
  title: "Sample Projects — Vibecoded Demos | RnR Vibe",
  description: "Interactive projects built entirely with vibecoding. Try live demos, see the prompts used, and learn by example. Free, no sign-up required.",
  alternates: { canonical: "https://www.rnrvibe.com/projects" },
  openGraph: {
    title: "Sample Projects — RnR Vibe",
    description: "Interactive projects built entirely with vibecoding. Try live demos and see the prompts used.",
    images: ["/api/og?title=Sample%20Projects&type=article"],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Sample Projects — RnR Vibe",
    description: "Interactive projects built entirely with vibecoding. Try live demos and see the prompts used.",
    images: ["/api/og?title=Sample%20Projects&type=article"],
  },
};

export default function ProjectsPage() {
  return (
    <div className="relative min-h-screen bg-neutral-950 text-white">
      <Image
        src="/tools-bg.png"
        alt=""
        fill
        className="fixed inset-0 object-cover opacity-10 pointer-events-none"
        priority
      />
      <div className="fixed inset-0 bg-gradient-to-b from-neutral-950/40 via-neutral-950/80 to-neutral-950 pointer-events-none" />

      <div className="relative z-10">
        <BlogNav />

        <div className="relative h-48 sm:h-64 overflow-hidden">
          <Image src="/tools-bg.png" alt="" fill className="absolute inset-0 object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/30 to-transparent" />
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Sample Projects</h1>
            <p className="mt-3 text-neutral-400 max-w-lg">
              Interactive projects built entirely with vibecoding. Try the live demos and see the prompts used.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link key={project.href} href={project.href} className="group block">
                <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 transition-all duration-300 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/5 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl">{project.icon}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${project.difficulty === "Beginner" ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                        {project.difficulty}
                      </span>
                      <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-1 rounded-full">
                        Vibecoded in {project.time}
                      </span>
                    </div>
                  </div>
                  <h2 className="text-lg font-semibold tracking-tight text-white transition-colors group-hover:text-purple-400">
                    {project.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-400 flex-1">
                    {project.description}
                  </p>
                  <div className="flex gap-2 mt-4 flex-wrap">
                    {project.tags.map((tag) => (
                      <span key={tag} className="text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
