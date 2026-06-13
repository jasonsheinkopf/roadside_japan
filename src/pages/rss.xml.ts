import type { APIRoute } from "astro";
import { getNewest } from "../lib/content";

const esc = (s: string) =>
  s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);

export const GET: APIRoute = async ({ site }) => {
  const base = site ?? new URL("https://example.com");
  const items = await getNewest(30);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Roadside Japan — Newest discoveries</title>
    <link>${base.href}</link>
    <description>The newest hidden gems, weird attractions, and seasonal events added to Roadside Japan.</description>
    <language>en</language>
    ${items
      .map((r) => {
        const link = new URL(r.url, base).href;
        return `<item>
      <title>${esc(r.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${new Date(r.createdAt).toUTCString()}</pubDate>
      <description>${esc(r.summary)}</description>
    </item>`;
      })
      .join("\n    ")}
  </channel>
</rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
