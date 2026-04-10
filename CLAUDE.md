# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is this project?

RnR Vibe is a vibecoding platform at rnrvibe.com. It has AI-powered tools (chat, image generation, code tools), interactive project demos, and MDX blog/guide content. AI inference runs locally via Ollama with an automatic fallback to OpenRouter when the local machine is off.

## Build & dev commands

```bash
npm run dev                                 # Dev server on port 3000
npm run build && npm run start -- -p 4000   # Production on port 4000
npm run lint                                # ESLint (flat config, eslint 9)
```

No test framework is configured — there are no unit or integration tests.

The startup bat file (`C:\Users\obaid\Desktop\start-rnrvibe.bat`) handles Ollama, the website (port 4000), and Cloudflare Tunnel.

## Tech stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- Ollama for local LLM inference (default model: gemma4:e4b)
- OpenRouter as cloud LLM fallback (free tier, configurable model)
- Stable Diffusion AUTOMATIC1111 WebUI for image generation
- MDX with gray-matter for blog/guide content
- Deployed via Vercel (static) + Cloudflare Tunnel (AI services from local machine)

## Architecture

### LLM provider abstraction (`lib/llm-provider.ts`)

All LLM calls go through `generate()` and `streamGenerate()` in `lib/llm-provider.ts`. This module health-checks Ollama every 30s; if Ollama is down and `OPENROUTER_API_KEY` is set, it falls back to OpenRouter. Chat route handles both providers' streaming formats: Ollama uses NDJSON, OpenRouter uses SSE (`data: {json}\n\n`).

### API route pattern

All AI API routes live in `app/api/` and follow this flow:
1. Rate-limit check via `lib/rate-limit.ts` (in-memory, per-IP, per-namespace)
2. Input validation and `detectInjection()` from `lib/guardrails.ts`
3. `sanitizeInput()` → `hardenSystemPrompt()` → call LLM provider
4. `filterOutput()` on the response before returning
5. Every request is logged via `lib/request-log.ts`

### Tool system

Tool UIs are in `app/tools/[tool-name]/page.tsx` — all are client components (`"use client"`). Each tool sends a `tool` ID (not a raw system prompt) to the chat API. The server maps it to a hardcoded system prompt in `ALLOWED_SYSTEM_PROMPTS` in `lib/guardrails.ts`. This prevents client-side system prompt injection.

### Client API routing (`lib/api-config.ts`)

Client-side fetch calls use `API_BASE` from `lib/api-config.ts`: empty string on localhost (same-origin), `https://api.rnrvibe.com` in production. This routes AI API calls through the Cloudflare Tunnel to the local machine.

### Content system

Blog and guide content is in `content/blog/*.mdx` and `content/guides/*.mdx` with frontmatter parsed by gray-matter. Projects are registered in `data/projects.ts` and rendered from `app/projects/[name]/page.tsx`.

## Conventions

- Image tools (Image Generator, Image Studio, Logo Generator) check Stable Diffusion connectivity on mount and show an error banner with retry if down. Follow this pattern for any new image tools.
- API routes use `SD_URL` and `OLLAMA_URL` env vars with localhost defaults.
- Blog/guide MDX files need frontmatter: title, date, description, tags, readTime (and difficulty for guides).
- Project entries in `data/projects.ts` need: href, title, description, time, icon, tags, difficulty (Beginner/Intermediate/Advanced).
- Components use Tailwind with the project's dark theme (neutral-950 bg, purple-500 accents).
- Path alias `@/*` maps to the project root.
- Adding a new tool requires: a page in `app/tools/`, a tool ID entry in `ALLOWED_SYSTEM_PROMPTS` in `lib/guardrails.ts`, and a registry entry in `data/tools.ts`.

## Environment variables

All optional — defaults work for standard local setup:

| Variable | Default | Purpose |
|---|---|---|
| `OLLAMA_URL` | `http://localhost:11434` | Ollama API base |
| `OLLAMA_MODEL` | `gemma4:e4b` | Model for chat (note: `lib/llm-provider.ts` currently defaults to `gemma3:4b` — env var overrides) |
| `SD_URL` | `http://127.0.0.1:7860` | Stable Diffusion WebUI API |
| `OPENROUTER_API_KEY` | (none) | Enables cloud LLM fallback |
| `OPENROUTER_MODEL` | `qwen/qwen3-plus:free` | Cloud fallback model |

## Things to watch out for

- Production runs on port 4000 (not 3000) — Cloudflare Tunnel points there.
- Stable Diffusion must be started with `--api` flag for image tools to work.
- System has ~14.5 GB available RAM — large LLM models (8B+) may not load. Stick to efficient models.
- `data/generated-images/`, `data/subscribers.json`, and `*.jsonl` logs are gitignored.
- The default model in `lib/llm-provider.ts` (`gemma3:4b`) differs from the CLAUDE.md/README stated default (`gemma4:e4b`). The env var `OLLAMA_MODEL` is what actually controls the model in production.
