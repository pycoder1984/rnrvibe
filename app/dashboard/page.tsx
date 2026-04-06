"use client";
import { API_BASE } from "@/lib/api-config";

import { useState, useEffect, useCallback } from "react";

interface LogEntry {
  id: number;
  timestamp: string;
  ip: string;
  tool: string;
  prompt: string;
  response: string;
  responseTimeMs: number;
  status: "success" | "error" | "blocked" | "timeout";
  error?: string;
}

interface Stats {
  total: number;
  success: number;
  errors: number;
  blocked: number;
  timeouts: number;
  avgResponseTime: number;
  toolUsage: Record<string, number>;
  uniqueIps: number;
  rpm: number;
}

interface DashboardData {
  stats: Stats;
  logs: LogEntry[];
}

const statusColors: Record<string, string> = {
  success: "text-green-400 bg-green-500/10",
  error: "text-red-400 bg-red-500/10",
  blocked: "text-yellow-400 bg-yellow-500/10",
  timeout: "text-orange-400 bg-orange-500/10",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expandedLog, setExpandedLog] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/dashboard`);
      if (res.status === 403) {
        setError("Access denied — dashboard is only available on localhost");
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
      setError("");
    } catch {
      setError("Failed to connect to dashboard API");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData, autoRefresh]);

  const clearLogs = async () => {
    if (!confirm("Clear all logs?")) return;
    await fetch(`${API_BASE}/api/dashboard`, { method: "DELETE" });
    fetchData();
  };

  const stats = data?.stats;
  const logs = data?.logs || [];
  const filteredLogs = filter === "all" ? logs : logs.filter((l) => l.status === filter);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-neutral-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-purple-400">RnR</span> Dashboard
            </h1>
            <span className="text-xs bg-purple-500/10 text-purple-400 px-2 py-1 rounded-full font-medium">
              LOCAL ONLY
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                autoRefresh
                  ? "bg-green-500/10 text-green-400"
                  : "bg-neutral-800 text-neutral-400"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? "bg-green-400 animate-pulse" : "bg-neutral-600"}`} />
              {autoRefresh ? "Live" : "Paused"}
            </button>
            <button
              onClick={fetchData}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white text-xs font-medium transition"
            >
              Refresh
            </button>
            <button
              onClick={clearLogs}
              className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-medium transition"
            >
              Clear Logs
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <div className="text-xs text-neutral-500 mb-1">Total</div>
              <div className="text-2xl font-bold font-mono">{stats.total}</div>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <div className="text-xs text-neutral-500 mb-1">Success</div>
              <div className="text-2xl font-bold font-mono text-green-400">{stats.success}</div>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <div className="text-xs text-neutral-500 mb-1">Errors</div>
              <div className="text-2xl font-bold font-mono text-red-400">{stats.errors}</div>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <div className="text-xs text-neutral-500 mb-1">Blocked</div>
              <div className="text-2xl font-bold font-mono text-yellow-400">{stats.blocked}</div>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <div className="text-xs text-neutral-500 mb-1">Timeouts</div>
              <div className="text-2xl font-bold font-mono text-orange-400">{stats.timeouts}</div>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <div className="text-xs text-neutral-500 mb-1">Avg Time</div>
              <div className="text-2xl font-bold font-mono text-purple-400">{(stats.avgResponseTime / 1000).toFixed(1)}s</div>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <div className="text-xs text-neutral-500 mb-1">Unique IPs</div>
              <div className="text-2xl font-bold font-mono">{stats.uniqueIps}</div>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <div className="text-xs text-neutral-500 mb-1">Req/min</div>
              <div className="text-2xl font-bold font-mono">{stats.rpm}</div>
            </div>
          </div>
        )}

        {/* Tool usage breakdown */}
        {stats && Object.keys(stats.toolUsage).length > 0 && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">Tool Usage</h2>
            <div className="space-y-2">
              {Object.entries(stats.toolUsage)
                .sort((a, b) => b[1] - a[1])
                .map(([tool, count]) => (
                  <div key={tool} className="flex items-center gap-3">
                    <span className="text-sm text-neutral-300 w-40 truncate font-mono">{tool}</span>
                    <div className="flex-1 h-5 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500/40 rounded-full transition-all"
                        style={{ width: `${(count / stats.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-neutral-400 font-mono w-12 text-right">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Request log */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Request Log</h2>
            <div className="flex gap-1">
              {["all", "success", "error", "blocked", "timeout"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition ${
                    filter === f
                      ? "bg-purple-500/20 text-purple-400"
                      : "text-neutral-500 hover:text-white"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-neutral-500">
              <div className="text-3xl mb-2">📭</div>
              No requests logged yet. Use any AI tool to see logs appear here.
            </div>
          ) : (
            <div className="divide-y divide-neutral-800/50 max-h-[600px] overflow-y-auto">
              {filteredLogs.map((log) => (
                <div key={log.id}>
                  <button
                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                    className="w-full text-left px-6 py-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${statusColors[log.status]}`}>
                        {log.status}
                      </span>
                      <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                        {log.tool}
                      </span>
                      <span className="text-xs text-neutral-500 font-mono">
                        {log.responseTimeMs > 0 ? `${(log.responseTimeMs / 1000).toFixed(1)}s` : "—"}
                      </span>
                      <span className="text-sm text-neutral-300 truncate flex-1">
                        {log.prompt.slice(0, 80)}{log.prompt.length > 80 ? "..." : ""}
                      </span>
                      <span className="text-xs text-neutral-600 shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <svg
                        className={`w-4 h-4 text-neutral-600 transition-transform ${expandedLog === log.id ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </button>

                  {expandedLog === log.id && (
                    <div className="px-6 pb-4 space-y-3 bg-neutral-950/50">
                      <div className="grid sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="text-neutral-500">IP:</span>{" "}
                          <span className="text-neutral-300 font-mono">{log.ip}</span>
                        </div>
                        <div>
                          <span className="text-neutral-500">Time:</span>{" "}
                          <span className="text-neutral-300 font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-neutral-500">Response Time:</span>{" "}
                          <span className="text-neutral-300 font-mono">{log.responseTimeMs}ms</span>
                        </div>
                      </div>

                      {log.error && (
                        <div>
                          <div className="text-xs text-red-400 font-semibold mb-1">Error</div>
                          <div className="text-sm text-red-300 bg-red-500/5 rounded-lg p-3 font-mono">{log.error}</div>
                        </div>
                      )}

                      <div>
                        <div className="text-xs text-neutral-500 font-semibold mb-1">Prompt</div>
                        <pre className="text-sm text-neutral-300 bg-neutral-900 rounded-lg p-3 whitespace-pre-wrap break-words max-h-40 overflow-y-auto border border-neutral-800">
                          {log.prompt}
                        </pre>
                      </div>

                      {log.response && (
                        <div>
                          <div className="text-xs text-neutral-500 font-semibold mb-1">Response (truncated)</div>
                          <pre className="text-sm text-neutral-300 bg-neutral-900 rounded-lg p-3 whitespace-pre-wrap break-words max-h-40 overflow-y-auto border border-neutral-800">
                            {log.response}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
