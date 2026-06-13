/** GET /api/tags.json — list tags with usage counts (documented read endpoint). */
import type { APIRoute } from "astro";
import { getIndexRecords } from "../../lib/content";
import { tagMeta } from "../../data/tags";

export const GET: APIRoute = async () => {
  const records = await getIndexRecords();
  const counts = new Map<string, number>();
  for (const r of records) for (const t of r.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  const tags = [...counts.entries()]
    .map(([slug, count]) => {
      const m = tagMeta(slug);
      return { slug, label: m.label, icon: m.icon, group: m.group, count };
    })
    .sort((a, b) => b.count - a.count);
  return new Response(JSON.stringify({ tags }), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
