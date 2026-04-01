import BlogCard from "@/components/BlogCard";
import BlogNav from "@/components/BlogNav";
import Image from "next/image";
import { getPostsByType } from "@/lib/mdx";

export const metadata = {
  title: "Vibecoding Guides & Tutorials — RnR Vibe",
  description: "Step-by-step vibecoding tutorials — from getting started to full-stack apps, database design, deployment, security, and UI building with AI.",
  alternates: { canonical: "https://www.rnrvibe.com/guides" },
  openGraph: {
    title: "Vibecoding Guides & Tutorials — RnR Vibe",
    description: "Step-by-step vibecoding tutorials for beginners and intermediate developers.",
    images: ["/api/og?title=Vibecoding%20Guides&type=guide"],
  },
};

export default function GuidesPage() {
  const guides = getPostsByType("guides");

  return (
    <div className="relative min-h-screen bg-neutral-950 text-white">
      {/* Full-page background image */}
      <Image
        src="/guides-header.jpeg"
        alt=""
        fill
        className="fixed inset-0 object-cover opacity-8 pointer-events-none"
        priority
      />
      <div className="fixed inset-0 bg-gradient-to-b from-neutral-950/40 via-neutral-950/80 to-neutral-950 pointer-events-none" />

      <div className="relative z-10">
      <BlogNav />

      {/* Hero banner */}
      <div className="relative h-48 sm:h-64 overflow-hidden">
        <Image
          src="/guides-header.jpeg"
          alt=""
          fill
          className="absolute inset-0 object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/30 to-transparent" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Guides</h1>
          <p className="mt-3 text-neutral-400 max-w-lg">
            Step-by-step tutorials to level up your vibecoding skills.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-6 sm:grid-cols-2">
          {guides.map((guide) => (
            <BlogCard
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              title={guide.title}
              description={guide.description}
              readTime={guide.readTime}
              difficulty={guide.difficulty}
            />
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}
