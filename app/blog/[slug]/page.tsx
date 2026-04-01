import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getPostBySlug, getPostsByType } from "@/lib/mdx";
import BlogNav from "@/components/BlogNav";
import Link from "next/link";
import ReadingProgress from "@/components/ReadingProgress";
import ShareButtons from "@/components/ShareButtons";
import NewsletterSignup from "@/components/NewsletterSignup";
import BackToTop from "@/components/BackToTop";

export function generateStaticParams() {
  return getPostsByType("blog").map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const { meta } = getPostBySlug("blog", slug);
    return {
      title: `${meta.title} — RnR Vibe`,
      description: meta.description,
      alternates: { canonical: `https://www.rnrvibe.com/blog/${slug}` },
      openGraph: {
        title: meta.title,
        description: meta.description,
        type: "article",
        publishedTime: meta.date,
        images: [`/api/og?title=${encodeURIComponent(meta.title)}&type=blog`],
      },
      twitter: {
        card: "summary_large_image",
        title: meta.title,
        description: meta.description,
        images: [`/api/og?title=${encodeURIComponent(meta.title)}&type=blog`],
      },
    };
  } catch {
    return { title: "Not Found" };
  }
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let post;
  try {
    post = getPostBySlug("blog", slug);
  } catch {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.meta.title,
    description: post.meta.description,
    datePublished: post.meta.date,
    dateModified: post.meta.date,
    url: `https://www.rnrvibe.com/blog/${slug}`,
    author: {
      "@type": "Organization",
      name: "RnR Vibe",
      url: "https://www.rnrvibe.com",
    },
    publisher: {
      "@type": "Organization",
      name: "RnR Vibe",
      url: "https://www.rnrvibe.com",
    },
    image: `/api/og?title=${encodeURIComponent(post.meta.title)}&type=blog`,
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ReadingProgress />
      <BlogNav />
      <article className="mx-auto max-w-3xl px-6 py-16">
        <Link
          href="/blog"
          className="mb-8 inline-flex items-center gap-1 text-sm text-neutral-500 transition hover:text-purple-400"
        >
          &larr; Back to Blog
        </Link>

        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm text-neutral-500">
              <time>
                {new Date(post.meta.date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </time>
              {post.meta.readTime && <span>{post.meta.readTime}</span>}
            </div>
            <ShareButtons title={post.meta.title} slug={slug} type="blog" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {post.meta.title}
          </h1>
        </div>

        <div className="prose">
          <MDXRemote source={post.content} />
        </div>

        <div className="mt-16">
          <NewsletterSignup />
        </div>
      </article>
      <BackToTop />
    </div>
  );
}
