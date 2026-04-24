# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is this project?

RnR Vibe is a vibecoding platform at rnrvibe.com. It has AI-powered tools (chat, image generation, code tools), interactive project demos, and MDX blog/guide content. AI inference runs locally via Ollama with an automatic fallback to OpenRouter when the local machine is off.

## Build & dev commands

```bash
npm run dev                                 # Dev server on port 3000
npm run build && npm run start -- -p 4000   # Production on port 4000
npm run lint                                # ESLint — script is bare `eslint` (flat config via eslint.config.mjs, lints whole repo). No --fix by default.
```

No test framework is configured — there are no unit or integration tests.

The startup stack is split across three Desktop bat files so VRAM/RAM-hungry services only run on demand:

| Script | Starts | When |
|---|---|---|
| `start-rnrvibe-core.bat` | Ollama + website (port 4000) + Cloudflare Tunnel | Always-on |
| `start-rnrvibe-sd.bat` | Stable Diffusion WebUI (port 7860, GPU) | On demand for image tools |
| `start-rnrvibe-audio.bat` | Audio server (port 7870, CPU-pinned) | On demand for audio tool |
| `stop-sd.bat` / `stop-audio.bat` | Kill the respective service | Free VRAM/RAM before switching |
| `rnrvibe-status.bat` | Probe all ports + cloudflared process | Health check |

The SD and audio start scripts detect a conflicting service and offer to auto-stop it before starting.

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

### Chat streaming: NDJSON → SSE normalization (`app/api/chat/route.ts`)

`streamGenerate()` returns the raw upstream body untouched, so the chat route is the single place where the two provider formats are converted into a unified SSE stream for the browser. Keep the invariants below when editing that route — mixing them up is the common cause of "stream works with Ollama but not OpenRouter" (or vice versa) bugs.

- **Ollama → NDJSON**: one JSON object per line terminated by `\n`. Tokens arrive as `{ response: "..." }`; completion is signaled by `{ done: true, ... }` on a final line. No buffering across chunks is needed because `\n.filter(Boolean)` is line-complete at chunk boundaries — an Ollama chunk is always whole lines.
- **OpenRouter → SSE**: framed lines prefixed `data: ` and terminated by `\n\n`. Tokens are at `json.choices[0].delta.content`; the terminal frame is the literal string `data: [DONE]`. A single TCP chunk can split mid-frame, so the route keeps an `sseBuffer` across reads and only parses lines up to the last newline, pushing the tail back into the buffer.
- **Downstream format (what the browser sees)**: both paths re-emit `data: {"token":"..."}\n\n` during the stream and a final `data: {"done":true}\n\n`. Any client that reads from `/api/chat` with `stream: true` should assume SSE regardless of which upstream served the request.
- `filterOutput()` runs on the full accumulated response before `addLog()` — not on every token. This matters because the guardrail's pattern matching is line-oriented and would produce false positives against partial tokens.
- On `AbortError` (timeout hit), the route logs `status: "timeout"` but does not enqueue any further SSE frames; the browser sees an abruptly closed stream. Clients should treat a stream that ends without a `{done:true}` frame as an error, not a successful empty response.

### API route pattern

All AI API routes live in `app/api/` and follow this flow:
1. Rate-limit check via `lib/rate-limit.ts` (in-memory, per-IP, per-namespace). Each route passes a distinct `namespace` to `checkRateLimit()` — pick one per route, don't reuse an existing namespace or buckets will share state across unrelated endpoints (e.g. deep-research uses `"deep-research"` at 10/hour because its fan-out cost differs from chat).
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

### Deep Research pipeline (`lib/research/*`)

The `/tools/deep-research` tool runs a single-pass `plan → search → read → synthesize` pipeline over free public sources (DuckDuckGo HTML, Wikipedia OpenSearch, arXiv). No API keys. Module breakdown:

- `planner.ts` — LLM turns the question into ≤3 focused sub-queries (falls back to `[question]` on JSON parse failure).
- `search.ts` — parallel fan-out across engines, 8s per-engine timeout, `Promise.allSettled` so one failure doesn't tank the round, capped at 15 hits post-dedup.
- `fetcher.ts` — `fetch` + `@mozilla/readability` + `jsdom`, 6s timeout, 1 MB body cap, 4 KB text cap per source. **SSRF-guarded**: rejects non-http(s) and private IP ranges (10/8, 172.16/12, 192.168/16, 127/8, ::1, link-local).
- `dedup.ts` — URL canonicalization (strip hash/utm_*/trailing slash, lowercase host) + Jaccard near-dup collapse on titles.
- `sanitize.ts` — **critical, no upstream equivalent**: runs scraped content through injection-pattern strip + control/zero-width char cleanup, then wraps each source in a `<source id="n" url="..." title="...">` block. The synth system prompt tells the LLM to treat `<source>` content as data, not instructions.
- `synthesize.ts` — `streamGenerate()` produces a 300–600 word cited answer; tokens forwarded as SSE `{ type: "token" }` events.

API route `app/api/deep-research/route.ts` uses a dedicated rate-limit namespace (stricter: 10/hour/IP since each request fans out to ~10 external HTTP calls). SSE event types are defined in `lib/research/types.ts` (`phase`, `plan`, `search_result`, `source_fetched`, `token`, `done`, `error`). The `"deep-research"` entry in `ALLOWED_SYSTEM_PROMPTS` holds the synthesis prompt.

See `DEEP_RESEARCH_PLAN.md` for the full write-up, including the v2 parking lot (iteration loop, SearXNG, markdown export).

### Localhost-only dashboard routes

`/api/services` (service probe), `/api/service-logs` (bat-file log tailing from the Desktop), and `/api/system-metrics` (CPU / RAM / GPU sampling) all enforce an `isLocal(req)` check that (a) rejects any request carrying `cf-connecting-ip` (i.e. coming through Cloudflare) and (b) requires the `Host` header to start with `localhost` / `127.0.0.1`. Returns 403 otherwise. Use this same pattern for any future route that exposes infrastructure topology — it must never leak through the tunnel.

### Middleware (`middleware.ts`)

Two site-wide invariants enforced at the edge (matcher: `/dashboard/:path*`, `/api/:path*`):

1. **Dashboard lockdown** — `/dashboard/*` and `/api/dashboard/*` get the same Cloudflare-header + localhost-host check as the routes above. This is belt-and-braces with `isLocal(req)` inside individual routes; keep both.
2. **CORS allowlist** — only `https://www.rnrvibe.com`, `https://rnrvibe.com`, `http://localhost:4000`, `http://localhost:3000` are allowed origins for `/api/*`. Preflight from anywhere else gets 403; non-preflight from disallowed origins gets no CORS headers (so the browser blocks it). If you add a new frontend that calls the API, add its origin to `ALLOWED_ORIGINS` here.

## Conventions

- Image tools (Image Generator, Image Studio, Logo Generator) check Stable Diffusion connectivity on mount and show an error banner with retry if down. Follow this pattern for any new image tools.
- API routes use `SD_URL`, `OLLAMA_URL`, and `AUDIO_URL` env vars with localhost defaults.
- The audio generator tool calls a separate local Python FastAPI server (`scripts/audio_server.py`) that wraps MusicGen + AudioGen. Not part of `npm run dev` — must be started manually.
- Blog/guide MDX files need frontmatter: title, date, description, tags, readTime (and difficulty for guides).
- Project entries in `data/projects.ts` need: href, title, description, time, icon, tags, difficulty (Beginner/Intermediate/Advanced).
- Components use Tailwind with the project's dark theme (neutral-950 bg, purple-500 accents).
- Path alias `@/*` maps to the project root.
- Adding a new tool requires: a page in `app/tools/<slug>/page.tsx`, a tool ID entry in `ALLOWED_SYSTEM_PROMPTS` in `lib/guardrails.ts`, and a registry entry in `data/tools.ts`. Optionally add `app/tools/<slug>/layout.tsx` with per-tool `metadata` + a `FAQPage` JSON-LD block (see `app/tools/chat/layout.tsx` for the pattern) — the `/faq` page and sitemap pick these up for SEO. Project (demo) metadata lives separately in `lib/project-metadata.ts`.
- Client state that needs to persist across reloads should use `useLocalStorageState(key, getInitial)` from `lib/use-local-storage.ts` — not raw `useState + useEffect`. It returns `[value, setValue, hydrated]`, matches the server snapshot during the hydration pass (no mismatch warnings) via `useSyncExternalStore`, and cross-syncs hook instances bound to the same key within the same document via a `rnrvibe-ls-change` custom event (same-document writes don't fire native `storage` events). Gate any render that depends on stored data on the `hydrated` flag.

## Environment variables

All optional — defaults work for standard local setup:

| Variable | Default | Purpose |
|---|---|---|
| `OLLAMA_URL` | `http://localhost:11434` | Ollama API base |
| `OLLAMA_MODEL` | `gemma4:e4b` | Model for chat (note: `lib/llm-provider.ts` currently defaults to `gemma3:4b` — env var overrides) |
| `SD_URL` | `http://127.0.0.1:7860` | Stable Diffusion WebUI API |
| `AUDIO_URL` | `http://127.0.0.1:7870` | Local audio server (MusicGen + AudioGen) — see `scripts/README.md` |
| `OPENROUTER_API_KEY` | (none) | Enables cloud LLM fallback |
| `OPENROUTER_MODEL` | (none — tries fallback list) | Override to force a single OpenRouter model; when unset, `lib/llm-provider.ts` rotates through `FREE_MODELS` until one responds |
| `RNRVIBE_LOG_DIR` | `~/Desktop` | Directory the dashboard tails bat-file logs from (`rnrvibe-core.log`, `rnrvibe-sd.log`, `rnrvibe-audio.log`) |

## Pending work: image-tools expansion (in progress)

Three new image features are being rolled out in separate commits. Each one is independent — if you pick up work here mid-way, check `git log` and the A1111 `extensions/` dir to see which are landed.

1. **Outpaint** — ✅ shipped in commit `71eef3c`. 5th tab in Image Studio; `handleOutpaint` in `app/api/image-studio/route.ts`. Client pads the image + builds the mask in a canvas, server calls `/sdapi/v1/img2img` with `inpainting_fill: 2` (latent noise). No A1111 extension required.
2. **Background removal** — 6th tab in Image Studio. `handleRemoveBg` in the same route hits the rembg extension at `POST /rembg` (note: NOT under `/sdapi/v1/`). Model defaults to `u2net`; first call downloads the ONNX weights (~100-200 MB) to `~/.u2net/`. Runs CPU-side via onnxruntime so it doesn't steal VRAM. Requires `stable-diffusion-webui-rembg` cloned into `C:/Users/obaid/stable-diffusion-webui/extensions/` + one SD restart (extension auto-installs rembg/onnxruntime/pymatting/pooch via `install.py`).
3. **ControlNet tool** — new standalone tool at `app/tools/controlnet/page.tsx`, registered in `data/tools.ts`, system prompt id `"controlnet"` in `ALLOWED_SYSTEM_PROMPTS`. Three modes: pose (openpose), depth, canny. Sends `alwayson_scripts.controlnet` block to `/sdapi/v1/txt2img`. Requires `sd-webui-controlnet` extension + models `control_v11p_sd15_openpose.pth`, `control_v11f1p_sd15_depth.pth`, `control_v11p_sd15_canny.pth` in `models/ControlNet/` (all three downloaded locally — ~4.1 GB). VRAM budget: +~1.2 GB on top of the base SD 1.5 model at 512×512 — tight but fits on the 6 GB GPU.

Build order is outpaint → bg-removal → controlnet. Each lands as its own commit + Vercel deploy so regressions are isolated.

## Things to watch out for

- Production runs on port 4000 (not 3000) — Cloudflare Tunnel points there.
- Stable Diffusion must be started with `--api` flag for image tools to work.
- System has ~14.5 GB available RAM — large LLM models (8B+) may not load. Stick to efficient models.
- `data/generated-images/`, `data/subscribers.json`, and `*.jsonl` logs are gitignored.
- The default model in `lib/llm-provider.ts` (`gemma3:4b`) differs from the CLAUDE.md/README stated default (`gemma4:e4b`). The env var `OLLAMA_MODEL` is what actually controls the model in production.
- OpenRouter free models rotate frequently. If the fallback list in `lib/llm-provider.ts` (`FREE_MODELS`) goes stale, update it by fetching `https://openrouter.ai/api/v1/models` and filtering for `:free` IDs.

## Scroll-controlled background video

`components/ScrollVideo.tsx` is a canvas + image-sequence scrubber mounted at the top of `app/page.tsx` as a `fixed` full-viewport background. Browsers can only seek MP4 `currentTime` to keyframes, which stutters; painting pre-extracted JPEG frames to a canvas gives smooth forward/reverse scrubbing.

- Frames live in `public/hero-frames/frame_0001.jpg` … `frame_0169.jpg` (169 frames, ~7 MB total)
- Extracted with: `ffmpeg -i public/hero-video.mp4 -vf "scale=960:-1" -q:v 6 public/hero-frames/frame_%04d.jpg`
- Scroll mapping: document-wide — frame 0 at the top of the page, frame 168 at the bottom. The canvas is `fixed inset-0` so it stays visible behind all content as the user scrolls.
- `FRAME_COUNT` in `ScrollVideo.tsx` must match the number of files in `public/hero-frames/` if the video is ever replaced.

## Hero page motion system

The hero combines six coordinated effects. Keep them working together when editing `app/page.tsx`:

- **Parallax layers** — `parallaxBadgeRef` / `parallaxTitleRef` / `parallaxSubtitleRef` / `parallaxCtaRef` each get a different `translate3d` factor in the scroll rAF loop. The refs are on wrapper divs (not the animated elements themselves) so the CSS entrance animations aren't clobbered by inline transforms.
- **Split-text reveal** — `components/RotatingTagline.tsx` renders each word as a `<span class="split-word">` with a `--i` index. The `.split-word` keyframe in `globals.css` staggers them on mount. Re-mounting via `key={index}` re-triggers the animation on each phrase change.
- **Rotating tagline** — `RotatingTagline` cycles `phrases` on an interval (default 4500ms). Each phrase is `{ prefix, highlight }`; the highlight gets the purple→indigo gradient. The component accepts an `as?: "h1" | "h2"` prop — on the homepage it MUST be rendered with `as="h2"` because the real `<h1>` is the badge ("RnR Vibe — Lightweight Vibecoding Platform") above it. Do not revert this: the badge-as-h1 is an SEO fix so "RnR Vibe" appears in the primary heading.
- **Morphing gradient** — `.morph-gradient` in `globals.css` animates `background-position` on a multi-stop linear gradient. Placed behind the hero content at `zIndex: 1`.
- **3D tilt CTAs** — the hero CTA buttons are wrapped in `<TiltCard href=...>` which handles the perspective/rotate transform on mouse move. Don't use `hover:-translate-y-*` on tilt cards — the JS transform will override it anyway.
- **Stats counter** — `components/StatsCounter.tsx` uses IntersectionObserver + `requestAnimationFrame` to count from 0 to each target value with ease-out-cubic when it enters the viewport. Values live in the `<StatsCounter stats={...} />` call in the hero section of `app/page.tsx` — update them when tool/project/post counts change.

All of these respect `prefers-reduced-motion` via the media query at the bottom of `globals.css` (plus a matching check in `StatsCounter.tsx` that jumps straight to final values).

## SEO: brand disambiguation

Google was spell-correcting "rnrvibe" → "revibe" (a much higher-traffic brand). Several pieces of the site exist specifically to fight that and should not be reverted without thought:

- `app/layout.tsx` ships **two** JSON-LD blocks: `WebSite` and `Organization`, both with `alternateName: ["RnRVibe", "rnrvibe", "rnr vibe", "RNR Vibe"]`.
- `metadata.keywords` in `app/layout.tsx` includes the brand variants. `applicationName: "RnR Vibe"` is also set.
- Homepage `<h1>` is the badge, not the rotating tagline (see Hero page motion system above). The rotating tagline is an `<h2>`.
- `/about` h1 is "About RnR Vibe", not just "About".
- Homepage footer copyright line says "RnR Vibe (rnrvibe.com)" — the plain-text domain is deliberate brand reinforcement for crawlers.

If you add new top-level pages, use the brand name explicitly in the h1 where it's natural. Don't strip "RnR Vibe" from headings to shorten them.
