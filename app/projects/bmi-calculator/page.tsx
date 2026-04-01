"use client";

import BlogNav from "@/components/BlogNav";
import { useState } from "react";

function getCategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: "Underweight", color: "text-blue-400" };
  if (bmi < 25) return { label: "Normal", color: "text-green-400" };
  if (bmi < 30) return { label: "Overweight", color: "text-yellow-400" };
  return { label: "Obese", color: "text-red-400" };
}

export default function BmiCalculatorPage() {
  const [unit, setUnit] = useState<"metric" | "imperial">("metric");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");

  const bmi = (() => {
    if (unit === "metric") {
      const h = parseFloat(height) / 100; // cm to m
      const w = parseFloat(weight);
      if (!h || !w || h <= 0) return null;
      return w / (h * h);
    } else {
      const ft = parseFloat(heightFt) || 0;
      const inches = parseFloat(heightIn) || 0;
      const totalInches = ft * 12 + inches;
      const w = parseFloat(weight);
      if (!totalInches || !w) return null;
      return (w / (totalInches * totalInches)) * 703;
    }
  })();

  const category = bmi ? getCategory(bmi) : null;

  const barPosition = bmi ? Math.min(Math.max(((bmi - 15) / 25) * 100, 0), 100) : 0;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <BlogNav />
      <div className="mx-auto max-w-md px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">BMI Calculator</h1>
        <p className="mb-8 text-neutral-400">
          Calculate your Body Mass Index with a visual health range indicator.
        </p>

        <div className="flex gap-2 mb-6">
          {(["metric", "imperial"] as const).map((u) => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              className={`px-4 py-2 text-sm rounded-lg border transition ${
                unit === u
                  ? "border-purple-500 bg-purple-500/20 text-purple-300"
                  : "border-neutral-700 text-neutral-400 hover:border-neutral-600"
              }`}
            >
              {u === "metric" ? "Metric (cm/kg)" : "Imperial (ft/lbs)"}
            </button>
          ))}
        </div>

        <div className="space-y-4 mb-8">
          {unit === "metric" ? (
            <div>
              <label className="block text-sm text-neutral-400 mb-1">Height (cm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="170"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm text-neutral-200 placeholder-neutral-600 focus:border-purple-500/50 focus:outline-none"
              />
            </div>
          ) : (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm text-neutral-400 mb-1">Feet</label>
                <input
                  type="number"
                  value={heightFt}
                  onChange={(e) => setHeightFt(e.target.value)}
                  placeholder="5"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm text-neutral-200 placeholder-neutral-600 focus:border-purple-500/50 focus:outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-neutral-400 mb-1">Inches</label>
                <input
                  type="number"
                  value={heightIn}
                  onChange={(e) => setHeightIn(e.target.value)}
                  placeholder="7"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm text-neutral-200 placeholder-neutral-600 focus:border-purple-500/50 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm text-neutral-400 mb-1">
              Weight ({unit === "metric" ? "kg" : "lbs"})
            </label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder={unit === "metric" ? "70" : "154"}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm text-neutral-200 placeholder-neutral-600 focus:border-purple-500/50 focus:outline-none"
            />
          </div>
        </div>

        {bmi !== null && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 text-center">
            <div className="text-5xl font-bold mb-2">{bmi.toFixed(1)}</div>
            <div className={`text-lg font-semibold ${category?.color}`}>{category?.label}</div>

            <div className="mt-6 relative h-3 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 via-green-500 via-50% via-yellow-500 to-red-500">
              <div
                className="absolute top-0 w-1 h-full bg-white rounded shadow-lg transition-all duration-300"
                style={{ left: `${barPosition}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-neutral-500 mt-1">
              <span>15</span>
              <span>18.5</span>
              <span>25</span>
              <span>30</span>
              <span>40</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
