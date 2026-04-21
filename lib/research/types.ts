export type SearchEngine = "duckduckgo" | "wikipedia" | "arxiv";

export interface SearchHit {
  title: string;
  url: string;
  snippet: string;
  engine: SearchEngine;
  query: string;
}

export interface FetchedSource {
  n: number;
  title: string;
  url: string;
  domain: string;
  text: string;
}

export interface Source {
  n: number;
  title: string;
  url: string;
  domain: string;
}

export type ResearchEvent =
  | { type: "phase"; phase: "planning" | "searching" | "reading" | "synthesizing" }
  | { type: "plan"; queries: string[] }
  | { type: "search_result"; query: string; count: number; engine: SearchEngine }
  | { type: "source_fetched"; url: string; title: string; ok: boolean; bytes?: number }
  | { type: "token"; text: string }
  | { type: "done"; sources: Source[]; provider: "ollama" | "openrouter" }
  | { type: "error"; message: string };
