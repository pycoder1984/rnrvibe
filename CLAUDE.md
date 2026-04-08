# CLAUDE.md — RnR Vibe

## What is this project?

RnR Vibe is a vibecoding platform at rnrvibe.com. It has AI-powered tools (chat, image generation, code tools), interactive project demos, and MDX blog/guide content. Everything runs locally using Ollama (LLM) and Stable Diffusion (images).

## Tech stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- Ollama for LLM inference (default model: gemma4:e4b)
- Stable Diffusion AUTOMATIC1111 WebUI for image generation
- MDX with gray-matter for blog/guide content
- Deployed via Vercel (static) + Cloudflare Tunnel (AI services from local machine)

## Architecture

- All AI API routes live in `app/api/` and proxy to local Ollama/SD services
- Tool UIs are in `app/tools/[tool-name]/page.tsx` — all are client components ("use client")
- Blog and guide content is in `content/blog/*.mdx` and `content/guides/*.mdx` with frontmatter
- Projects are registered in `data/projects.ts` and rendered from `app/projects/[name]/page.tsx`
- Shared rate limiting in `lib/rate-limit.ts`, security guardrails in `lib/guardrails.ts`

## Conventions

- Image tools (Image Generator, Image Studio, Logo Generator) all check Stable Diffusion connectivity on mount and show an error banner with retry if down. Follow this same pattern for any new image tools.
- API routes use `SD_URL` and `OLLAMA_URL` env vars with localhost defaults.
- The chat route model is configurable via `OLLAMA_MODEL` env var.
- Blog/guide MDX files need frontmatter: title, date, description, tags, readTime (and difficulty for guides).
- Project entries in `data/projects.ts` need: href, title, description, time, icon, tags, difficulty (Beginner/Intermediate/Advanced).
- Components use Tailwind with the project's dark theme (neutral-950 bg, purple-500 accents).

## Running locally

```bash
npm run dev              # Development on port 3000
npm run build && npm run start -- -p 4000   # Production on port 4000
```

The startup bat file (`C:\Users\obaid\Desktop\start-rnrvibe.bat`) handles Ollama, the website (port 4000), and Cloudflare Tunnel.

## Key directories

- `app/api/` — API routes (chat, generate-image, generate-logo, image-studio, health, sd-models, etc.)
- `app/tools/` — 27 AI tool pages
- `app/projects/` — 18 interactive demos
- `content/` — MDX content (blog + guides)
- `lib/` — Shared utilities (guardrails, rate limiting, MDX loading, API config)
- `data/` — Registries (projects.ts, tools.ts) and runtime data

## Things to watch out for

- The site runs on port 4000 in production (not 3000) — Cloudflare Tunnel points to 4000.
- Stable Diffusion must be started with `--api` flag for image tools to work.
- System has ~14.5 GB available RAM — large LLM models (8B+) may not load. Stick to efficient models (gemma4:e4b, gemma3:4b).
- `data/generated-images/` is gitignored — user-generated content stays local.
- `data/subscribers.json` and `*.jsonl` logs are also gitignored.
