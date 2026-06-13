/**
 * filters.ts — the filter ENGINE.
 *
 * The brief asks for an excellent, combinable filtering experience over a heterogeneous
 * set of conditions (seasons, themes, cost, difficulty, duration, accessibility, vibe…).
 * Rather than scatter that logic, every filter is one declarative entry with a predicate
 * over an IndexRecord. The UI renders chips from FILTER_GROUPS; applying filters just runs
 * the selected predicates. Add a filter = add one object. No UI or query code to touch.
 *
 * This module is ISOMORPHIC: it imports only types + vocab, so it runs identically on the
 * server (Astro pages) and in the browser (the Explore/Map islands).
 *
 * Combination semantics (matches user intuition):
 *   - Within a group → OR  (e.g. Spring OR Summer)
 *   - Across groups  → AND (e.g. (Spring OR Summer) AND Free AND Kids)
 */
import type { IndexRecord } from "./types";
import { MONTHS, seasonForMonth, type Season } from "../data/vocab";

export interface FilterOption {
  id: string; // unique across ALL groups; used in URL query (?f=spring,free)
  label: string;
  icon: string;
  groupId: string;
  predicate: (r: IndexRecord) => boolean;
}

export interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
}

/** A record is "in season" for S if it's year-round, or explicitly tagged for S. */
export function matchesSeason(r: IndexRecord, s: Season): boolean {
  const yearRound = r.seasons.length === 0 && r.months.length === 0;
  if (yearRound) return true;
  if (r.seasons.includes(s)) return true;
  return r.months.some((m) => seasonForMonth(m) === s);
}

/** Does this record's active window include the given month (1-12)? */
export function matchesMonth(r: IndexRecord, month: number): boolean {
  const yearRound = r.seasons.length === 0 && r.months.length === 0;
  if (yearRound) return true;
  if (r.months.includes(month)) return true;
  // If only seasons are specified, treat all months of those seasons as active.
  if (r.months.length === 0 && r.seasons.length > 0) {
    return r.seasons.includes(seasonForMonth(month));
  }
  return false;
}

/**
 * Does this record have a real time window at all? Events are inherently time-bound;
 * attractions are seasonal only if they declare months or seasons. Everything else is
 * "year-round" (always worth a visit). Drives the Availability filter and the timeline.
 */
export function isSeasonal(r: IndexRecord): boolean {
  return r.collection === "events" || r.months.length > 0 || r.seasons.length > 0;
}

/**
 * The set of months (1-12) a record is active, used by the timeline planner.
 *   - explicit `months` win,
 *   - else an event's start/end window is expanded to the months it spans,
 *   - else `seasons` expand to their months,
 *   - else [] meaning year-round (active every month).
 * Returns sorted, de-duplicated month numbers.
 */
export function activeMonths(r: IndexRecord): number[] {
  if (r.months.length) return [...new Set(r.months)].sort((a, b) => a - b);

  if (r.collection === "events" && r.startDate && r.endDate) {
    const start = new Date(r.startDate);
    const end = new Date(r.endDate);
    const out = new Set<number>();
    let y = start.getUTCFullYear();
    let m = start.getUTCMonth();
    // Walk month-by-month from start to end (cap at 13 to stay safe on bad data).
    for (let i = 0; i < 13; i++) {
      out.add(m + 1);
      if (y === end.getUTCFullYear() && m === end.getUTCMonth()) break;
      m++;
      if (m > 11) {
        m = 0;
        y++;
      }
    }
    return [...out].sort((a, b) => a - b);
  }

  if (r.seasons.length) {
    return MONTHS.filter((m) => r.seasons.includes(seasonForMonth(m)));
  }

  return [];
}

const hasTag = (r: IndexRecord, t: string) => r.tags.includes(t);
const isCategory = (r: IndexRecord, c: string) => r.category === c;

export const FILTER_GROUPS: FilterGroup[] = [
  {
    id: "season",
    label: "Season",
    options: [
      { id: "spring", label: "Spring", icon: "🌸", groupId: "season", predicate: (r) => matchesSeason(r, "spring") },
      { id: "summer", label: "Summer", icon: "🌻", groupId: "season", predicate: (r) => matchesSeason(r, "summer") },
      { id: "autumn", label: "Autumn", icon: "🍁", groupId: "season", predicate: (r) => matchesSeason(r, "autumn") },
      { id: "winter", label: "Winter", icon: "❄️", groupId: "season", predicate: (r) => matchesSeason(r, "winter") },
      {
        id: "in-season-now",
        label: "In season now",
        icon: "📅",
        groupId: "season",
        predicate: (r) => matchesMonth(r, new Date().getMonth() + 1),
      },
    ],
  },
  {
    id: "availability",
    label: "Availability",
    options: [
      { id: "seasonal", label: "Seasonal", icon: "🗓️", groupId: "availability", predicate: (r) => isSeasonal(r) },
      { id: "year-round", label: "Year-round", icon: "♾️", groupId: "availability", predicate: (r) => !isSeasonal(r) },
    ],
  },
  {
    id: "theme",
    label: "Theme",
    options: [
      { id: "nature", label: "Nature", icon: "🌲", groupId: "theme", predicate: (r) => isCategory(r, "nature") || hasTag(r, "nature") },
      { id: "scenic", label: "Scenic", icon: "🏞️", groupId: "theme", predicate: (r) => isCategory(r, "scenic") || isCategory(r, "viewpoint") || hasTag(r, "scenic") },
      { id: "food", label: "Food", icon: "🍜", groupId: "theme", predicate: (r) => isCategory(r, "food") || hasTag(r, "food") },
      { id: "museum", label: "Museum", icon: "🏛️", groupId: "theme", predicate: (r) => isCategory(r, "museum") || hasTag(r, "museum") },
      { id: "roadside", label: "Roadside", icon: "🛣️", groupId: "theme", predicate: (r) => isCategory(r, "roadside") || hasTag(r, "roadside") },
      { id: "festival", label: "Festival", icon: "🎏", groupId: "theme", predicate: (r) => isCategory(r, "festival") || r.collection === "events" || hasTag(r, "festival") },
      { id: "religious", label: "Shrine & Temple", icon: "⛩️", groupId: "theme", predicate: (r) => isCategory(r, "religious") },
      { id: "art", label: "Art", icon: "🎨", groupId: "theme", predicate: (r) => isCategory(r, "art") || hasTag(r, "art") },
      { id: "oddity", label: "Oddity", icon: "🛸", groupId: "theme", predicate: (r) => isCategory(r, "oddity") || hasTag(r, "weird") },
      { id: "abandoned", label: "Abandoned", icon: "🏚️", groupId: "theme", predicate: (r) => isCategory(r, "abandoned") },
      { id: "animal", label: "Animals", icon: "🦊", groupId: "theme", predicate: (r) => isCategory(r, "animal") || hasTag(r, "animal") },
    ],
  },
  {
    id: "cost",
    label: "Cost",
    options: [
      { id: "free", label: "Free", icon: "🆓", groupId: "cost", predicate: (r) => r.costType === "free" || r.costType === "donation" },
      { id: "paid", label: "Paid", icon: "💴", groupId: "cost", predicate: (r) => r.costType === "paid" },
    ],
  },
  {
    id: "duration",
    label: "Time needed",
    options: [
      { id: "one-hour", label: "One Hour", icon: "⏱️", groupId: "duration", predicate: (r) => r.timeRequired === "one-hour" },
      { id: "half-day", label: "Half Day", icon: "🌤️", groupId: "duration", predicate: (r) => r.timeRequired === "half-day" },
      { id: "full-day", label: "Full Day", icon: "📆", groupId: "duration", predicate: (r) => r.timeRequired === "full-day" || r.timeRequired === "multi-day" },
    ],
  },
  {
    id: "effort",
    label: "Effort",
    options: [
      { id: "easy", label: "Easy", icon: "🟢", groupId: "effort", predicate: (r) => r.difficulty === "easy" },
      { id: "moderate", label: "Moderate", icon: "🟡", groupId: "effort", predicate: (r) => r.difficulty === "moderate" },
      { id: "challenging", label: "Challenging", icon: "🔴", groupId: "effort", predicate: (r) => r.difficulty === "challenging" },
    ],
  },
  {
    id: "good-for",
    label: "Good for",
    options: [
      { id: "kids", label: "Kids", icon: "🧒", groupId: "good-for", predicate: (r) => hasTag(r, "kids") },
      { id: "dog-friendly", label: "Dog Friendly", icon: "🐕", groupId: "good-for", predicate: (r) => r.dogFriendly === "yes" || r.dogFriendly === "limited" || hasTag(r, "dog-friendly") },
      { id: "photography", label: "Photography", icon: "📷", groupId: "good-for", predicate: (r) => hasTag(r, "photography") || hasTag(r, "instagrammable") },
      { id: "hidden-gem", label: "Hidden Gem", icon: "💎", groupId: "good-for", predicate: (r) => hasTag(r, "hidden-gem") },
    ],
  },
  {
    id: "conditions",
    label: "Conditions",
    options: [
      { id: "night", label: "Night", icon: "🌙", groupId: "conditions", predicate: (r) => hasTag(r, "night") || hasTag(r, "illumination") },
      { id: "rainy-day", label: "Rainy Day", icon: "🌧️", groupId: "conditions", predicate: (r) => hasTag(r, "rainy-day") || hasTag(r, "indoor") || isCategory(r, "museum") },
      { id: "indoor", label: "Indoor", icon: "🏠", groupId: "conditions", predicate: (r) => hasTag(r, "indoor") },
    ],
  },
  {
    id: "access",
    label: "Access",
    options: [
      { id: "wheelchair", label: "Wheelchair", icon: "♿", groupId: "access", predicate: (r) => r.wheelchair === "yes" || r.wheelchair === "partial" },
      { id: "free-parking", label: "Free Parking", icon: "🅿️", groupId: "access", predicate: (r) => r.parkingAvailable === "yes" || hasTag(r, "free-parking") },
      { id: "transit", label: "Transit OK", icon: "🚆", groupId: "access", predicate: (r) => r.transitAccessible },
    ],
  },
];

/** Flat lookup of every option by id. */
export const FILTER_OPTIONS: Map<string, FilterOption> = new Map(
  FILTER_GROUPS.flatMap((g) => g.options).map((o) => [o.id, o]),
);

/**
 * Apply a set of selected filter ids to records.
 * Within a group the options OR together; across groups they AND.
 */
export function applyFilters(records: IndexRecord[], selectedIds: Iterable<string>): IndexRecord[] {
  const selected = [...selectedIds].map((id) => FILTER_OPTIONS.get(id)).filter(Boolean) as FilterOption[];
  if (selected.length === 0) return records;

  // group selected predicates by their group
  const byGroup = new Map<string, FilterOption[]>();
  for (const opt of selected) {
    const arr = byGroup.get(opt.groupId) ?? [];
    arr.push(opt);
    byGroup.set(opt.groupId, arr);
  }

  return records.filter((r) =>
    [...byGroup.values()].every((opts) => opts.some((o) => o.predicate(r))),
  );
}
