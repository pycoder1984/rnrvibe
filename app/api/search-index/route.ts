import { NextRequest, NextResponse } from "next/server";
import { getPostsByType } from "@/lib/mdx";
import { tools } from "@/data/tools";
import { projects } from "@/data/projects";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const { limited } = checkRateLimit("search", ip, 30, 60_000);
  if (limited) {
    return NextResponse.json([], { status: 429 });
  }
  const blogs = getPostsByType("blog").map((p) => ({
    title: p.title,
    description: p.description,
    href: `/blog/${p.slug}`,
    type: "blog" as const,
  }));

  const guides = getPostsByType("guides").map((p) => ({
    title: p.title,
    description: p.description,
    href: `/guides/${p.slug}`,
    type: "guide" as const,
  }));

  const toolItems = tools.map((t) => ({
    title: t.title,
    description: t.description,
    href: t.href,
    type: "tool" as const,
  }));

  const projectItems = projects.map((p) => ({
    title: p.title,
    description: p.description,
    href: p.href,
    type: "project" as const,
  }));

  return NextResponse.json([...toolItems, ...projectItems, ...blogs, ...guides]);
}
