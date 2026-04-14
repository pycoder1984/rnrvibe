"use client";
import { getApiBase } from "@/lib/api-config";

import BlogNav from "@/components/BlogNav";
import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hey! I'm the RnR Vibe assistant. Ask me anything about vibecoding, AI tools, prompt engineering, or building projects. What are you working on?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");

    const updated: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(updated);
    setLoading(true);

    try {
      // Build conversation context from last 10 messages
      const context = updated
        .slice(-10)
        .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
        .join("\n\n");

      const res = await fetch(`${getApiBase()}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "chat",
          prompt: context,
          stream: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setMessages([
          ...updated,
          { role: "assistant", content: `Error: ${data.error || "Something went wrong. Please try again."}` },
        ]);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      let full = "";
      setMessages([...updated, { role: "assistant", content: "" }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          try {
            const json = JSON.parse(line.slice(6));
            if (json.token) {
              full += json.token;
              setMessages([...updated, { role: "assistant", content: full }]);
            }
          } catch { /* skip */ }
        }
      }
    } catch {
      setMessages([
        ...updated,
        { role: "assistant", content: "Failed to connect. Make sure the server is running." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-950 text-white">
      <BlogNav />
      <div className="flex-1 flex flex-col mx-auto w-full max-w-3xl px-4 sm:px-6 py-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold tracking-tight">AI Chat Assistant</h1>
          <p className="text-sm text-neutral-400">Ask anything about vibecoding, prompts, tools, or code.</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-purple-500 text-white rounded-br-md"
                    : "bg-neutral-800 text-neutral-200 rounded-bl-md"
                }`}
              >
                <div className="prose text-sm whitespace-pre-wrap [&_*]:!text-inherit">{msg.content}</div>
              </div>
            </div>
          ))}
          {loading && (
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
            placeholder="Type a message..."
            disabled={loading}
            className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-200 placeholder-neutral-600 focus:border-purple-500/50 focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="rounded-xl bg-purple-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
