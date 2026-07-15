/**
 * content.ts — server-side helpers for reading the atlas (Astro pages only).
 *
 * This is the ONE place that talks to astro:content. It enforces the publication gate
 * (only `approval: published` is public), flattens entries into IndexRecord for the UI
 * and search/map feeds, and provides nearby/related/featured helpers.
 */
import { getCollection, type CollectionEntry } from "astro:content";
import { getPrefecture } from "../data/prefectures";
import { COUNTRY_META } from "../data/countries";
import { haversineKm } from "./format";
import { recordUrl, withBase } from "./url";
import type { Collection, IndexRecord, NearbyResult } from "./types";

export type AttractionEntry = CollectionEntry<"attractions">;
export type EventEntry = CollectionEntry<"events">;
export type AnyEntry = AttractionEntry | EventEntry;
export type CommentEntry = CollectionEntry<"comments">;

/** Approved comments for a given target slug, oldest first. */
export async function getApprovedComments(
  target: string,
  targetType: "attraction" | "event" = "attraction",
): Promise<CommentEntry[]> {
  const all = await getCollection(
    "comments",
    (c) => c.data.approved && c.data.target === target && c.data.targetType === targetType,
  );
  return all.sort((a, b) => +a.data.createdAt - +b.data.createdAt);
}

const isPublished = (e: AnyEntry) => e.data.approval === "published";

/** Published attractions, newest-updated first. */
export async function getPublishedAttractions(): Promise<AttractionEntry[]> {
  const all = await getCollection("attractions", isPublished);
  return all.sort((a, b) => +b.data.updatedAt - +a.data.updatedAt);
}

/** Published events. */
export async function getPublishedEvents(): Promise<EventEntry[]> {
  const all = await getCollection("events", isPublished);
  return all.sort((a, b) => +a.data.startDate - +b.data.startDate);
}

/** Everything awaiting moderation — feeds the /admin review queue. */
export async function getPendingEntries(): Promise<{ attractions: AttractionEntry[]; events: EventEntry[] }> {
  const [a, e] = await Promise.all([
    getCollection("attractions", (x) => x.data.approval === "pending"),
    getCollection("events", (x) => x.data.approval === "pending"),
  ]);
  return { attractions: a, events: e };
}

/** Flatten an entry into the lean client-facing IndexRecord. */
export function toIndexRecord(entry: AnyEntry, collection: Collection): IndexRecord {
  const d = entry.data;
  const pref = getPrefecture(d.prefecture);
  const heroRaw = d.heroImage ?? d.photos[0]?.src;
  const record: IndexRecord = {
    id: entry.id,
    collection,
    title: d.title,
    summary: d.summary,
    url: recordUrl(collection, entry.id),
    country: d.country,
    countryName: COUNTRY_META[d.country]?.name ?? d.country,
    prefecture: d.prefecture,
    prefectureName: pref?.name ?? d.prefecture,
    region: pref?.region ?? "Kanto",
    city: d.city,
    lat: d.lat,
    lng: d.lng,
    category: d.category,
    tags: d.tags,
    seasons: d.seasons,
    months: d.months,
    difficulty: d.difficulty,
    timeRequired: d.timeRequired,
    costType: d.cost.type,
    wheelchair: d.accessibility.wheelchair,
    dogFriendly: d.dogFriendly,
    parkingAvailable: d.parking.available,
    transitAccessible: Boolean(d.transit?.nearestStation) || d.tags.includes("transit-accessible"),
    status: d.status,
    hero: heroRaw ? withBase(heroRaw) : undefined,
    featured: d.featured,
    keywords: Array.from(new Set([...d.tags, ...d.aiKeywords])),
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  };
  if (collection === "events") {
    const ed = (entry as EventEntry).data;
    record.startDate = ed.startDate.toISOString();
    record.endDate = ed.endDate.toISOString();
    record.recurrence = ed.recurrence;
  }
  return record;
}

/** All published records (attractions + events) as IndexRecords. */
export async function getIndexRecords(): Promise<IndexRecord[]> {
  const [attractions, events] = await Promise.all([
    getPublishedAttractions(),
    getPublishedEvents(),
  ]);
  return [
    ...attractions.map((e) => toIndexRecord(e, "attractions")),
    ...events.map((e) => toIndexRecord(e, "events")),
  ];
}

/** Featured attractions for the homepage. */
export async function getFeatured(limit = 6): Promise<AttractionEntry[]> {
  const all = await getPublishedAttractions();
  const featured = all.filter((e) => e.data.featured);
  return (featured.length ? featured : all).slice(0, limit);
}

/** Newest additions across the atlas. */
export async function getNewest(limit = 8): Promise<IndexRecord[]> {
  const records = await getIndexRecords();
  return records
    .slice()
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, limit);
}

/** N nearest published records to a point, excluding a given id. */
export function nearest(
  origin: { lat: number; lng: number },
  records: IndexRecord[],
  opts: { excludeId?: string; limit?: number } = {},
): NearbyResult[] {
  const { excludeId, limit = 6 } = opts;
  return records
    .filter((r) => r.id !== excludeId)
    .map((record) => ({ record, distanceKm: haversineKm(origin, record) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

/**
 * Related entries for an attraction: explicit `related` first, then nearest neighbors to
 * fill up to `limit`. References resolve to ids in Astro's content layer.
 */
export async function getRelated(entry: AttractionEntry, limit = 4): Promise<IndexRecord[]> {
  const records = await getIndexRecords();
  const byId = new Map(records.map((r) => [r.id, r]));
  const out: IndexRecord[] = [];
  for (const ref of entry.data.related) {
    const rec = byId.get(typeof ref === "string" ? ref : (ref as { id: string }).id);
    if (rec && rec.id !== entry.id) out.push(rec);
  }
  if (out.length < limit) {
    const have = new Set(out.map((r) => r.id));
    for (const n of nearest({ lat: entry.data.lat, lng: entry.data.lng }, records, {
      excludeId: entry.id,
      limit: limit + out.length,
    })) {
      if (out.length >= limit) break;
      if (!have.has(n.record.id)) out.push(n.record);
    }
  }
  return out.slice(0, limit);
}
