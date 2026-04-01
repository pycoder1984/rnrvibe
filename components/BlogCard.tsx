import Link from "next/link";

interface BlogCardProps {
  href: string;
  title: string;
  description: string;
  date?: string;
  readTime?: string;
  difficulty?: string;
}

export default function BlogCard({ href, title, description, date, readTime, difficulty }: BlogCardProps) {
  return (
    <Link href={href} className="group block">
      <article className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 transition-all duration-300 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/5">
        <div className="mb-3 flex items-center gap-3 text-xs text-neutral-500">
          {date && <time>{new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</time>}
          {readTime && <span>{readTime}</span>}
          {difficulty && (
            <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-purple-300">
              {difficulty}
            </span>
          )}
        </div>
        <h3 className="text-lg font-semibold tracking-tight text-white transition-colors group-hover:text-purple-400">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-neutral-400">
          {description}
        </p>
      </article>
    </Link>
  );
}
