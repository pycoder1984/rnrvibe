"use client";

import { useEffect, useRef, useState } from "react";

export interface Stat {
  label: string;
  value: number;
  suffix?: string;
}

interface StatsCounterProps {
  stats: Stat[];
  durationMs?: number;
}

/**
 * Counts each stat from 0 up to its target value with an ease-out cubic curve,
 * triggered once the container enters the viewport.
 */
export default function StatsCounter({
  stats,
  durationMs = 1600,
}: StatsCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Start at final values if the user prefers reduced motion — no count-up.
  // Otherwise start at 0 and animate when the container enters the viewport.
  const [values, setValues] = useState<number[]>(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return stats.map((s) => (prefersReducedMotion ? s.value : 0));
  });
  const startedRef = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Skip the count-up entirely under reduced motion — the lazy initial
    // state already holds the final values.
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !startedRef.current) {
            startedRef.current = true;
            const start = performance.now();
            const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

            const tick = (now: number) => {
              const elapsed = now - start;
              const t = Math.min(elapsed / durationMs, 1);
              const eased = easeOutCubic(t);
              setValues(stats.map((s) => Math.round(s.value * eased)));
              if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [stats, durationMs]);

  return (
    <div
      ref={ref}
      className="grid grid-cols-2 sm:grid-cols-4 gap-8"
    >
      {stats.map((stat, i) => (
        <div key={stat.label} className="text-center">
          <div className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tighter bg-gradient-to-br from-white via-purple-100 to-purple-400 bg-clip-text text-transparent tabular-nums">
            {values[i].toLocaleString()}
            {stat.suffix || ""}
          </div>
          <div className="mt-3 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}
