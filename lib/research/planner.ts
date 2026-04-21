import { generate } from "@/lib/llm-provider";

const PLANNER_SYSTEM = `You are a research planner. Given a user question, output a JSON array of 3 focused web-search queries that together would help answer it. Each query should be 4-10 words, use keywords a search engine would match, and cover a distinct angle of the question.

Output format: ONLY a JSON array of strings, nothing else. No markdown, no prose, no code fences.

Example input: "How does vibecoding differ from traditional coding?"
Example output: ["vibecoding AI-assisted development definition", "traditional software development workflow", "AI pair programming vs manual coding"]`;

export async function planQueries(question: string, signal?: AbortSignal): Promise<string[]> {
  try {
    const { text } = await generate({
      prompt: question,
      system: PLANNER_SYSTEM,
      signal,
    });

    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [question];

    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) return [question];

    const queries = parsed
      .filter((q): q is string => typeof q === "string")
      .map((q) => q.trim())
      .filter((q) => q.length > 0 && q.length <= 200)
      .slice(0, 3);

    return queries.length > 0 ? queries : [question];
  } catch {
    return [question];
  }
}
