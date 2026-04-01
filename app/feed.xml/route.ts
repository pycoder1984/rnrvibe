import { getPostsByType } from "@/lib/mdx";

export async function GET() {
  const baseUrl = "https://www.rnrvibe.com";
  const blogs = getPostsByType("blog");
  const guides = getPostsByType("guides");
  const allPosts = [
    ...blogs.map((p) => ({ ...p, type: "blog" })),
    ...guides.map((p) => ({ ...p, type: "guides" })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const items = allPosts
    .map(
      (post) => `    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${baseUrl}/${post.type}/${post.slug}</link>
      <guid isPermaLink="true">${baseUrl}/${post.type}/${post.slug}</guid>
      <description><![CDATA[${post.description}]]></description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
    </item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>RnR Vibe</title>
    <link>${baseUrl}</link>
    <description>Vibecoding tips, AI tools, and guides for modern developers.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
