/** GET /api/seasons.json — seasons with counts (documented read endpoint). */
import type { APIRoute } from "astro";
import { getIndexRecords } from "../../lib/content";
import { SEASONS, SEASON_LABEL, seasonForMonth } from "../../data/vocab";

export const GET: APIRoute = async () => {
  const records = await getIndexRecords();
  const seasons = SEASONS.map((slug) => ({
    slug,
    label: SEASON_LABEL[slug],
    count: records.filter(
      (r) => r.seasons.includes(slug) || r.months.some((m) => seasonForMonth(m) === slug),
    ).length,
  }));
  return new Response(JSON.stringify({ seasons }), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
