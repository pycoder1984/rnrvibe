"use client";

import BlogNav from "@/components/BlogNav";
import { useState, useEffect, useRef, useCallback } from "react";

export default function PomodoroTimerPage() {
  const [mode, setMode] = useState<"work" | "break">("work");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalTime = mode === "work" ? 25 * 60 : 5 * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  const playSound = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.value = 0.3;
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  }, []);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            playSound();
            if (mode === "work") {
              setSessions((s) => s + 1);
              setMode("break");
              return 5 * 60;
            } else {
              setMode("work");
              return 25 * 60;
            }
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, mode, playSound]);

  const reset = () => {
    setRunning(false);
    setTimeLeft(mode === "work" ? 25 * 60 : 5 * 60);
  };

  const switchMode = (m: "work" | "break") => {
    setRunning(false);
    setMode(m);
    setTimeLeft(m === "work" ? 25 * 60 : 5 * 60);
  };

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const secs = (timeLeft % 60).toString().padStart(2, "0");

  const prompt = `Build a Pomodoro timer in React with:
- 25-minute work sessions and 5-minute breaks
- Start, pause, and reset buttons
- Visual progress ring that fills as time passes
- Session counter
- Sound notification when timer completes
- Auto-switch between work and break modes
- Clean dark UI with purple accent colors`;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <BlogNav />
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Pomodoro Timer</h1>
        <p className="mb-8 text-neutral-400">A focus timer built entirely with vibecoding in ~5 minutes.</p>

        {/* Demo */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8 mb-8">
          {/* Mode toggle */}
          <div className="flex justify-center gap-2 mb-8">
            <button
              onClick={() => switchMode("work")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                mode === "work" ? "bg-purple-500 text-white" : "bg-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              Work (25:00)
            </button>
            <button
              onClick={() => switchMode("break")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                mode === "break" ? "bg-green-500 text-white" : "bg-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              Break (5:00)
            </button>
          </div>

          {/* Timer circle */}
          <div className="relative w-56 h-56 mx-auto mb-8">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#262626" strokeWidth="6" />
              <circle
                cx="60" cy="60" r="54" fill="none"
                stroke={mode === "work" ? "#a855f7" : "#22c55e"}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 54}`}
                strokeDashoffset={`${2 * Math.PI * 54 * (1 - progress / 100)}`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-mono font-bold tracking-wider">{mins}:{secs}</span>
              <span className="text-xs text-neutral-500 mt-1 uppercase tracking-widest">
                {mode === "work" ? "Focus" : "Break"}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setRunning(!running)}
              className={`px-8 py-3 rounded-xl text-sm font-semibold transition ${
                running
                  ? "bg-neutral-700 text-white hover:bg-neutral-600"
                  : "bg-purple-500 text-white hover:bg-purple-600"
              }`}
            >
              {running ? "Pause" : "Start"}
            </button>
            <button
              onClick={reset}
              className="px-6 py-3 rounded-xl text-sm font-medium bg-neutral-800 text-neutral-400 hover:text-white transition"
            >
              Reset
            </button>
          </div>

          {/* Session count */}
          <div className="text-center mt-6 text-sm text-neutral-500">
            Sessions completed: <span className="text-purple-400 font-semibold">{sessions}</span>
          </div>
        </div>

        {/* Prompt used */}
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
