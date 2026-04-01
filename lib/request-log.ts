import fs from "fs";
import path from "path";

export interface RequestLogEntry {
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

const MAX_ENTRIES = 500;
const LOG_FILE = path.join(process.cwd(), "data", "request-logs.jsonl");

let nextId = 1;
let logs: RequestLogEntry[] = [];
let initialized = false;

function loadLogs() {
  if (initialized) return;
  initialized = true;
  try {
    if (fs.existsSync(LOG_FILE)) {
      const lines = fs.readFileSync(LOG_FILE, "utf-8").split("\n").filter(Boolean);
      logs = lines
        .map((line) => {
          try { return JSON.parse(line) as RequestLogEntry; } catch { return null; }
        })
        .filter((e): e is RequestLogEntry => e !== null)
        .slice(-MAX_ENTRIES);
      if (logs.length > 0) {
        nextId = Math.max(...logs.map((l) => l.id)) + 1;
      }
    }
  } catch {
    // Start fresh if file is corrupted
    logs = [];
  }
}

function persistLog(entry: RequestLogEntry) {
  try {
    fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + "\n");
  } catch {
    // Silently fail — logs are still in memory
  }
}

function trimLogFile() {
  try {
    if (fs.existsSync(LOG_FILE)) {
      const stat = fs.statSync(LOG_FILE);
      // Trim file if it exceeds ~2MB
      if (stat.size > 2 * 1024 * 1024) {
        const recent = logs.slice(0, MAX_ENTRIES);
        fs.writeFileSync(LOG_FILE, recent.map((l) => JSON.stringify(l)).join("\n") + "\n");
      }
    }
  } catch {
    // Silently fail
  }
}

export function addLog(entry: Omit<RequestLogEntry, "id">) {
  loadLogs();
  const log = { ...entry, id: nextId++ };
  logs.unshift(log); // newest first
  if (logs.length > MAX_ENTRIES) logs.pop();
  persistLog(log);
  // Trim file every 100 entries
  if (nextId % 100 === 0) trimLogFile();
  return log;
}

export function getLogs(limit = 100, offset = 0): RequestLogEntry[] {
  loadLogs();
  return logs.slice(offset, offset + limit);
}

export function getStats() {
  loadLogs();
  const total = logs.length;
  const success = logs.filter((l) => l.status === "success").length;
  const errors = logs.filter((l) => l.status === "error").length;
  const blocked = logs.filter((l) => l.status === "blocked").length;
  const timeouts = logs.filter((l) => l.status === "timeout").length;

  const avgResponseTime =
    total > 0
      ? logs.reduce((s, l) => s + l.responseTimeMs, 0) / total
      : 0;

  const toolUsage: Record<string, number> = {};
  logs.forEach((l) => {
    toolUsage[l.tool] = (toolUsage[l.tool] || 0) + 1;
  });

  const uniqueIps = new Set(logs.map((l) => l.ip)).size;

  const tenMinAgo = Date.now() - 10 * 60 * 1000;
  const recentLogs = logs.filter((l) => new Date(l.timestamp).getTime() > tenMinAgo);
  const rpm = recentLogs.length / 10;

  return {
    total,
    success,
    errors,
    blocked,
    timeouts,
    avgResponseTime: Math.round(avgResponseTime),
    toolUsage,
    uniqueIps,
    rpm: Math.round(rpm * 10) / 10,
  };
}

export function clearLogs() {
  logs.length = 0;
  nextId = 1;
  try { fs.writeFileSync(LOG_FILE, ""); } catch { /* ignore */ }
}
