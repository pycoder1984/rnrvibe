"use client";

import BlogNav from "@/components/BlogNav";
import { useMemo, useState } from "react";

type CategoryId = "length" | "weight" | "temperature" | "volume";

interface LinearUnit {
  id: string;
  label: string;
  factor: number; // value in base units = input * factor
}

const LINEAR_UNITS: Record<Exclude<CategoryId, "temperature">, LinearUnit[]> = {
  length: [
    { id: "m", label: "Meters", factor: 1 },
    { id: "km", label: "Kilometers", factor: 1000 },
    { id: "cm", label: "Centimeters", factor: 0.01 },
    { id: "mm", label: "Millimeters", factor: 0.001 },
    { id: "mi", label: "Miles", factor: 1609.344 },
    { id: "yd", label: "Yards", factor: 0.9144 },
    { id: "ft", label: "Feet", factor: 0.3048 },
    { id: "in", label: "Inches", factor: 0.0254 },
  ],
  weight: [
    { id: "kg", label: "Kilograms", factor: 1 },
    { id: "g", label: "Grams", factor: 0.001 },
    { id: "mg", label: "Milligrams", factor: 0.000001 },
    { id: "t", label: "Metric Tons", factor: 1000 },
    { id: "lb", label: "Pounds", factor: 0.45359237 },
    { id: "oz", label: "Ounces", factor: 0.028349523125 },
  ],
  volume: [
    { id: "l", label: "Liters", factor: 1 },
    { id: "ml", label: "Milliliters", factor: 0.001 },
    { id: "m3", label: "Cubic Meters", factor: 1000 },
    { id: "gal", label: "Gallons (US)", factor: 3.785411784 },
    { id: "qt", label: "Quarts (US)", factor: 0.946352946 },
    { id: "pt", label: "Pints (US)", factor: 0.473176473 },
    { id: "cup", label: "Cups (US)", factor: 0.2365882365 },
    { id: "floz", label: "Fluid Ounces (US)", factor: 0.0295735295625 },
  ],
};

const TEMP_UNITS = [
  { id: "C", label: "Celsius" },
  { id: "F", label: "Fahrenheit" },
  { id: "K", label: "Kelvin" },
];

const CATEGORIES: { id: CategoryId; label: string; icon: string }[] = [
  { id: "length", label: "Length", icon: "↔️" },
  { id: "weight", label: "Weight", icon: "⚖️" },
  { id: "temperature", label: "Temperature", icon: "🌡️" },
  { id: "volume", label: "Volume", icon: "🥤" },
];

function toCelsius(value: number, unit: string): number {
  if (unit === "C") return value;
  if (unit === "F") return ((value - 32) * 5) / 9;
  return value - 273.15; // K
}

function fromCelsius(value: number, unit: string): number {
  if (unit === "C") return value;
  if (unit === "F") return (value * 9) / 5 + 32;
  return value + 273.15; // K
}

function formatResult(n: number): string {
  if (!Number.isFinite(n)) return "";
  const abs = Math.abs(n);
  if (abs !== 0 && (abs < 0.0001 || abs >= 1e12)) return n.toExponential(6);
  const rounded = Number(n.toFixed(6));
  return String(rounded);
}

export default function UnitConverterPage() {
  const [category, setCategory] = useState<CategoryId>("length");
  const [fromUnit, setFromUnit] = useState("m");
  const [toUnit, setToUnit] = useState("ft");
  const [input, setInput] = useState("1");

  const unitList = useMemo(() => {
    if (category === "temperature") return TEMP_UNITS.map((u) => ({ id: u.id, label: u.label }));
    return LINEAR_UNITS[category].map((u) => ({ id: u.id, label: u.label }));
  }, [category]);

  const result = useMemo(() => {
    const n = parseFloat(input);
    if (!Number.isFinite(n)) return "";
    if (category === "temperature") {
      const c = toCelsius(n, fromUnit);
      return formatResult(fromCelsius(c, toUnit));
    }
    const units = LINEAR_UNITS[category];
    const from = units.find((u) => u.id === fromUnit);
    const to = units.find((u) => u.id === toUnit);
    if (!from || !to) return "";
    const base = n * from.factor;
    return formatResult(base / to.factor);
  }, [input, fromUnit, toUnit, category]);

  const changeCategory = (next: CategoryId) => {
    setCategory(next);
    if (next === "temperature") {
      setFromUnit("C");
      setToUnit("F");
    } else {
      const list = LINEAR_UNITS[next];
      setFromUnit(list[0].id);
      setToUnit(list[1]?.id || list[0].id);
    }
  };

  const swap = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    if (result) setInput(result);
  };

  const prompt = `Build a Unit Converter in React with:
- Four categories: length, weight, temperature, volume
- Linear conversion via factor-to-base-unit for length/weight/volume
- Non-linear formula for temperature (C, F, K)
- Live conversion as the user types
- Swap button that flips from/to and copies result back to input
- Tabbed category selector with icons
- Graceful handling of non-numeric input
- Dark theme with purple accents`;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <BlogNav />
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Unit Converter</h1>
        <p className="mb-8 text-neutral-400">
          Live-converting calculator across four categories. Built with vibecoding in ~7 minutes.
        </p>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => changeCategory(c.id)}
              className={`px-4 py-2 rounded-xl border text-sm font-medium transition ${
                category === c.id
                  ? "border-purple-500 bg-purple-500/20 text-purple-200"
                  : "border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-600"
              }`}
            >
              <span className="mr-2">{c.icon}</span>
              {c.label}
            </button>
          ))}
        </div>

        {/* Converter */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
            <div>
              <label className="block text-xs text-neutral-500 mb-1">From</label>
              <select
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500 mb-2"
              >
                {unitList.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </select>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                inputMode="decimal"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-3 text-lg font-mono outline-none focus:border-purple-500"
                placeholder="Enter a value"
              />
            </div>

            <button
              onClick={swap}
              className="mx-auto rounded-full border border-neutral-700 bg-neutral-950 hover:bg-purple-500/20 hover:border-purple-500 w-11 h-11 text-lg transition"
              title="Swap units"
              aria-label="Swap units"
            >
              ⇄
            </button>

            <div>
              <label className="block text-xs text-neutral-500 mb-1">To</label>
              <select
                value={toUnit}
                onChange={(e) => setToUnit(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500 mb-2"
              >
                {unitList.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </select>
              <div className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-3 text-lg font-mono text-purple-300 break-all min-h-[52px]">
                {result || <span className="text-neutral-600">—</span>}
              </div>
            </div>
          </div>

          {result && (
            <div className="mt-4 text-sm text-neutral-400">
              <span className="text-neutral-500">{input}</span> {fromUnit.toUpperCase()} ={" "}
              <span className="text-purple-300 font-mono">{result}</span> {toUnit.toUpperCase()}
            </div>
          )}
        </div>

        {/* Prompt */}
        <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="text-lg font-semibold text-purple-400 mb-3">Built with this prompt</h2>
          <pre className="text-sm text-neutral-300 whitespace-pre-wrap bg-neutral-950 rounded-xl p-4 border border-neutral-800">
            {prompt}
          </pre>
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
