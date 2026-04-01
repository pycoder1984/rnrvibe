# Logo Generator Tool — Build Prompt

## Overview
Build an **AI Logo Generator** tool at `/tools/logo-generator` that chains Ollama LLM + Stable Diffusion to generate professional logo variations from a brand description. User describes their brand, Ollama crafts optimized SD prompts for different logo styles, SD generates the logos.

## Architecture

### Flow
1. User fills form: brand name, industry, description, preferred colors, style preferences
2. Frontend sends to `/api/generate-logo` (SSE streaming endpoint)
3. Server sends brand info to Ollama → LLM returns 4 optimized SD prompts (one per style)
4. Server sends each prompt to SD → streams back base64 images as they complete
5. User views gallery, can download PNGs or regenerate individual styles

### API Endpoints

#### `POST /api/generate-logo` (SSE streaming)
**Request body:**
```json
{
  "brandName": "TechFlow",
  "industry": "SaaS / Developer Tools",
  "description": "A modern CI/CD platform for small teams",
  "colors": ["#6366f1", "#10b981"],
  "styles": ["minimalist", "geometric", "wordmark", "mascot"],
  "background": "transparent"
}
```

**SSE events (same pattern as image-generator):**
- `event: status` — "Generating prompts with AI...", "Generating minimalist logo...", etc.
- `event: prompts` — sends all 4 generated SD prompts so user can see/edit them
- `event: progress` — per-style progress updates
- `event: image` — `{ style: "minimalist", image: "base64...", prompt: "the prompt used" }`
- `event: error` — per-style errors
- `event: done` — all styles complete

**Rate limit:** 5 requests per 5 minutes (logo gen is heavier than plain image gen)

### Ollama Prompt Engineering

System prompt for Ollama (generate SD prompts from brand info):
```
You are an expert logo designer and Stable Diffusion prompt engineer. Given a brand description, generate exactly {N} Stable Diffusion prompts for different logo styles.

Rules:
- Each prompt must include: "logo design, vector style, clean lines, professional"
- Include the brand's color palette as color keywords
- Include style-specific keywords (see below)
- Keep prompts under 200 tokens each
- Do NOT include the brand name as text in the prompt (SD can't render text well)
- Focus on iconography and symbols that represent the brand
- Output valid JSON array of objects: [{ "style": "...", "prompt": "...", "negativePrompt": "..." }]

Style keywords:
- minimalist: "minimal, simple shapes, flat design, single icon, whitespace, modern"
- geometric: "geometric shapes, abstract, polygonal, symmetrical, mathematical"
- wordmark: "typographic, lettermark, monogram, letter-based icon, clean typography"
- mascot: "character design, friendly mascot, illustration style, cartoon, brand character"
- vintage: "retro, classic, badge style, emblem, stamp, traditional"
- gradient: "gradient colors, modern gradient, vibrant, colorful, smooth transitions"
```

**Ollama request:**
- Model: `process.env.OLLAMA_MODEL || "gemma3:4b"`
- Temperature: 0.8 (creative but structured)
- Parse JSON from response, fallback to regex extraction if needed

### Stable Diffusion Settings (optimized for logos)

```json
{
  "width": 512,
  "height": 512,
  "steps": 30,
  "cfg_scale": 9,
  "sampler_name": "DPM++ 2M",
  "scheduler": "Karras",
  "negative_prompt": "photo, realistic, photograph, blurry, low quality, text, watermark, signature, human face, complex background, gradient background, noisy, pixelated, 3d render"
}
```

- If user selects "transparent" background, append "white background, solid white background" to prompt and "colored background, gradient background" to negative prompt (user can remove white bg in post)
- Per-model timeout: 3 min (logos are 512x512, faster than large images)
- Total timeout: 15 min
- No model switching needed — use whichever SD model is currently loaded

### Available Logo Styles (user picks 1-4)

| Style | Description | Icon |
|-------|------------|------|
| Minimalist | Clean, simple single-icon logos | ◯ |
| Geometric | Abstract shapes and patterns | △ |
| Wordmark | Letter-based / monogram icons | A |
| Mascot | Character/illustration style | 🐾 |
| Vintage | Badge/emblem/retro style | ★ |
| Gradient | Modern colorful gradient logos | 🌈 |

### Frontend UI — `app/tools/logo-generator/page.tsx`

**Layout sections (top to bottom):**

1. **Header** — Title "AI Logo Generator", subtitle "Describe your brand and get professional logo concepts in seconds"

2. **Brand Form** (left panel on desktop, full width on mobile):
   - Brand Name — text input, required, max 50 chars
   - Industry — text input with datalist suggestions (Technology, Food & Beverage, Fashion, Healthcare, Education, Finance, Sports, Entertainment, Real Estate, Travel)
   - Brand Description — textarea, max 500 chars, placeholder: "What does your brand do? What feeling should the logo convey?"
   - Color Picker — up to 3 colors, with preset palettes (Professional Blue, Nature Green, Bold Red, Royal Purple, Warm Orange, Monochrome)
   - Background — toggle: White / Transparent (note: SD approximates transparency)

3. **Style Selection** (grid of 6 cards, select 1-4):
   - Each card shows style name, icon, short description
   - Selected state: purple border + checkmark
   - Max 4 enforced with toast message

4. **Generate Button** — "Generate Logos" with brand icon, disabled until name + description + at least 1 style selected

5. **AI Prompts Preview** (collapsible, shown after Ollama responds):
   - Shows the SD prompts Ollama generated for each style
   - User can edit prompts before SD generates (optional advanced feature)
   - "Regenerate Prompts" button

6. **Results Gallery**:
   - Grid of generated logos (1-4 based on styles selected)
   - Each card: style label, logo image, the prompt used (collapsed)
   - Hover: download button overlay
   - Click: lightbox with full-size view
   - Per-card "Regenerate" button (re-runs just that style with same or tweaked prompt)

7. **Actions Bar** (after generation):
   - "Download All" — zips all logos (or downloads individually)
   - "Start Over" — clears form and results

**States to handle:**
- Empty / initial form
- Generating prompts (Ollama spinner)
- Prompts ready, generating images (per-style progress)
- All complete
- Partial failure (some styles failed, others succeeded)
- SD not running (connection error with setup instructions)
- Ollama not running (connection error)

### File Structure
```
app/
  tools/
    logo-generator/
      page.tsx          # Full client component
  api/
    generate-logo/
      route.ts          # SSE endpoint (Ollama → SD pipeline)
data/
  tools.ts              # Add logo-generator entry
components/
  SearchModal.tsx        # Add logo-generator to static results
```

### Registration

**data/tools.ts** — add entry:
```ts
{
  href: "/tools/logo-generator",
  title: "AI Logo Generator",
  description: "Describe your brand and get professional logo concepts — powered by local AI.",
  icon: "✏️",
}
```

**components/SearchModal.tsx** — add static result:
```ts
{ title: "AI Logo Generator", description: "Generate logo concepts from brand descriptions", href: "/tools/logo-generator", type: "tool" },
```

**lib/guardrails.ts** — add system prompt entry for logo-generator (the Ollama system prompt above)

### Technical Notes

- **Ollama + SD chaining**: The SSE endpoint first calls Ollama (non-streaming, need full JSON response), then streams SD results. Two-phase approach.
- **JSON parsing from LLM**: Ollama may return markdown-wrapped JSON. Strip ```json fences, try JSON.parse, fallback to regex `\[[\s\S]*\]` extraction.
- **No model switching**: Unlike image-generator, logo-generator uses whatever SD model is loaded. Model switching adds too much latency for this use case.
- **Timeout strategy**: 30s for Ollama prompt generation, 3 min per SD image, 15 min total.
- **AbortController**: Single controller for the whole pipeline. Cancel kills both Ollama and SD in-flight requests.
- **Reuse patterns from image-generator**: SSE parsing, gallery UI, lightbox, download functionality, connection error handling. Import shared components where possible.
- **Color injection**: Convert user's hex colors to descriptive color names for the SD prompt (e.g., #6366f1 → "indigo purple", #10b981 → "emerald green"). Use a simple hex-to-name lookup.

### Environment Variables
- `OLLAMA_URL` — defaults to `http://localhost:11434`
- `OLLAMA_MODEL` — defaults to `gemma3:4b`
- `SD_URL` — defaults to `http://127.0.0.1:7860`

### Edge Cases
- If Ollama returns invalid JSON, show error with raw response and let user retry
- If SD is not running, show clear message: "Stable Diffusion is not running. Start it with webui-user.bat"
- If a single style fails, show error on that card but keep others
- If user has no SD models loaded, the SD API will return an error — handle gracefully
- Color picker: default to monochrome if user skips color selection
