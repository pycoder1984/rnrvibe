import BlogCard from "@/components/BlogCard";
import BlogNav from "@/components/BlogNav";
import Image from "next/image";
import { getPostsByType } from "@/lib/mdx";

export const metadata = {
  title: "Vibecoding Blog — Tips, Tools & Tutorials — RnR Vibe",
  description: "Articles about vibecoding, AI coding tools, prompt engineering, and building software with natural language. Tips and tutorials for beginners and pros.",
  alternates: { canonical: "https://www.rnrvibe.com/blog" },
  openGraph: {
    title: "Vibecoding Blog — RnR Vibe",
    description: "Articles about vibecoding, AI coding tools, and building software with natural language.",
    images: ["/api/og?title=Vibecoding%20Blog&type=blog"],
  },
};

export default function BlogPage() {
  const posts = getPostsByType("blog");

  return (
    <div className="relative min-h-screen bg-neutral-950 text-white">
      {/* Full-page background image */}
      <Image
        src="/blog-header.jpeg"
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
          src="/blog-header.jpeg"
          alt=""
          fill
          className="absolute inset-0 object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/30 to-transparent" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Blog</h1>
          <p className="mt-3 text-neutral-400 max-w-lg">
            Articles about vibecoding, AI tools, and modern software development.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogCard
              key={post.slug}
              href={`/blog/${post.slug}`}
              title={post.title}
              description={post.description}
              date={post.date}
              readTime={post.readTime}
            />
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}
