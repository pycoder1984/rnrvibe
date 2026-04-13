# RnR Vibe

A vibecoding platform with 28 AI-powered tools, 22 interactive projects, 31 blog posts, and 28 guides — all running locally with Ollama, Stable Diffusion, and MusicGen/AudioGen. No cloud API bills.

**Live at [rnrvibe.com](https://www.rnrvibe.com)**

## Stack

- **Framework:** Next.js 16 (App Router, TypeScript, Tailwind CSS 4)
- **LLM:** Ollama (gemma4:e4b default, configurable via `OLLAMA_MODEL`) with automatic OpenRouter fallback when local machine is offline
- **Image Generation:** Stable Diffusion (AUTOMATIC1111 WebUI with `--api` flag)
- **Hosting:** Vercel (static/serverless) + Cloudflare Tunnel (AI services on local machine)
- **Content:** MDX blog posts and guides with gray-matter frontmatter

## Prerequisites

- **Node.js** 18+
- **Ollama** running locally (`ollama serve`) with a model pulled (e.g. `ollama pull gemma4:e4b`)
- **Stable Diffusion WebUI** (AUTOMATIC1111) running with `--api` flag — required for image tools only

## Getting Started

```bash
# Install dependencies
npm install

# Development (hot reload)
npm run dev

# Production build
npm run build
npm run start -- -p 4000
```

Or use the startup script: `C:\Users\<you>\Desktop\start-rnrvibe.bat` (starts Ollama, website on port 4000, and Cloudflare Tunnel).

## Project Structure

```
app/
  api/              # 11 API routes (chat, image generation, health, etc.)
  tools/            # 28 AI tool pages
  projects/         # 22 interactive project demos
  blog/             # Blog listing + [slug] pages
  guides/           # Guide listing + [slug] pages
  compare/          # Comparison pages (vs Cursor, Copilot, etc.)
  dashboard/        # Admin dashboard
components/         # Shared UI components
content/
  blog/             # 31 MDX blog posts
  guides/           # 28 MDX guides
data/
  projects.ts       # Project registry
  tools.ts          # Tool registry
lib/
  api-config.ts     # API base URL config
  guardrails.ts     # Input sanitization, injection detection, output filtering
  llm-provider.ts   # Ollama + OpenRouter fallback with health checks
  mdx.ts            # MDX file loading utilities
  rate-limit.ts     # Shared rate limiting
  request-log.ts    # Request logging
public/             # Static assets
```

## AI Services

### Ollama (LLM)

Runs on `http://localhost:11434` by default. Used by the chat tool and logo generator (prompt generation phase).

| Env Variable | Default | Description |
|---|---|---|
| `OLLAMA_URL` | `http://localhost:11434` | Ollama API base URL |
| `OLLAMA_MODEL` | `gemma4:e4b` | Model for chat completions |

### Stable Diffusion (Image Generation)

Runs on `http://127.0.0.1:7860` by default. Used by the Image Generator, Image Studio, and Logo Generator.

| Env Variable | Default | Description |
|---|---|---|
| `SD_URL` | `http://127.0.0.1:7860` | Stable Diffusion WebUI API URL |

All three image tools check SD connectivity on page load and show an error banner with retry if it's unreachable.

### Audio Server (MusicGen + AudioGen)

Runs on `http://127.0.0.1:7870` by default. Used by the AI Audio Generator tool. Not started by `npm run dev` — launch manually with `python scripts/audio_server.py`. See [`scripts/README.md`](scripts/README.md) for one-time setup (Windows gotchas around `av` and `xformers` are documented there).

| Env Variable | Default | Description |
|---|---|---|
| `AUDIO_URL` | `http://127.0.0.1:7870` | Local audio server base URL |

## Key Features

- **28 AI Tools** — chat, code generation, image generation, logo design, music + sound-effect generation, code review, and more
- **22 Interactive Projects** — hands-on demos (Pomodoro timer, Kanban board, Drawing canvas, etc.)
- **31 Blog Posts + 28 Guides** — MDX content about vibecoding, AI tools, and development
- **Security Hardened** — input sanitization, prompt injection detection, output filtering, rate limiting
- **Fully Local AI** — no external API keys needed, runs on your own hardware
- **SEO Optimized** — dynamic OG images, structured data, sitemap, RSS feed

## Environment Variables

All optional — defaults work for standard local setup:

```env
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=gemma4:e4b
SD_URL=http://127.0.0.1:7860
AUDIO_URL=http://127.0.0.1:7870
OPENROUTER_API_KEY=          # optional — enables cloud LLM fallback when Ollama is unreachable
OPENROUTER_MODEL=            # optional — pin to a single free model; unset rotates through a fallback list
```

## License

Private project.
