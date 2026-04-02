export interface Tool {
  href: string;
  title: string;
  description: string;
  icon: string;
}

export const tools: Tool[] = [
  {
    href: "/tools/prompt-library",
    title: "Prompt Library",
    description: "Browse and copy ready-made vibecoding prompts organized by task. From landing pages to APIs.",
    icon: "\u{1F4CB}",
  },
  {
    href: "/tools/vibe-checker",
    title: "Vibe Checker",
    description: "Paste AI-generated code and get an instant review for bugs, security issues, and improvements.",
    icon: "\u{1F50D}",
  },
  {
    href: "/tools/project-starter",
    title: "Project Starter",
    description: "Describe your project idea and get a recommended tech stack, file structure, and starter prompts.",
    icon: "\u{1F680}",
  },
  {
    href: "/tools/code-explainer",
    title: "Code Explainer",
    description: "Paste any code snippet and get a plain-English explanation. Perfect for learning from AI-generated code.",
    icon: "\u{1F4A1}",
  },
  {
    href: "/tools/regex-generator",
    title: "Regex Generator",
    description: "Describe what you want to match in plain English and get the regex pattern with examples and usage.",
    icon: "\u{1F524}",
  },
  {
    href: "/tools/color-palette",
    title: "Color Palette",
    description: "Describe a mood or brand and get a 5-color palette with CSS variables and Tailwind config.",
    icon: "\u{1F3A8}",
  },
  {
    href: "/tools/chat",
    title: "AI Chat",
    description: "Chat with an AI assistant about vibecoding, prompts, tools, debugging, and project planning.",
    icon: "\u{1F4AC}",
  },
  {
    href: "/tools/code-converter",
    title: "Code Converter",
    description: "Translate code between 12 languages \u2014 JavaScript, Python, Go, Rust, and more. Side-by-side view.",
    icon: "\u{1F504}",
  },
  {
    href: "/tools/readme-generator",
    title: "README Generator",
    description: "Describe your project or paste a file tree and get a professional README.md ready for GitHub.",
    icon: "\u{1F4C4}",
  },
  {
    href: "/tools/api-endpoint",
    title: "API Endpoint Generator",
    description: "Describe your API and get production-ready route handlers with validation for Next.js, Express, or FastAPI.",
    icon: "\u{1F50C}",
  },
  {
    href: "/tools/bug-fixer",
    title: "Bug Fixer",
    description: "Paste broken code and the error message \u2014 get an instant fix with a clear explanation of what went wrong.",
    icon: "\u{1F41B}",
  },
  {
    href: "/tools/sql-generator",
    title: "SQL Generator",
    description: "Describe what data you need in plain English and get SQL queries with schema suggestions.",
    icon: "\u{1F5C4}\uFE0F",
  },
  {
    href: "/tools/component-generator",
    title: "Component Generator",
    description: "Describe a UI component and get clean React + Tailwind code \u2014 responsive and accessible by default.",
    icon: "\u{1F9E9}",
  },
  {
    href: "/tools/git-helper",
    title: "Git Command Helper",
    description: "Describe what you want to do in plain English and get the exact Git commands with safety warnings.",
    icon: "\u{1F4E6}",
  },
  {
    href: "/tools/cron-builder",
    title: "Cron Expression Builder",
    description: "Describe a schedule in plain English and get the cron expression with usage examples for Node.js, Linux, and GitHub Actions.",
    icon: "\u23F0",
  },
  {
    href: "/tools/env-generator",
    title: "Env Variable Generator",
    description: "Describe your tech stack and get a comprehensive .env.example file with setup instructions.",
    icon: "\u2699\uFE0F",
  },
  {
    href: "/tools/commit-writer",
    title: "Commit Message Writer",
    description: "Describe your changes or paste a diff and get a proper conventional commit message.",
    icon: "\u270D\uFE0F",
  },
  {
    href: "/tools/stack-recommender",
    title: "Tech Stack Recommender",
    description: "Describe your project idea and get detailed tech stack comparisons with pros, cons, and complexity ratings.",
    icon: "\u{1F4CA}",
  },
  {
    href: "/tools/accessibility-checker",
    title: "Accessibility Checker",
    description: "Paste HTML or JSX and get a WCAG 2.1 AA accessibility audit with specific fixes and a compliance checklist.",
    icon: "\u267F",
  },
  {
    href: "/tools/typescript-generator",
    title: "TypeScript Type Generator",
    description: "Describe a data shape in plain English and get TypeScript interfaces, types, and Zod schemas.",
    icon: "\u{1F9D1}\u200D\u{1F4BB}",
  },
  {
    href: "/tools/docker-compose",
    title: "Docker Compose Generator",
    description: "Describe your stack and get a production-ready docker-compose.yml with networking and volumes.",
    icon: "\u{1F433}",
  },
  {
    href: "/tools/test-generator",
    title: "Test Generator",
    description: "Paste any function or component and get unit tests with Jest, Vitest, or pytest.",
    icon: "\u{1F9EA}",
  },
  {
    href: "/tools/css-to-tailwind",
    title: "CSS to Tailwind Converter",
    description: "Paste vanilla CSS and get the equivalent Tailwind CSS classes with responsive variants.",
    icon: "\u{1F3AF}",
  },
  {
    href: "/tools/schema-validator",
    title: "Schema Validator",
    description: "Paste JSON data and describe validation rules \u2014 get a JSON Schema with error messages and examples.",
    icon: "\u2705",
  },
  {
    href: "/tools/image-generator",
    title: "AI Image Generator",
    description: "Generate images with local Stable Diffusion \u2014 select up to 4 models for side-by-side comparisons.",
    icon: "\uD83D\uDDBC\uFE0F",
  },
  {
    href: "/tools/logo-generator",
    title: "AI Logo Generator",
    description: "Describe your brand and get professional logo concepts \u2014 powered by local AI.",
    icon: "\u270F\uFE0F",
  },
  {
    href: "/tools/image-studio",
    title: "AI Image Studio",
    description: "Upscale, restyle, inpaint, and caption images with local Stable Diffusion \u2014 no cloud needed.",
    icon: "\u2728",
  },
];
