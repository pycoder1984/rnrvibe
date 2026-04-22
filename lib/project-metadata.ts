import type { Metadata } from "next";
import { projects, type Project } from "@/data/projects";

const BASE_URL = "https://www.rnrvibe.com";

function findProject(slug: string): Project {
  const href = `/projects/${slug}`;
  const project = projects.find((p) => p.href === href);
  if (!project) {
    throw new Error(`Project not found in data/projects.ts: ${slug}`);
  }
  return project;
}

export function buildProjectMetadata(slug: string): Metadata {
  const project = findProject(slug);
  const url = `${BASE_URL}${project.href}`;
  const ogImage = `/api/og?title=${encodeURIComponent(project.title)}&type=article`;
  const title = `${project.title} — Vibecoded Demo | RnR Vibe`;
  const ogTitle = `${project.title} — Vibecoded Demo`;

  return {
    title,
    description: project.description,
    keywords: [
      project.title,
      `${project.title.toLowerCase()} demo`,
      `${project.title.toLowerCase()} source code`,
      ...project.tags,
      "vibecoded project",
      "AI built project",
      "free demo",
      "interactive demo",
      "vibecoding",
    ],
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: ogTitle,
      description: project.description,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: project.description,
      images: [ogImage],
    },
  };
}

export function buildProjectJsonLd(slug: string) {
  const project = findProject(slug);
  const url = `${BASE_URL}${project.href}`;

  const appSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: project.title,
    description: project.description,
    url,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any (browser)",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    keywords: project.tags.join(", "),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Projects", item: `${BASE_URL}/projects` },
      { "@type": "ListItem", position: 3, name: project.title, item: url },
    ],
  };

  return { appSchema, breadcrumb };
}
