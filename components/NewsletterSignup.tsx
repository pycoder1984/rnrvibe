"use client";
import { API_BASE } from "@/lib/api-config";

import { useState } from "react";

export default function NewsletterSignup({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      const res = await fetch(`${API_BASE}/api/newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className={`text-center ${compact ? "py-4" : "py-8"}`}>
        <p className="text-purple-400 font-semibold">You're in!</p>
        <p className="text-neutral-400 text-sm mt-1">We'll send you the good stuff.</p>
      </div>
    );
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          aria-label="Email address"
          className="flex-1 px-4 py-2.5 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 transition"
        />
        <button
          type="submit"
          className="px-5 py-2.5 bg-purple-500 text-white text-sm font-semibold rounded-lg hover:bg-purple-600 transition-colors shrink-0"
        >
          Subscribe
        </button>
      </form>
    );
  }

  return (
    <div className="relative p-8 sm:p-10 rounded-2xl bg-gradient-to-b from-purple-500/10 to-neutral-900 border border-purple-500/20">
      <div className="absolute inset-0 rounded-2xl bg-purple-500/5 blur-xl pointer-events-none" />
      <div className="relative z-10 text-center">
        <h3 className="text-xl font-bold mb-2">Stay in the flow</h3>
        <p className="text-neutral-400 text-sm mb-6 max-w-sm mx-auto">
          Get vibecoding tips, new tool announcements, and guides delivered to your inbox.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            aria-label="Email address"
            className="flex-1 px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 transition"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-purple-500 text-white font-semibold rounded-xl hover:bg-purple-600 transition-colors shrink-0"
          >
            Subscribe
          </button>
        </form>
        {status === "error" && (
          <p className="text-red-400 text-sm mt-3">Something went wrong. Try again.</p>
        )}
        <p className="text-neutral-600 text-xs mt-4">No spam, unsubscribe anytime.</p>
      </div>
    </div>
  );
}
