"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Particles from "@/components/Particles";
import ScrollVideo from "@/components/ScrollVideo";
import TiltCard from "@/components/TiltCard";
import NewsletterSignup from "@/components/NewsletterSignup";
import SearchModal from "@/components/SearchModal";
import RotatingTagline from "@/components/RotatingTagline";
import StatsCounter from "@/components/StatsCounter";

export default function Home() {
  const sectionsRef = useRef<(HTMLElement | null)[]>([]);

  // Parallax layer refs — each hero element scrolls at a different speed.
  // Transforms are applied via ref + rAF (not React state) to avoid re-rendering
  // the whole page on every scroll event.
  const parallaxBadgeRef = useRef<HTMLDivElement>(null);
  const parallaxTitleRef = useRef<HTMLDivElement>(null);
  const parallaxSubtitleRef = useRef<HTMLDivElement>(null);
  const parallaxCtaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Intersection Observer for section reveal animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    sectionsRef.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Hero parallax — small factors so the text lags behind the scroll,
    // giving a subtle depth effect as the user leaves the hero.
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    let raf = 0;
    const update = () => {
      const y = window.scrollY;
      if (parallaxBadgeRef.current) {
        parallaxBadgeRef.current.style.transform = `translate3d(0, ${y * 0.25}px, 0)`;
      }
      if (parallaxTitleRef.current) {
        parallaxTitleRef.current.style.transform = `translate3d(0, ${y * 0.12}px, 0)`;
      }
      if (parallaxSubtitleRef.current) {
        parallaxSubtitleRef.current.style.transform = `translate3d(0, ${y * 0.18}px, 0)`;
      }
      if (parallaxCtaRef.current) {
        parallaxCtaRef.current.style.transform = `translate3d(0, ${y * 0.06}px, 0)`;
      }
      raf = 0;
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const toggleSearch = useCallback(() => setSearchOpen((prev) => !prev), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const addRef = (index: number) => (el: HTMLElement | null) => {
    sectionsRef.current[index] = el;
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white overflow-x-hidden">
      {/* Fixed scroll-controlled video background — plays through as you scroll the entire page */}
      <ScrollVideo className="fixed inset-0 w-full h-full opacity-30 pointer-events-none" />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-neutral-950/60 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
          <a href="/" className="text-2xl font-bold tracking-tight">
            <span className="text-purple-400">RnR</span> Vibe
          </a>
          <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-neutral-400">
            <a href="/tools" className="hidden sm:inline hover:text-white transition duration-300 whitespace-nowrap">Tools</a>
            <a href="/projects" className="hidden sm:inline hover:text-white transition duration-300 whitespace-nowrap">Projects</a>
            <a href="/blog" className="hidden sm:inline hover:text-white transition duration-300 whitespace-nowrap">Blog</a>
            <a href="/guides" className="hidden sm:inline hover:text-white transition duration-300 whitespace-nowrap">Guides</a>
            <a href="#contact" className="hidden sm:inline hover:text-white transition duration-300 whitespace-nowrap">Contact</a>
            <button
              onClick={toggleSearch}
              aria-label="Search"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-neutral-500 hover:text-white hover:border-white/20 transition-all text-xs"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <kbd className="hidden sm:inline text-[10px]">Ctrl K</kbd>
            </button>
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
              className="sm:hidden flex items-center p-1.5 rounded-lg bg-white/5 border border-white/10 text-neutral-500 hover:text-white hover:border-white/20 transition-all"
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
          <div className="sm:hidden border-t border-white/5 bg-neutral-950/95 backdrop-blur-xl">
            <div className="flex flex-col px-6 py-4 gap-3 text-sm text-neutral-400">
              <a href="/tools" className="hover:text-white transition duration-300 py-1" onClick={() => setMobileMenuOpen(false)}>Tools</a>
              <a href="/projects" className="hover:text-white transition duration-300 py-1" onClick={() => setMobileMenuOpen(false)}>Projects</a>
              <a href="/blog" className="hover:text-white transition duration-300 py-1" onClick={() => setMobileMenuOpen(false)}>Blog</a>
              <a href="/guides" className="hover:text-white transition duration-300 py-1" onClick={() => setMobileMenuOpen(false)}>Guides</a>
              <a href="/compare" className="hover:text-white transition duration-300 py-1" onClick={() => setMobileMenuOpen(false)}>Compare</a>
              <a href="/about" className="hover:text-white transition duration-300 py-1" onClick={() => setMobileMenuOpen(false)}>About</a>
              <a href="#contact" className="hover:text-white transition duration-300 py-1" onClick={() => setMobileMenuOpen(false)}>Contact</a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative">
        <div className="relative flex items-center justify-center overflow-hidden" style={{ minHeight: "100dvh" }}>

          {/* Floating code particles */}
          <Particles />

          {/* Morphing purple/indigo gradient — slow shift underneath everything */}
          <div className="morph-gradient absolute inset-0 pointer-events-none" style={{ zIndex: 1 }} />

          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-transparent to-neutral-950" style={{ zIndex: 2 }} />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/80 via-transparent to-neutral-950/80" style={{ zIndex: 2 }} />

          {/* Purple glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

          {/* Hero content */}
          <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-5xl mx-auto">
            <div ref={parallaxBadgeRef} className="will-change-transform">
              <h1 className="hero-badge inline-block px-5 py-2 mb-8 text-xs font-semibold uppercase tracking-widest text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded-full">
                RnR Vibe — Lightweight Vibecoding Platform
              </h1>
            </div>
            <div ref={parallaxTitleRef} className="will-change-transform">
              <RotatingTagline
                as="h2"
                className="text-5xl sm:text-6xl md:text-8xl font-bold tracking-tighter leading-[0.9]"
                phrases={[
                  { prefix: "Code with the", highlight: "vibe" },
                  { prefix: "Build with the", highlight: "flow" },
                  { prefix: "Ship with", highlight: "confidence" },
                ]}
              />
            </div>
            <div ref={parallaxSubtitleRef} className="will-change-transform">
              <p className="hero-subtitle mt-8 text-lg md:text-xl text-neutral-400 max-w-2xl leading-relaxed">
                RnR Vibe is a lightweight platform that lets you vibecode your ideas into reality.
                No bloat. No friction. Just you, your code, and the flow.
              </p>
            </div>
            <div ref={parallaxCtaRef} className="will-change-transform">
              <div className="hero-cta flex flex-col sm:flex-row gap-4 mt-12 justify-center">
                <TiltCard
                  href="/tools"
                  className="glow-pulse group relative inline-flex items-center justify-center px-8 py-4 bg-purple-500 text-white font-semibold rounded-xl transition-colors duration-300 hover:bg-purple-600 hover:shadow-[0_0_40px_rgba(168,85,247,0.4)]"
                >
                  <span className="relative z-10">Try Free Tools</span>
                  <span className="absolute inset-0 rounded-xl bg-purple-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </TiltCard>
                <TiltCard
                  href="#features"
                  className="group relative inline-flex items-center justify-center px-8 py-4 bg-white/5 hover:bg-white/10 text-neutral-200 font-semibold rounded-xl border border-white/10 hover:border-white/20 transition-colors duration-300"
                >
                  <span className="relative z-10">Learn More</span>
                </TiltCard>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-neutral-500 text-xs animate-bounce">
            <span>Scroll</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 6l4 4 4-4" />
            </svg>
          </div>
        </div>
      </section>

      {/* Stats — counts up as this section enters the viewport */}
      <section className="relative z-10 px-6 pt-8 pb-16 sm:pt-12 sm:pb-20 max-w-5xl mx-auto">
        <StatsCounter
          stats={[
            { label: "AI Tools", value: 27 },
            { label: "Projects", value: 19 },
            { label: "Blog Posts", value: 29 },
            { label: "Guides", value: 26 },
          ]}
        />
      </section>

      {/* Features */}
      <section
        id="features"
        ref={addRef(0)}
        className="section-reveal px-6 py-28 max-w-6xl mx-auto"
      >
        <div className="text-center mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-4 block">Why Choose Us</span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Why RnR Vibe</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "Lightweight",
              desc: "No heavy frameworks or endless configs. Start coding in seconds, not hours.",
              icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              ),
            },
            {
              title: "Vibe-First",
              desc: "Built around flow state. Minimal UI, maximal focus. Let the vibe guide your code.",
              icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
              ),
            },
            {
              title: "Ship Fast",
              desc: "From idea to deployment in minutes. Built-in tools to get your project live quickly.",
              icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.58-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                </svg>
              ),
            },
          ].map((f, i) => (
            <TiltCard
              key={f.title}
              className="group p-8 rounded-2xl bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 hover:border-purple-500/40 transition-all duration-500 h-full"
            >
              <div className="relative z-10">
                <div className="mb-5 inline-flex p-3 rounded-xl bg-purple-500/10 text-purple-400 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-shadow duration-500">
                  {f.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 group-hover:text-purple-300 transition-colors duration-300">{f.title}</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </TiltCard>
          ))}
        </div>
      </section>

      {/* Free Tools */}
      <section
        ref={addRef(1)}
        className="section-reveal relative px-6 py-28 max-w-6xl mx-auto"
      >
        {/* Tools background image - covers entire section */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img src="/tools-bg.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-10 blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-transparent to-neutral-950" />
        </div>
        <div className="relative z-10">
        <div className="text-center mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-4 block">100% Free</span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">AI-Powered Tools</h2>
          <p className="mt-4 text-neutral-400 max-w-2xl mx-auto">
            No sign-up, no API keys, completely free. Powered by a locally-hosted LLM.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "Prompt Library",
              desc: "Browse ready-made vibecoding prompts for common tasks — landing pages, APIs, auth systems, and more. One click to copy.",
              href: "/tools/prompt-library",
              icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              ),
            },
            {
              title: "Vibe Checker",
              desc: "Paste AI-generated code and get an instant review — bugs, security issues, and improvements flagged by AI.",
              href: "/tools/vibe-checker",
              icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              ),
            },
            {
              title: "Project Starter",
              desc: "Describe your idea, get a recommended tech stack, file structure, and starter prompts to begin building immediately.",
              href: "/tools/project-starter",
              icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.58-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                </svg>
              ),
            },
            {
              title: "Code Explainer",
              desc: "Paste any code snippet and get a plain-English explanation. Perfect for learning from AI-generated code.",
              href: "/tools/code-explainer",
              icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                </svg>
              ),
            },
            {
              title: "Regex Generator",
              desc: "Describe what you want to match in plain English and get the regex pattern with examples.",
              href: "/tools/regex-generator",
              icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                </svg>
              ),
            },
            {
              title: "Color Palette",
              desc: "Describe a mood or brand and get a 5-color palette with CSS variables and Tailwind config.",
              href: "/tools/color-palette",
              icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
                </svg>
              ),
            },
            {
              title: "AI Chat",
              desc: "Chat with an AI assistant about vibecoding, prompts, tools, debugging, and project planning.",
              href: "/tools/chat",
              icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
              ),
            },
            {
              title: "Code Converter",
              desc: "Translate code between 12 languages — JavaScript, Python, Go, Rust, and more. Side-by-side view.",
              href: "/tools/code-converter",
              icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
              ),
            },
            {
              title: "README Generator",
              desc: "Describe your project or paste a file tree and get a professional README.md ready for GitHub.",
              href: "/tools/readme-generator",
              icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              ),
            },
            {
              title: "API Endpoint Generator",
              desc: "Describe your API and get production-ready route handlers with validation for Next.js, Express, or FastAPI.",
              href: "/tools/api-endpoint",
              icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
                </svg>
              ),
            },
            {
              title: "Bug Fixer",
              desc: "Paste broken code and the error message — get an instant fix with a clear explanation of what went wrong.",
              href: "/tools/bug-fixer",
              icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75c1.148 0 2.278.08 3.383.237 1.037.146 1.866.966 1.866 2.013 0 3.728-2.35 6.75-5.25 6.75S6.75 18.728 6.75 15c0-1.046.83-1.867 1.866-2.013A24.204 24.204 0 0112 12.75zm0 0c2.883 0 5.647.508 8.207 1.44a23.91 23.91 0 01-1.152-6.135 3.001 3.001 0 00-2.236-2.888 4.725 4.725 0 00-1.644-.291H8.825a4.725 4.725 0 00-1.644.29 3.001 3.001 0 00-2.236 2.889 23.908 23.908 0 01-1.152 6.135A23.676 23.676 0 0112 12.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125v-1.5z" />
                </svg>
              ),
            },
            {
              title: "SQL Generator",
              desc: "Describe what data you need in plain English and get SQL queries with schema suggestions.",
              href: "/tools/sql-generator",
              icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                </svg>
              ),
            },
            {
              title: "Component Generator",
              desc: "Describe a UI component and get clean React + Tailwind code — responsive and accessible by default.",
              href: "/tools/component-generator",
              icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
                </svg>
              ),
            },
            {
              title: "Git Command Helper",
              desc: "Describe what you want to do in plain English and get the exact Git commands with safety warnings.",
              href: "/tools/git-helper",
              icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
                </svg>
              ),
            },
            {
              title: "Cron Builder",
              desc: "Describe a schedule in plain English and get the cron expression with usage examples.",
              href: "/tools/cron-builder",
              icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
            },
            {
              title: "Env Variable Generator",
              desc: "Describe your tech stack and get a comprehensive .env.example file with setup instructions.",
              href: "/tools/env-generator",
              icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ),
            },
            {
              title: "Commit Message Writer",
              desc: "Describe your changes or paste a diff and get a proper conventional commit message.",
              href: "/tools/commit-writer",
              icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              ),
            },
            {
              title: "Stack Recommender",
              desc: "Describe your project idea and get detailed tech stack comparisons with pros, cons, and complexity ratings.",
              href: "/tools/stack-recommender",
              icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
                </svg>
              ),
            },
            {
              title: "Accessibility Checker",
              desc: "Paste HTML or JSX and get a WCAG 2.1 AA accessibility audit with specific fixes.",
              href: "/tools/accessibility-checker",
              icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ),
            },
          ].map((t, i) => (
            <TiltCard
              key={t.title}
              href={t.href}
              className="group p-8 rounded-2xl bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 hover:border-purple-500/40 transition-all duration-500 h-full"
            >
              <div className="relative z-10">
                <div className="mb-5 inline-flex p-3 rounded-xl bg-purple-500/10 text-purple-400 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-shadow duration-500">
                  {t.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 group-hover:text-purple-300 transition-colors duration-300">{t.title}</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">{t.desc}</p>
                <span className="inline-flex items-center gap-1 mt-5 text-sm font-medium text-purple-400 group-hover:gap-2 transition-all duration-300">
                  Try it free
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 7h12M8 2l5 5-5 5" />
                  </svg>
                </span>
              </div>
            </TiltCard>
          ))}
        </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how"
        ref={addRef(2)}
        className="section-reveal px-6 py-28 max-w-4xl mx-auto"
      >
        <div className="text-center mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-4 block">Simple Workflow</span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">How It Works</h2>
        </div>
        <div className="space-y-12">
          {[
            { step: "01", title: "Describe your vibe", desc: "Tell RnR what you want to build. Use natural language, pseudocode, or just vibes." },
            { step: "02", title: "Code flows", desc: "The platform generates clean, lightweight code aligned with your intent." },
            { step: "03", title: "Ship it", desc: "Deploy instantly. No CI/CD rabbit holes. Your project goes live when you say so." },
          ].map((s, i) => (
            <div
              key={s.step}
              className="group flex gap-8 items-start p-6 rounded-2xl transition-all duration-500 hover:bg-white/[0.02]"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <span className="text-5xl font-bold bg-gradient-to-b from-purple-400 to-purple-600/30 bg-clip-text text-transparent font-mono shrink-0">
                {s.step}
              </span>
              <div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-purple-300 transition-colors duration-300">{s.title}</h3>
                <p className="text-neutral-400 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section
        id="contact"
        ref={addRef(3)}
        className="section-reveal px-6 py-28 max-w-3xl mx-auto text-center"
      >
        <div className="relative p-12 rounded-3xl bg-gradient-to-b from-purple-500/10 to-transparent border border-purple-500/20">
          <div className="absolute inset-0 rounded-3xl bg-purple-500/5 blur-xl" />
          <div className="relative z-10">
            <span className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-4 block">Let&apos;s Connect</span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Get In Touch</h2>
            <p className="text-neutral-400 mb-10 max-w-md mx-auto">
              Interested in RnR Vibe? Reach out and let&apos;s talk about building something great together.
            </p>
            <a
              href="mailto:hello@rnrvibe.com"
              className="group relative inline-flex items-center gap-2 px-10 py-4 bg-purple-500 text-white font-semibold rounded-xl transition-all duration-300 hover:bg-purple-600 hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:-translate-y-0.5"
            >
              hello@rnrvibe.com
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="px-6 py-16 max-w-2xl mx-auto">
        <NewsletterSignup />
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800/50 px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-neutral-500">
          <span>&copy; {new Date().getFullYear()} RnR Vibe (rnrvibe.com). All rights reserved.</span>
          <div className="flex gap-6 flex-wrap justify-center">
            <a href="/tools" className="hover:text-purple-400 transition duration-300">Tools</a>
            <a href="/projects" className="hover:text-purple-400 transition duration-300">Projects</a>
            <a href="/blog" className="hover:text-purple-400 transition duration-300">Blog</a>
            <a href="/guides" className="hover:text-purple-400 transition duration-300">Guides</a>
            <a href="/compare" className="hover:text-purple-400 transition duration-300">Compare</a>
            <a href="/about" className="hover:text-purple-400 transition duration-300">About</a>
            <a href="/feed.xml" className="hover:text-purple-400 transition duration-300">RSS</a>
          </div>
        </div>
      </footer>

      <SearchModal open={searchOpen} onClose={toggleSearch} />
    </div>
  );
}
