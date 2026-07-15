/**
 * vocab.ts — the single source of truth for the project's controlled vocabulary.
 *
 * WHY THIS FILE EXISTS:
 * Every enum-like value (seasons, categories, difficulty, etc.) is declared ONCE here
 * as a readonly tuple. The content schema (src/content.config.ts) turns these into Zod
 * enums, the UI filters import them for chips, and the AI agent imports them to know
 * which values are legal. Add a value here and it propagates everywhere — that is the
 * point. Never hard-code these strings elsewhere.
 *
 * AI AGENTS: When you want to introduce a new category/tag/season, add it HERE first,
 * then update src/data/tags.ts (label + icon) and, if it should be a filter, src/lib/filters.ts.
 */

export const SEASONS = ["spring", "summer", "autumn", "winter"] as const;
export type Season = (typeof SEASONS)[number];

/** Japan-centric month → season mapping. Index 0 unused so months are 1-based. */
export const SEASON_BY_MONTH: Record<number, Season> = {
  1: "winter",
  2: "winter",
  3: "spring",
  4: "spring",
  5: "spring",
  6: "summer",
  7: "summer",
  8: "summer",
  9: "autumn",
  10: "autumn",
  11: "autumn",
  12: "winter",
};

export const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export type Month = (typeof MONTHS)[number];

/**
 * Primary category — the single best "what kind of thing is this" bucket.
 * Kept intentionally short; finer distinctions live in TAGS.
 */
export const CATEGORIES = [
  "nature",
  "scenic",
  "food",
  "museum",
  "roadside",
  "religious",
  "art",
  "history",
  "oddity",
  "abandoned",
  "viewpoint",
  "shop",
  "experience",
  "animal",
  "festival",
] as const;
export type Category = (typeof CATEGORIES)[number];

/** Physical effort to experience the place. */
export const DIFFICULTIES = ["easy", "moderate", "challenging"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

/** Rough visit duration — drives the One Hour / Half Day / Full Day filters. */
export const TIME_REQUIRED = ["one-hour", "half-day", "full-day", "multi-day"] as const;
export type TimeRequired = (typeof TIME_REQUIRED)[number];

/** How the cost works. priceJpy/costNote add detail. */
export const COST_TYPES = ["free", "paid", "donation", "varies"] as const;
export type CostType = (typeof COST_TYPES)[number];

/** Tri-state-ish answers used across access/parking fields. */
export const YES_NO_LIMITED = ["yes", "no", "limited", "nearby", "unknown"] as const;
export type YesNoLimited = (typeof YES_NO_LIMITED)[number];

export const WHEELCHAIR = ["yes", "partial", "no", "unknown"] as const;
export type Wheelchair = (typeof WHEELCHAIR)[number];

/** Operational status of the place itself. */
export const STATUS = [
  "open",
  "seasonal",
  "temporarily-closed",
  "permanently-closed",
  "unknown",
] as const;
export type Status = (typeof STATUS)[number];

/**
 * Moderation / publication state. ONLY `published` entries are rendered on the public
 * site (see src/lib/content.ts → getPublishedAttractions). Everything else sits in the
 * review queue. This is the human-moderation gate.
 */
export const APPROVAL = ["published", "pending", "rejected", "draft"] as const;
export type Approval = (typeof APPROVAL)[number];

/** Where an entry came from — provenance matters for an AI-curated project. */
export const SOURCE = ["editorial", "community", "ai-agent", "imported"] as const;
export type Source = (typeof SOURCE)[number];

/** Event cadence. */
export const RECURRENCE = ["annual", "one-time", "irregular"] as const;
export type Recurrence = (typeof RECURRENCE)[number];

/** Helper: derive the season for a given month (1-12). */
export function seasonForMonth(month: number): Season {
  return SEASON_BY_MONTH[((month - 1 + 12) % 12) + 1] ?? "spring";
}

/** Human label for a season. */
export const SEASON_LABEL: Record<Season, string> = {
  spring: "Spring",
  summer: "Summer",
  autumn: "Autumn",
  winter: "Winter",
};

export const MONTH_LABEL: Record<number, string> = {
  1: "January",
  2: "February",
  3: "March",
  4: "April",
  5: "May",
  6: "June",
  7: "July",
  8: "August",
  9: "September",
  10: "October",
  11: "November",
  12: "December",
};

/**
 * Countries covered by the atlas. Cinnamon Land is one site, many countries — but the UI
 * is built for browsing ONE country at a time (country tabs, per-country map zoom).
 * Add a country here first, then give it metadata in src/data/countries.ts and regions/
 * provinces in src/data/prefectures.ts.
 */
export const COUNTRIES = ["japan", "thailand"] as const;
export type Country = (typeof COUNTRIES)[number];
