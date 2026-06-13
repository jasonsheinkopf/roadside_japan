import type { APIRoute } from "astro";
import { getIndexRecords } from "../lib/content";
import { PREFECTURES } from "../data/prefectures";
import { SEASONS } from "../data/vocab";
import { withBase } from "../lib/url";

export const GET: APIRoute = async ({ site }) => {
  const base = site ?? new URL("https://example.com");
  const records = await getIndexRecords();

  const tags = new Set<string>();
  for (const r of records) for (const t of r.tags) tags.add(t);

  const paths = [
    withBase("/"),
    withBase("/explore"),
    withBase("/map"),
    withBase("/events"),
    withBase("/prefectures"),
    withBase("/seasons"),
    withBase("/submit"),
    withBase("/about"),
    ...records.map((r) => r.url),
    ...PREFECTURES.map((p) => withBase(`/prefectures/${p.slug}`)),
    ...SEASONS.map((s) => withBase(`/seasons/${s}`)),
    ...[...tags].map((t) => withBase(`/tags/${t}`)),
  ];

  const urls = [...new Set(paths)].map((p) => `  <url><loc>${new URL(p, base).href}</loc></url>`).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
