"use client";

import BlogNav from "@/components/BlogNav";
import { useState } from "react";

interface Question {
  question: string;
  options: string[];
  correct: number;
}

const sampleQuiz: Question[] = [
  {
    question: "What does 'vibecoding' mean?",
    options: ["Writing code while listening to music", "Using AI to generate code from natural language descriptions", "Coding in a virtual reality environment", "A type of pair programming"],
    correct: 1,
  },
  {
    question: "Which AI tool is commonly used for vibecoding?",
    options: ["Photoshop", "Excel", "Claude / ChatGPT / Cursor", "Blender"],
    correct: 2,
  },
  {
    question: "What's the most important skill for vibecoding?",
    options: ["Typing speed", "Memorizing syntax", "Writing clear prompts", "Having a CS degree"],
    correct: 2,
  },
  {
    question: "What should you always do with AI-generated code?",
    options: ["Ship it immediately", "Delete it and rewrite", "Review and test it before using", "Print it out"],
    correct: 2,
  },
  {
    question: "What's a good first vibecoding project?",
    options: ["An operating system", "A personal portfolio website", "A blockchain", "A self-driving car AI"],
    correct: 1,
  },
];

export default function QuizBuilderPage() {
  const [mode, setMode] = useState<"intro" | "quiz" | "results">("intro");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);

  const score = answers.reduce((s, a, i) => s + (a === sampleQuiz[i].correct ? 1 : 0), 0);

  const next = () => {
    if (selected === null) return;
    const newAnswers = [...answers, selected];
    setAnswers(newAnswers);
    setSelected(null);
    if (current + 1 < sampleQuiz.length) {
      setCurrent(current + 1);
    } else {
      setMode("results");
    }
  };

  const restart = () => {
    setMode("intro");
    setCurrent(0);
    setAnswers([]);
    setSelected(null);
  };

  const prompt = `Build a quiz app in React with:
- Sample quiz about vibecoding with 5 multiple-choice questions
- Intro screen with start button
- One question at a time with 4 options
- Visual feedback: highlight selected answer
- Progress bar showing current question
- Results screen with score and correct/incorrect breakdown
- Restart button
- Dark theme, no dependencies`;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <BlogNav />
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Quiz Builder</h1>
        <p className="mb-8 text-neutral-400">An interactive quiz app built with vibecoding in ~8 minutes.</p>

        {/* Demo */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8 mb-8">
          {mode === "intro" && (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">🧠</div>
              <h2 className="text-2xl font-bold mb-2">Vibecoding Quiz</h2>
              <p className="text-neutral-400 mb-6">{sampleQuiz.length} questions to test your vibecoding knowledge</p>
              <button
                onClick={() => setMode("quiz")}
                className="px-8 py-3 rounded-xl bg-purple-500 text-white font-semibold hover:bg-purple-600 transition"
              >
                Start Quiz
              </button>
            </div>
          )}

          {mode === "quiz" && (
            <div>
              {/* Progress */}
              <div className="flex items-center justify-between mb-2 text-xs text-neutral-500">
                <span>Question {current + 1} of {sampleQuiz.length}</span>
                <span>{Math.round(((current) / sampleQuiz.length) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-neutral-800 rounded-full mb-8">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all duration-300"
                  style={{ width: `${((current) / sampleQuiz.length) * 100}%` }}
                />
              </div>

              <h3 className="text-xl font-semibold mb-6">{sampleQuiz[current].question}</h3>

              <div className="space-y-3 mb-6">
                {sampleQuiz[current].options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => setSelected(i)}
                    className={`w-full text-left px-5 py-3.5 rounded-xl border text-sm transition ${
                      selected === i
                        ? "border-purple-500 bg-purple-500/10 text-white"
                        : "border-neutral-700 bg-neutral-800 text-neutral-300 hover:border-neutral-600"
                    }`}
                  >
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-current mr-3 text-xs">
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </button>
                ))}
              </div>

              <button
                onClick={next}
                disabled={selected === null}
                className="w-full py-3 rounded-xl bg-purple-500 text-white font-semibold hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {current + 1 === sampleQuiz.length ? "See Results" : "Next Question"}
              </button>
            </div>
          )}

          {mode === "results" && (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">{score === sampleQuiz.length ? "🎉" : score >= 3 ? "👍" : "📚"}</div>
              <h2 className="text-2xl font-bold mb-2">
                {score}/{sampleQuiz.length} Correct
              </h2>
              <p className="text-neutral-400 mb-6">
                {score === sampleQuiz.length
                  ? "Perfect score! You're a vibecoding pro!"
                  : score >= 3
                  ? "Nice work! You know your vibecoding basics."
                  : "Keep learning! Check out our guides for more."}
              </p>

              <div className="space-y-2 mb-6 text-left">
                {sampleQuiz.map((q, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-neutral-800 text-sm">
                    <span className={answers[i] === q.correct ? "text-green-400" : "text-red-400"}>
                      {answers[i] === q.correct ? "✓" : "✗"}
                    </span>
                    <div>
                      <div className="text-neutral-200">{q.question}</div>
                      {answers[i] !== q.correct && (
                        <div className="text-xs text-green-400 mt-1">Correct: {q.options[q.correct]}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={restart}
                className="px-8 py-3 rounded-xl bg-purple-500 text-white font-semibold hover:bg-purple-600 transition"
              >
                Try Again
              </button>
            </div>
          )}
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
