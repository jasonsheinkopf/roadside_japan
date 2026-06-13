/** GET /api/prefectures.json — prefectures with counts (documented read endpoint). */
import type { APIRoute } from "astro";
import { getIndexRecords } from "../../lib/content";
import { PREFECTURES } from "../../data/prefectures";

export const GET: APIRoute = async () => {
  const records = await getIndexRecords();
  const counts = new Map<string, number>();
  for (const r of records) counts.set(r.prefecture, (counts.get(r.prefecture) ?? 0) + 1);
  const prefectures = PREFECTURES.map((p) => ({
    slug: p.slug,
    name: p.name,
    nameJa: p.nameJa,
    region: p.region,
    lat: p.lat,
    lng: p.lng,
    count: counts.get(p.slug) ?? 0,
  }));
  return new Response(JSON.stringify({ prefectures }), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
