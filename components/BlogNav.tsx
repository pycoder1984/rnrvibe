"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useCallback } from "react";
import SearchModal from "@/components/SearchModal";

export default function BlogNav() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSearch = useCallback(() => setSearchOpen((prev) => !prev), []);

  const links = [
    { href: "/", label: "Home" },
    { href: "/tools", label: "Tools" },
    { href: "/projects", label: "Projects" },
    { href: "/blog", label: "Blog" },
    { href: "/guides", label: "Guides" },
    { href: "/compare", label: "Compare" },
    { href: "/about", label: "About" },
  ];

  return (
    <>
      <nav className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            <span className="text-purple-400">RnR</span> Vibe
          </Link>
          <div className="flex items-center gap-4 sm:gap-6 text-sm text-neutral-400">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition hover:text-white hidden sm:inline ${
                  pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href))
                    ? "text-purple-400"
                    : ""
                }`}
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={toggleSearch}
              aria-label="Search"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-white hover:border-neutral-600 transition-all text-xs"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden sm:inline px-1.5 py-0.5 bg-neutral-800 rounded text-[10px] border border-neutral-700">
                Ctrl K
              </kbd>
            </button>
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
              className="sm:hidden flex items-center p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-white hover:border-neutral-600 transition-all"
            >
              {mobileMenuOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-neutral-800 bg-neutral-950/95 backdrop-blur-xl">
            <div className="flex flex-col px-6 py-4 gap-3 text-sm text-neutral-400">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`hover:text-white transition py-1 ${
                    pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href))
                      ? "text-purple-400"
                      : ""
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
      <SearchModal open={searchOpen} onClose={toggleSearch} />
    </>
  );
}
