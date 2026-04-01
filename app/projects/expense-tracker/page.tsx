"use client";

import BlogNav from "@/components/BlogNav";
import { useState } from "react";

interface Transaction {
  id: number;
  description: string;
  amount: number;
  category: string;
  type: "income" | "expense";
}

const categories = ["Food", "Transport", "Entertainment", "Bills", "Shopping", "Salary", "Freelance", "Other"];
const categoryColors: Record<string, string> = {
  Food: "#f97316", Transport: "#3b82f6", Entertainment: "#a855f7",
  Bills: "#ef4444", Shopping: "#ec4899", Salary: "#22c55e",
  Freelance: "#06b6d4", Other: "#6b7280",
};

export default function ExpenseTrackerPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: 1, description: "Salary", amount: 3000, category: "Salary", type: "income" },
    { id: 2, description: "Groceries", amount: 85, category: "Food", type: "expense" },
    { id: 3, description: "Netflix", amount: 15, category: "Entertainment", type: "expense" },
    { id: 4, description: "Gas", amount: 45, category: "Transport", type: "expense" },
    { id: 5, description: "Freelance project", amount: 500, category: "Freelance", type: "income" },
  ]);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [type, setType] = useState<"income" | "expense">("expense");

  const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = income - expenses;

  const expenseByCategory = transactions
    .filter((t) => t.type === "expense")
    .reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const add = () => {
    if (!desc.trim() || !amount) return;
    setTransactions([
      ...transactions,
      { id: Date.now(), description: desc, amount: parseFloat(amount), category, type },
    ]);
    setDesc("");
    setAmount("");
  };

  const remove = (id: number) => setTransactions(transactions.filter((t) => t.id !== id));

  const prompt = `Build an expense tracker in React with:
- Add income and expense transactions with description, amount, and category
- Running balance display (income - expenses)
- Category breakdown with colored bars
- Transaction history list with delete button
- Sample data pre-loaded
- Dark UI, no external dependencies`;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <BlogNav />
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Expense Tracker</h1>
        <p className="mb-8 text-neutral-400">A personal finance tracker built with vibecoding in ~8 minutes.</p>

        {/* Demo */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 mb-8 space-y-6">
          {/* Balance cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-neutral-800 p-4 text-center">
              <div className="text-xs text-neutral-500 mb-1">Income</div>
              <div className="text-lg font-bold text-green-400">${income.toLocaleString()}</div>
            </div>
            <div className="rounded-xl bg-neutral-800 p-4 text-center">
              <div className="text-xs text-neutral-500 mb-1">Expenses</div>
              <div className="text-lg font-bold text-red-400">${expenses.toLocaleString()}</div>
            </div>
            <div className="rounded-xl bg-neutral-800 p-4 text-center">
              <div className="text-xs text-neutral-500 mb-1">Balance</div>
              <div className={`text-lg font-bold ${balance >= 0 ? "text-green-400" : "text-red-400"}`}>
                ${balance.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Category breakdown */}
          {Object.keys(expenseByCategory).length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-neutral-400">Expense Breakdown</h3>
              {Object.entries(expenseByCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, amt]) => (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-xs w-24 text-neutral-400">{cat}</span>
                    <div className="flex-1 h-4 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(amt / expenses) * 100}%`,
                          backgroundColor: categoryColors[cat] || "#6b7280",
                        }}
                      />
                    </div>
                    <span className="text-xs text-neutral-400 w-16 text-right">${amt}</span>
                  </div>
                ))}
            </div>
          )}

          {/* Add form */}
          <div className="flex flex-wrap gap-2">
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Description"
              className="flex-1 min-w-[120px] rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-200 placeholder-neutral-600 focus:border-purple-500/50 focus:outline-none"
            />
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              type="number"
              min="0"
              step="0.01"
              className="w-24 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-200 placeholder-neutral-600 focus:border-purple-500/50 focus:outline-none"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-200 focus:outline-none"
            >
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "income" | "expense")}
              className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-200 focus:outline-none"
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <button
              onClick={add}
              disabled={!desc.trim() || !amount}
              className="rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-600 disabled:opacity-50 transition"
            >
              Add
            </button>
          </div>

          {/* Transactions */}
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg bg-neutral-800 px-4 py-2.5 text-sm group">
                <div className="flex items-center gap-3">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: categoryColors[t.category] || "#6b7280" }}
                  />
                  <span className="text-neutral-200">{t.description}</span>
                  <span className="text-xs text-neutral-600">{t.category}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={t.type === "income" ? "text-green-400" : "text-red-400"}>
                    {t.type === "income" ? "+" : "-"}${t.amount}
                  </span>
                  <button
                    onClick={() => remove(t.id)}
                    className="text-neutral-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
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
