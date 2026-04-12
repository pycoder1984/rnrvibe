"use client";

import BlogNav from "@/components/BlogNav";
import { useEffect, useRef, useState } from "react";

const SAMPLE_TEXTS = [
  "The quick brown fox jumps over the lazy dog while the sun sets behind the mountains and paints the sky with hues of orange and pink.",
  "Vibecoding is the art of describing what you want in plain language and letting an AI assistant scaffold the implementation for you in seconds.",
  "React components are just functions that return UI. State lives inside them, props flow down, and side effects are handled by hooks like useEffect.",
  "Good software is not about clever code. It is about clear intent, predictable behavior, and small pieces that compose well into a larger system.",
];

const DURATION_SECONDS = 30;

export default function TypingSpeedTestPage() {
  const [text, setText] = useState(SAMPLE_TEXTS[0]);
  const [typed, setTyped] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (startedAt === null || finished) return;
    const id = setInterval(() => {
      const e = (Date.now() - startedAt) / 1000;
      if (e >= DURATION_SECONDS) {
        setElapsed(DURATION_SECONDS);
        setFinished(true);
      } else {
        setElapsed(e);
      }
    }, 100);
    return () => clearInterval(id);
  }, [startedAt, finished]);

  const handleChange = (value: string) => {
    if (finished) return;
    if (startedAt === null) setStartedAt(Date.now());
    setTyped(value);
    if (value.length >= text.length) setFinished(true);
  };

  const reset = (nextText?: string) => {
    setTyped("");
    setStartedAt(null);
    setElapsed(0);
    setFinished(false);
    if (nextText) setText(nextText);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const correctChars = typed.split("").filter((c, i) => c === text[i]).length;
  const accuracy = typed.length > 0 ? Math.round((correctChars / typed.length) * 100) : 100;
  const minutes = Math.max(elapsed / 60, 1 / 60);
  const wpm = Math.round(correctChars / 5 / minutes);
  const remaining = Math.max(0, DURATION_SECONDS - elapsed);

  const prompt = `Build a typing speed test in React with:
- Pick from a set of sample paragraphs
- 30-second countdown timer that starts on first keystroke
- Live WPM and accuracy calculation (5 chars = 1 word, count only correct chars)
- Character-by-character highlighting: correct = green, wrong = red, upcoming = gray
- Restart button and "new text" button
- Dark UI, no external dependencies`;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <BlogNav />
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Typing Speed Test</h1>
        <p className="mb-8 text-neutral-400">A 30-second WPM + accuracy test built with vibecoding in ~8 minutes.</p>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 mb-8 space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-neutral-800 p-4 text-center">
              <div className="text-xs text-neutral-500 mb-1">WPM</div>
              <div className="text-lg font-bold text-purple-400">{wpm}</div>
            </div>
            <div className="rounded-xl bg-neutral-800 p-4 text-center">
              <div className="text-xs text-neutral-500 mb-1">Accuracy</div>
              <div className="text-lg font-bold text-green-400">{accuracy}%</div>
            </div>
            <div className="rounded-xl bg-neutral-800 p-4 text-center">
              <div className="text-xs text-neutral-500 mb-1">Time left</div>
              <div className="text-lg font-bold text-neutral-200">{remaining.toFixed(1)}s</div>
            </div>
          </div>

          <div className="rounded-xl bg-neutral-950 border border-neutral-800 p-5 text-lg leading-relaxed font-mono select-none">
            {text.split("").map((ch, i) => {
              const t = typed[i];
              const cls =
                t === undefined
                  ? "text-neutral-600"
                  : t === ch
                  ? "text-green-400"
                  : "text-red-400 bg-red-500/20 rounded";
              return (
                <span key={i} className={cls}>
                  {ch}
                </span>
              );
            })}
          </div>

          <input
            ref={inputRef}
            value={typed}
            onChange={(e) => handleChange(e.target.value)}
            disabled={finished}
            autoFocus
            placeholder={finished ? "Time's up — hit Restart" : "Start typing..."}
            className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-200 placeholder-neutral-600 focus:border-purple-500/50 focus:outline-none disabled:opacity-50"
          />

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => reset()}
              className="rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-600 transition"
            >
              Restart
            </button>
            <button
              onClick={() => reset(SAMPLE_TEXTS[Math.floor(Math.random() * SAMPLE_TEXTS.length)])}
              className="rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm text-neutral-200 hover:border-purple-500/50 transition"
            >
              New text
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="text-lg font-semibold text-purple-400 mb-3">Built with this prompt</h2>
          <pre className="text-sm text-neutral-300 whitespace-pre-wrap bg-neutral-950 rounded-xl p-4 border border-neutral-800">{prompt}</pre>
          <div className="flex items-center gap-4 mt-4">
            <button
              onClick={() => navigator.clipboard.writeText(prompt)}
              className="text-sm text-purple-400 hover:text-purple-300 transition"
            >
              Copy prompt
            </button>
            <a href="/tools/project-starter" className="text-sm text-neutral-500 hover:text-white transition">
              Try in Project Starter →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
