"use client";

import BlogNav from "@/components/BlogNav";
import { useState, useCallback } from "react";

function generatePassword(length: number, options: { upper: boolean; lower: boolean; numbers: boolean; symbols: boolean }) {
  let chars = "";
  if (options.upper) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (options.lower) chars += "abcdefghijklmnopqrstuvwxyz";
  if (options.numbers) chars += "0123456789";
  if (options.symbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";
  if (!chars) chars = "abcdefghijklmnopqrstuvwxyz";

  let password = "";
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    password += chars[array[i] % chars.length];
  }
  return password;
}

function getStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score: 1, label: "Weak", color: "#ef4444" };
  if (score <= 4) return { score: 2, label: "Fair", color: "#f97316" };
  if (score <= 5) return { score: 3, label: "Good", color: "#eab308" };
  return { score: 4, label: "Strong", color: "#22c55e" };
}

export default function PasswordGeneratorPage() {
  const [length, setLength] = useState(16);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [password, setPassword] = useState(() => generatePassword(16, { upper: true, lower: true, numbers: true, symbols: true }));
  const [copied, setCopied] = useState(false);

  const generate = useCallback(() => {
    setPassword(generatePassword(length, { upper, lower, numbers, symbols }));
    setCopied(false);
  }, [length, upper, lower, numbers, symbols]);

  const copy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const strength = getStrength(password);

  const prompt = `Build a password generator in React with:
- Adjustable length slider (8-64 characters)
- Toggles for: uppercase, lowercase, numbers, symbols
- Cryptographically secure random generation (crypto.getRandomValues)
- Password strength meter (weak/fair/good/strong) with colored bar
- Copy to clipboard button
- Generate new password button
- Display the password in a large monospace font
- Dark theme with purple accent`;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <BlogNav />
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Password Generator</h1>
        <p className="mb-8 text-neutral-400">A secure password generator built with vibecoding in ~4 minutes.</p>

        {/* Demo */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8 mb-8 space-y-6">
          {/* Password display */}
          <div className="flex items-center gap-3 rounded-xl bg-neutral-950 border border-neutral-800 p-4">
            <code className="flex-1 text-lg font-mono text-neutral-200 break-all select-all">{password}</code>
            <button
              onClick={copy}
              className="shrink-0 rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-600 transition"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          {/* Strength meter */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-neutral-500">Strength</span>
              <span style={{ color: strength.color }}>{strength.label}</span>
            </div>
            <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${(strength.score / 4) * 100}%`, backgroundColor: strength.color }}
              />
            </div>
          </div>

          {/* Length slider */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-neutral-400">Length</span>
              <span className="text-purple-400 font-mono">{length}</span>
            </div>
            <input
              type="range"
              min="8"
              max="64"
              value={length}
              onChange={(e) => {
                setLength(Number(e.target.value));
                setPassword(generatePassword(Number(e.target.value), { upper, lower, numbers, symbols }));
              }}
              className="w-full accent-purple-500"
            />
            <div className="flex justify-between text-xs text-neutral-600">
              <span>8</span>
              <span>64</span>
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Uppercase (A-Z)", checked: upper, set: setUpper },
              { label: "Lowercase (a-z)", checked: lower, set: setLower },
              { label: "Numbers (0-9)", checked: numbers, set: setNumbers },
              { label: "Symbols (!@#$)", checked: symbols, set: setSymbols },
            ].map((opt) => (
              <label key={opt.label} className="flex items-center gap-3 rounded-lg bg-neutral-800 px-4 py-3 cursor-pointer hover:bg-neutral-750 transition">
                <input
                  type="checkbox"
                  checked={opt.checked}
                  onChange={(e) => {
                    opt.set(e.target.checked);
                    // Regenerate after toggle
                    const newOpts = { upper, lower, numbers, symbols, [opt.label.split(" ")[0].toLowerCase()]: e.target.checked };
                    setPassword(generatePassword(length, newOpts));
                  }}
                  className="accent-purple-500 w-4 h-4"
                />
                <span className="text-sm text-neutral-300">{opt.label}</span>
              </label>
            ))}
          </div>

          <button
            onClick={generate}
            className="w-full py-3 rounded-xl bg-purple-500 text-white font-semibold hover:bg-purple-600 transition"
          >
            Generate New Password
          </button>
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
