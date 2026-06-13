/**
 * data.ts — client-side loader for the atlas records.
 *
 * Prefers an embedded <script id="rj-data"> JSON blob (rendered into the page for instant,
 * offline-ready filtering with no round-trip); falls back to fetching /api/attractions.json.
 * Results are memoized for the page lifetime.
 */
import type { IndexRecord } from "../lib/types";

let cache: IndexRecord[] | null = null;

export async function loadRecords(): Promise<IndexRecord[]> {
  if (cache) return cache;

  const embedded = document.getElementById("rj-data");
  if (embedded?.textContent) {
    cache = JSON.parse(embedded.textContent) as IndexRecord[];
    return cache;
  }

  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  const res = await fetch(`${base}/api/attractions.json`);
  cache = (await res.json()) as IndexRecord[];
  return cache;
}
