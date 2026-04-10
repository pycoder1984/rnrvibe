"use client";

import BlogNav from "@/components/BlogNav";
import { getApiBase } from "@/lib/api-config";
import { useState, useRef, useEffect, useCallback } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS = [
  { label: "Analyze AAPL", prompt: "Give me a full technical analysis of AAPL with options strategy suggestions." },
  { label: "NVDA Options", prompt: "What options strategy would you recommend for NVDA right now? I'm moderately bullish for the next 30 days." },
  { label: "SPY Hedging", prompt: "I hold a large SPY position. What hedging strategies using options can protect my downside while keeping upside exposure?" },
  { label: "Iron Condor Setup", prompt: "Walk me through setting up an iron condor on TSLA. What strike prices and expiration should I consider?" },
  { label: "Earnings Play", prompt: "MSFT has earnings coming up. What options strategies work best for earnings plays, and what are the risks?" },
  { label: "Bull Call Spread", prompt: "Explain a bull call spread strategy on AMD. When is this better than just buying calls?" },
  { label: "Wheel Strategy", prompt: "Explain the wheel strategy (selling puts then covered calls). What stocks are good candidates for this?" },
  { label: "Market Outlook", prompt: "Give me a technical analysis of the current US market using SPY, QQQ, and IWM. What sectors look strongest?" },
];

const WATCHLIST_PRESETS = [
  { name: "Mega Cap Tech", tickers: ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA"] },
  { name: "Semiconductors", tickers: ["NVDA", "AMD", "INTC", "AVGO", "QCOM", "MU", "TSM"] },
  { name: "ETFs", tickers: ["SPY", "QQQ", "IWM", "DIA", "XLF", "XLE", "ARKK"] },
  { name: "High IV Options", tickers: ["TSLA", "MARA", "COIN", "PLTR", "SQ", "RIVN", "SOFI"] },
];

export default function TradingStrategyPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Welcome to the AI Trading Strategy Advisor. I can help you with:\n\n" +
        "- **Technical Analysis** — chart patterns, support/resistance, indicators\n" +
        "- **Options Strategies** — spreads, condors, covered calls, hedging\n" +
        "- **Risk Assessment** — position sizing, stop-losses, portfolio protection\n" +
        "- **Market Outlook** — sector analysis, correlation, catalysts\n\n" +
        "Enter a stock ticker or describe your trading scenario to get started.\n\n" +
        "---\n*Disclaimer: This is AI-generated educational content, not financial advice. Always do your own research and consult a licensed financial advisor before making investment decisions.*",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "watchlist">("chat");
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("rnrvibe-trading-watchlist");
      return saved ? JSON.parse(saved) : ["AAPL", "NVDA", "TSLA", "SPY", "QQQ"];
    } catch {
      return ["AAPL", "NVDA", "TSLA", "SPY", "QQQ"];
    }
  });
  const [newTicker, setNewTicker] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("rnrvibe-trading-watchlist", JSON.stringify(watchlist));
    }
  }, [watchlist]);

  const addToWatchlist = useCallback((ticker: string) => {
    const t = ticker.trim().toUpperCase();
    if (t && !watchlist.includes(t)) {
      setWatchlist((prev) => [...prev, t]);
    }
    setNewTicker("");
  }, [watchlist]);

  const removeFromWatchlist = (ticker: string) => {
    setWatchlist((prev) => prev.filter((t) => t !== ticker));
  };

  const analyzeFromWatchlist = (ticker: string) => {
    setActiveTab("chat");
    setInput(`Give me a full technical analysis of ${ticker} with current options strategy recommendations.`);
  };

  const send = async (overridePrompt?: string) => {
    const userMsg = (overridePrompt || input).trim();
    if (!userMsg || loading) return;
    setInput("");

    const updated: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(updated);
    setLoading(true);
    setStreaming(true);

    const context = updated
      .slice(-10)
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n\n");

    abortRef.current = new AbortController();

    try {
      const res = await fetch(`${getApiBase()}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "trading-strategy",
          prompt: context,
          stream: true,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Request failed" }));
        setMessages([...updated, { role: "assistant", content: `Error: ${data.error || "Something went wrong. Is Ollama running?"}` }]);
        setLoading(false);
        setStreaming(false);
        return;
      }

      if (!res.body) {
        setMessages([...updated, { role: "assistant", content: "No response received." }]);
        setLoading(false);
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      setMessages([...updated, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(Boolean);

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const json = JSON.parse(line.slice(6));
            if (json.token) {
              fullText += json.token;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: fullText };
                return copy;
              });
            }
            if (json.done) break;
          } catch {
            // skip
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // user cancelled
      } else {
        setMessages([
          ...updated,
          { role: "assistant", content: "Failed to connect. Make sure Ollama is running." },
        ]);
      }
    } finally {
      setLoading(false);
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const cancel = () => { abortRef.current?.abort(); };

  const clearChat = () => {
    setMessages([messages[0]]);
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-950 text-white">
      <BlogNav />
      <div className="flex-1 flex flex-col mx-auto w-full max-w-5xl px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <span className="text-2xl">📈</span> AI Trading Strategy Advisor
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Technical analysis and options strategy insights powered by Gemma 4 — running locally via Ollama.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab("chat")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === "chat"
                ? "bg-purple-500/20 border-purple-500 text-purple-300 border"
                : "bg-neutral-900 border-neutral-800 text-neutral-400 border hover:border-neutral-700"
            }`}
          >
            Analysis Chat
          </button>
          <button
            onClick={() => setActiveTab("watchlist")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === "watchlist"
                ? "bg-purple-500/20 border-purple-500 text-purple-300 border"
                : "bg-neutral-900 border-neutral-800 text-neutral-400 border hover:border-neutral-700"
            }`}
          >
            Watchlist
          </button>
          {messages.length > 1 && activeTab === "chat" && (
            <button
              onClick={clearChat}
              className="ml-auto text-xs text-neutral-500 hover:text-red-400 transition px-3 py-2 rounded-lg border border-neutral-800 hover:border-red-500/30"
            >
              Clear Chat
            </button>
          )}
        </div>

        {/* Watchlist Tab */}
        {activeTab === "watchlist" && (
          <div className="space-y-6">
            {/* Add Ticker */}
            <div className="flex gap-2">
              <input
                value={newTicker}
                onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && addToWatchlist(newTicker)}
                placeholder="Add ticker (e.g. AAPL)"
                maxLength={10}
                className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-200 placeholder-neutral-600 focus:border-purple-500/50 focus:outline-none"
              />
              <button
                onClick={() => addToWatchlist(newTicker)}
                disabled={!newTicker.trim()}
                className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-purple-500 disabled:opacity-40"
              >
                Add
              </button>
            </div>

            {/* Preset Watchlists */}
            <div>
              <h3 className="text-xs text-neutral-500 mb-2 uppercase tracking-wider">Quick Add Presets</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {WATCHLIST_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      const newTickers = preset.tickers.filter((t) => !watchlist.includes(t));
                      setWatchlist((prev) => [...prev, ...newTickers]);
                    }}
                    className="text-left p-3 rounded-xl border border-neutral-800 bg-neutral-900 hover:border-neutral-700 transition"
                  >
                    <div className="text-sm font-medium text-neutral-200">{preset.name}</div>
                    <div className="text-xs text-neutral-500 mt-1">{preset.tickers.join(", ")}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Watchlist Grid */}
            <div>
              <h3 className="text-xs text-neutral-500 mb-2 uppercase tracking-wider">Your Watchlist ({watchlist.length})</h3>
              {watchlist.length === 0 ? (
                <p className="text-sm text-neutral-600">No tickers in watchlist. Add some above.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {watchlist.map((ticker) => (
                    <div
                      key={ticker}
                      className="group p-3 rounded-xl border border-neutral-800 bg-neutral-900 hover:border-neutral-700 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-neutral-200">{ticker}</span>
                        <button
                          onClick={() => removeFromWatchlist(ticker)}
                          className="text-neutral-600 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition"
                        >
                          x
                        </button>
                      </div>
                      <button
                        onClick={() => analyzeFromWatchlist(ticker)}
                        className="mt-2 w-full text-xs text-purple-400 hover:text-purple-300 transition py-1 rounded-lg border border-purple-500/20 hover:border-purple-500/40"
                      >
                        Analyze
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === "chat" && (
          <>
            {/* Quick Prompts */}
            {messages.length <= 1 && (
              <div className="mb-4">
                <h3 className="text-xs text-neutral-500 mb-2 uppercase tracking-wider">Quick Prompts</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {QUICK_PROMPTS.map((qp) => (
                    <button
                      key={qp.label}
                      onClick={() => send(qp.prompt)}
                      disabled={loading}
                      className="text-left p-3 rounded-xl border border-neutral-800 bg-neutral-900 hover:border-purple-500/40 hover:bg-purple-500/5 transition text-sm"
                    >
                      <div className="font-medium text-neutral-200">{qp.label}</div>
                      <div className="text-xs text-neutral-500 mt-1 line-clamp-2">{qp.prompt}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 pb-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-purple-500 text-white rounded-br-md"
                        : "bg-neutral-800 text-neutral-200 rounded-bl-md"
                    }`}
                  >
                    <div className="prose prose-sm prose-invert whitespace-pre-wrap break-words [&_*]:!text-inherit [&_table]:w-full [&_th]:text-left [&_th]:p-2 [&_td]:p-2 [&_th]:border-b [&_th]:border-neutral-700 [&_td]:border-b [&_td]:border-neutral-800">
                      {msg.content || (streaming && i === messages.length - 1 ? "" : "")}
                    </div>
                  </div>
                </div>
              ))}
              {loading && !streaming && (
                <div className="flex justify-start">
                  <div className="bg-neutral-800 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex gap-3 pt-4 border-t border-neutral-800">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                placeholder="Enter a ticker (AAPL), ask about options strategies, or describe a scenario..."
                disabled={loading}
                className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-200 placeholder-neutral-600 focus:border-purple-500/50 focus:outline-none disabled:opacity-50"
              />
              {loading ? (
                <button
                  onClick={cancel}
                  className="rounded-xl border border-red-500/30 px-5 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
                >
                  Stop
                </button>
              ) : (
                <button
                  onClick={() => send()}
                  disabled={!input.trim()}
                  className="rounded-xl bg-purple-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
