import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold tracking-tighter bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent mb-6">
          404
        </div>
        <h1 className="text-2xl font-bold mb-3">Page not found</h1>
        <p className="text-neutral-400 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-purple-500 text-white font-semibold rounded-xl hover:bg-purple-600 transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/tools"
            className="px-6 py-3 bg-white/5 hover:bg-white/10 text-neutral-200 font-semibold rounded-xl border border-white/10 hover:border-white/20 transition-all"
          >
            Browse Tools
          </Link>
        </div>
      </div>
    </div>
  );
}
