"use client";

import BlogNav from "@/components/BlogNav";
import { useState, useRef, useCallback } from "react";

export default function StopwatchPage() {
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const elapsedRef = useRef(0);

  const start = useCallback(() => {
    startTimeRef.current = Date.now() - elapsedRef.current;
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      elapsedRef.current = elapsed;
      setTime(elapsed);
    }, 10);
    setRunning(true);
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setTime(0);
    elapsedRef.current = 0;
    setLaps([]);
  }, []);

  const lap = useCallback(() => {
    setLaps((prev) => [time, ...prev]);
  }, [time]);

  const format = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const centis = Math.floor((ms % 1000) / 10);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(centis).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <BlogNav />
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Stopwatch & Lap Timer</h1>
        <p className="mb-12 text-neutral-400">Precision stopwatch with lap tracking and split times.</p>

        <div className="mb-8">
          <div className="text-6xl font-mono font-bold tracking-wider text-white tabular-nums">
            {format(time)}
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 mb-10">
          {!running ? (
            <button
              onClick={start}
              className="rounded-full bg-green-500 px-8 py-3 text-sm font-medium text-white transition hover:bg-green-600"
            >
              {time > 0 ? "Resume" : "Start"}
            </button>
          ) : (
            <button
              onClick={stop}
              className="rounded-full bg-red-500 px-8 py-3 text-sm font-medium text-white transition hover:bg-red-600"
            >
              Stop
            </button>
          )}

          {running && (
            <button
              onClick={lap}
              className="rounded-full border border-neutral-600 px-8 py-3 text-sm font-medium text-neutral-300 transition hover:border-neutral-500 hover:text-white"
            >
              Lap
            </button>
          )}

          {!running && time > 0 && (
            <button
              onClick={reset}
              className="rounded-full border border-neutral-600 px-8 py-3 text-sm font-medium text-neutral-300 transition hover:border-neutral-500 hover:text-white"
            >
              Reset
            </button>
          )}
        </div>

        {laps.length > 0 && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
            <h2 className="text-sm font-semibold text-neutral-400 mb-3">Laps</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {laps.map((lapTime, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-neutral-800/50"
                >
                  <span className="text-sm text-neutral-400">Lap {laps.length - i}</span>
                  <span className="font-mono text-sm text-white">{format(lapTime)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
