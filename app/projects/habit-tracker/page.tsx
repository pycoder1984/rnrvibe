"use client";

import BlogNav from "@/components/BlogNav";
import { useState, useMemo } from "react";

function getDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getDaysInRange(weeks: number): Date[] {
  const days: Date[] = [];
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - weeks * 7 + 1);
  // Align to Sunday
  start.setDate(start.getDate() - start.getDay());

  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
}

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];

export default function HabitTrackerPage() {
  // Pre-populate with some random data for demo
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    const today = new Date();
    for (let i = 0; i < 120; i++) {
      if (Math.random() > 0.4) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        map[getDateKey(d)] = true;
      }
    }
    return map;
  });

  const days = useMemo(() => getDaysInRange(20), []);
  const todayKey = getDateKey(new Date());

  const toggle = (key: string) => {
    setChecked((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = true;
      return next;
    });
  };

  // Calculate streak
  let streak = 0;
  const d = new Date();
  while (checked[getDateKey(d)]) {
    streak++;
    d.setDate(d.getDate() - 1);
  }

  const totalChecked = Object.keys(checked).length;

  // Group days into weeks (columns)
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  days.forEach((day, i) => {
    currentWeek.push(day);
    if (day.getDay() === 6 || i === days.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  const prompt = `Build a habit tracker in React with:
- GitHub-style contribution grid (green squares for completed days)
- Click to toggle any day on/off
- Current streak counter
- Total days tracked
- 20 weeks of history
- Month labels along the top
- Day labels along the side (Mon, Wed, Fri)
- Pre-populated with random demo data
- Dark theme with green accent`;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <BlogNav />
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Habit Tracker</h1>
        <p className="mb-8 text-neutral-400">A GitHub-style contribution grid built with vibecoding in ~7 minutes.</p>

        {/* Demo */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 mb-8">
          {/* Stats */}
          <div className="flex gap-6 mb-6">
            <div>
              <div className="text-2xl font-bold text-green-400">{streak}</div>
              <div className="text-xs text-neutral-500">Day Streak</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">{totalChecked}</div>
              <div className="text-xs text-neutral-500">Total Days</div>
            </div>
          </div>

          {/* Grid */}
          <div className="overflow-x-auto">
            <div className="flex gap-0.5 min-w-fit">
              {/* Day labels */}
              <div className="flex flex-col gap-0.5 mr-1">
                {dayLabels.map((label, i) => (
                  <div key={i} className="w-8 h-[14px] text-[10px] text-neutral-600 flex items-center justify-end pr-1">
                    {label}
                  </div>
                ))}
              </div>
              {/* Weeks */}
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-0.5">
                  {/* Month label for first day of month */}
                  {Array.from({ length: 7 }).map((_, di) => {
                    const day = week.find((d) => d.getDay() === di);
                    if (!day) return <div key={di} className="w-[14px] h-[14px]" />;
                    const key = getDateKey(day);
                    const isChecked = checked[key];
                    const isToday = key === todayKey;
                    return (
                      <button
                        key={di}
                        onClick={() => toggle(key)}
                        title={key}
                        className={`w-[14px] h-[14px] rounded-sm transition-colors ${
                          isChecked
                            ? "bg-green-500 hover:bg-green-400"
                            : "bg-neutral-800 hover:bg-neutral-700"
                        } ${isToday ? "ring-1 ring-purple-400" : ""}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-4 text-xs text-neutral-500">
            <span>Less</span>
            <div className="w-3 h-3 rounded-sm bg-neutral-800" />
            <div className="w-3 h-3 rounded-sm bg-green-500" />
            <span>More</span>
            <span className="ml-4">Click any square to toggle</span>
          </div>
        </div>

        {/* Prompt */}
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
