/**
 * types.ts — shared TypeScript types.
 *
 * IndexRecord is the FLATTENED, client-facing shape of an attraction/event. It is what
 * the search index (/search-index.json) and the map feed (/api/attractions.json) emit,
 * and what the client-side filter predicates (src/lib/filters.ts) operate on. Keep it
 * lean — every field here ships to the browser for every record.
 */
import type {
  Category,
  CostType,
  Country,
  Difficulty,
  Recurrence,
  Season,
  Status,
  TimeRequired,
  Wheelchair,
  YesNoLimited,
} from "../data/vocab";
import type { Region } from "../data/prefectures";

export type Collection = "attractions" | "events";

export interface IndexRecord {
  id: string; // slug
  collection: Collection;
  title: string;
  summary: string;
  url: string; // already base-prefixed, ready for href

  // location
  country: Country;
  countryName: string;
  prefecture: string; // slug
  prefectureName: string;
  region: Region;
  city?: string;
  lat: number;
  lng: number;

  // classification
  category: Category;
  tags: string[];

  // seasonality
  seasons: Season[];
  months: number[];

  // practical (the bits filters need)
  difficulty: Difficulty;
  timeRequired: TimeRequired;
  costType: CostType;
  wheelchair: Wheelchair;
  dogFriendly: YesNoLimited;
  parkingAvailable: YesNoLimited;
  transitAccessible: boolean;
  status: Status;

  // presentation
  hero?: string; // resolved image URL, if any
  featured: boolean;

  // search aids
  keywords: string[]; // aiKeywords + tags, for fuzzy search weighting

  // sorting
  createdAt: string; // ISO
  updatedAt: string; // ISO

  // events only
  startDate?: string; // ISO
  endDate?: string; // ISO
  recurrence?: Recurrence; // how the event repeats (drives date-range matching)
}

export interface NearbyResult {
  record: IndexRecord;
  distanceKm: number;
}
