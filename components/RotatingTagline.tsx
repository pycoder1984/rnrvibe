"use client";

import { CSSProperties, useEffect, useState } from "react";

export interface Phrase {
  prefix: string;
  highlight: string;
}

interface RotatingTaglineProps {
  phrases: Phrase[];
  intervalMs?: number;
  className?: string;
  /** Heading level to render. Defaults to h1; use h2 when a real h1 already
   *  exists on the page so the outline stays correct for SEO. */
  as?: "h1" | "h2";
}

/**
 * A hero-title component that cycles through phrases on an interval.
 * Each phrase change re-mounts the word spans (via `key`), which re-triggers
 * the CSS `.split-word` keyframe so words fade/slide in one after another.
 */
export default function RotatingTagline({
  phrases,
  intervalMs = 4500,
  className = "",
  as: Tag = "h1",
}: RotatingTaglineProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (phrases.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % phrases.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [phrases.length, intervalMs]);

  const current = phrases[index];
  const prefixWords = current.prefix.split(" ");

  const wordStyle = (i: number): CSSProperties =>
    ({ ["--i" as string]: i } as CSSProperties);

  return (
    <Tag
      className={className}
      aria-label={`${current.prefix} ${current.highlight}`}
    >
      <span key={`p-${index}`} aria-hidden="true">
        {prefixWords.map((word, i) => (
          <span
            key={`${word}-${i}`}
            className="split-word"
            style={wordStyle(i)}
          >
            {word}
            {i < prefixWords.length - 1 && "\u00a0"}
          </span>
        ))}
      </span>
      <br />
      <span
        key={`h-${index}`}
        className="split-word bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent"
        style={wordStyle(prefixWords.length)}
        aria-hidden="true"
      >
        {current.highlight}
      </span>
    </Tag>
  );
}
