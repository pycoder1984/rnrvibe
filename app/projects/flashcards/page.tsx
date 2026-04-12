"use client";

import BlogNav from "@/components/BlogNav";
import { useMemo, useState } from "react";

interface Card {
  id: number;
  front: string;
  back: string;
}

const SAMPLE_CARDS: Card[] = [
  { id: 1, front: "What does JSX compile to?", back: "React.createElement calls (or the equivalent jsx runtime function)." },
  { id: 2, front: "useEffect runs when?", back: "After render, with dependencies controlling when it re-runs." },
  { id: 3, front: "What's the difference between props and state?", back: "Props are passed in and read-only. State is owned by the component and triggers re-renders when updated." },
  { id: 4, front: "What is a pure function?", back: "Given the same input, it always returns the same output and has no side effects." },
  { id: 5, front: "What does 'const' guarantee?", back: "The binding can't be reassigned. The value itself (if an object) can still be mutated." },
];

export default function FlashcardsPage() {
  const [cards, setCards] = useState<Card[]>(SAMPLE_CARDS);
  const [order, setOrder] = useState<number[]>(SAMPLE_CARDS.map((_, i) => i));
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());
  const [reviewing, setReviewing] = useState<Set<number>>(new Set());
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");

  const current = useMemo(() => cards[order[pos]], [cards, order, pos]);

  const next = () => {
    setFlipped(false);
    setPos((p) => (p + 1) % order.length);
  };

  const markKnown = () => {
    if (!current) return;
    setKnown((prev) => new Set(prev).add(current.id));
    setReviewing((prev) => {
      const n = new Set(prev);
      n.delete(current.id);
      return n;
    });
    next();
  };

  const markReview = () => {
    if (!current) return;
    setReviewing((prev) => new Set(prev).add(current.id));
    setKnown((prev) => {
      const n = new Set(prev);
      n.delete(current.id);
      return n;
    });
    next();
  };

  const shuffle = () => {
    const shuffled = [...Array(cards.length).keys()].sort(() => Math.random() - 0.5);
    setOrder(shuffled);
    setPos(0);
    setFlipped(false);
  };

  const addCard = () => {
    if (!front.trim() || !back.trim()) return;
    const nextId = Math.max(0, ...cards.map((c) => c.id)) + 1;
    const newCards = [...cards, { id: nextId, front: front.trim(), back: back.trim() }];
    setCards(newCards);
    setOrder([...Array(newCards.length).keys()]);
    setFront("");
    setBack("");
  };

  const reset = () => {
    setKnown(new Set());
    setReviewing(new Set());
    setPos(0);
    setFlipped(false);
  };

  const prompt = `Build a flashcards study app in React with:
- A deck of cards with front/question and back/answer
- Click the card to flip it (CSS 3D transform with backface-visibility)
- Mark Known / Needs Review buttons that advance to the next card
- Shuffle button to randomize the order
- Add new cards via a small form
- Counter showing "card X of Y" and tallies for Known / Reviewing
- Dark UI, no external dependencies`;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <BlogNav />
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Flashcards</h1>
        <p className="mb-8 text-neutral-400">A study deck with flip animation and progress tracking, built in ~10 minutes.</p>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 mb-8 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-neutral-800 p-3 text-center">
              <div className="text-xs text-neutral-500 mb-1">Card</div>
              <div className="text-sm font-bold text-neutral-200">
                {order.length === 0 ? "0 / 0" : `${pos + 1} / ${order.length}`}
              </div>
            </div>
            <div className="rounded-xl bg-neutral-800 p-3 text-center">
              <div className="text-xs text-neutral-500 mb-1">Known</div>
              <div className="text-sm font-bold text-green-400">{known.size}</div>
            </div>
            <div className="rounded-xl bg-neutral-800 p-3 text-center">
              <div className="text-xs text-neutral-500 mb-1">Review</div>
              <div className="text-sm font-bold text-amber-400">{reviewing.size}</div>
            </div>
          </div>

          {current ? (
            <div
              onClick={() => setFlipped((f) => !f)}
              className="relative h-56 cursor-pointer select-none"
              style={{ perspective: "1000px" }}
            >
              <div
                className="absolute inset-0 rounded-2xl transition-transform duration-500"
                style={{
                  transformStyle: "preserve-3d",
                  transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                <div
                  className="absolute inset-0 rounded-2xl border border-neutral-700 bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center p-6 text-center"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <div>
                    <div className="text-xs text-neutral-500 mb-2 uppercase tracking-wider">Question</div>
                    <div className="text-lg text-neutral-100">{current.front}</div>
                  </div>
                </div>
                <div
                  className="absolute inset-0 rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/15 to-indigo-500/10 flex items-center justify-center p-6 text-center"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  <div>
                    <div className="text-xs text-purple-300 mb-2 uppercase tracking-wider">Answer</div>
                    <div className="text-lg text-neutral-100">{current.back}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-10 text-center text-neutral-500">
              No cards yet. Add one below.
            </div>
          )}

          <div className="text-center text-xs text-neutral-500">Click the card to flip it</div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={markReview}
              disabled={!current}
              className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-300 hover:bg-amber-500/20 disabled:opacity-40 transition"
            >
              Needs review
            </button>
            <button
              onClick={next}
              disabled={!current}
              className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-300 hover:border-purple-500/50 disabled:opacity-40 transition"
            >
              Skip
            </button>
            <button
              onClick={markKnown}
              disabled={!current}
              className="rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-300 hover:bg-green-500/20 disabled:opacity-40 transition"
            >
              I know this
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={shuffle}
              className="rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm text-neutral-200 hover:border-purple-500/50 transition"
            >
              Shuffle
            </button>
            <button
              onClick={reset}
              className="rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200 transition"
            >
              Reset progress
            </button>
          </div>

          <div className="border-t border-neutral-800 pt-5">
            <h3 className="text-sm font-semibold text-neutral-300 mb-2">Add a card</h3>
            <div className="space-y-2">
              <input
                value={front}
                onChange={(e) => setFront(e.target.value)}
                placeholder="Question / front"
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-200 placeholder-neutral-600 focus:border-purple-500/50 focus:outline-none"
              />
              <input
                value={back}
                onChange={(e) => setBack(e.target.value)}
                placeholder="Answer / back"
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-200 placeholder-neutral-600 focus:border-purple-500/50 focus:outline-none"
              />
              <button
                onClick={addCard}
                disabled={!front.trim() || !back.trim()}
                className="rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-600 disabled:opacity-50 transition"
              >
                Add card
              </button>
            </div>
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
