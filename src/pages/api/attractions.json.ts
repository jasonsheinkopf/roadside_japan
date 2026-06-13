/**
 * GET /api/attractions.json — the public READ feed for the whole atlas.
 *
 * This is the single source the browser uses for client-side search, the map, filtering,
 * and the random button. It's also the documented read endpoint of the internal API
 * (see docs/API.md). Statically generated at build time; only `published` entries appear.
 */
import type { APIRoute } from "astro";
import { getIndexRecords } from "../../lib/content";

export const GET: APIRoute = async () => {
  const records = await getIndexRecords();
  return new Response(JSON.stringify(records), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
