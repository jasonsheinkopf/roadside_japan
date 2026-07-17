/**
 * format.ts — pure, isomorphic display/formatting helpers (no Astro imports), safe to use
 * on the server and in the browser.
 */
import {
  MONTH_LABEL,
  SEASON_LABEL,
  type CostType,
  type Difficulty,
  type Season,
  type Status,
  type TimeRequired,
} from "../data/vocab";

export const COST_LABEL: Record<CostType, string> = {
  free: "Free",
  paid: "Paid",
  donation: "Donation",
  varies: "Varies",
};

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "Easy",
  moderate: "Moderate",
  challenging: "Challenging",
};

export const TIME_LABEL: Record<TimeRequired, string> = {
  "one-hour": "≈ 1 hour",
  "half-day": "Half day",
  "full-day": "Full day",
  "multi-day": "Multi-day",
};

export const SEASON_EMOJI: Record<Season, string> = {
  spring: "🌸",
  summer: "🌻",
  autumn: "🍁",
  winter: "❄️",
};

/**
 * Fixed seasonal hues for the timeline planner — sakura pink, summer teal, autumn amber,
 * winter blue. Hard-coded (not theme variables) so a bar always reads as its season and
 * the year chart shows a recognizable spring→winter gradient in both light and dark mode.
 */
export const SEASON_COLOR: Record<Season, string> = {
  spring: "#e98aa8",
  summer: "#3fa796",
  autumn: "#d9772f",
  winter: "#5b8fce",
};

export const STATUS_LABEL: Record<Status, string> = {
  open: "Open",
  seasonal: "Seasonal",
  "temporarily-closed": "Temporarily closed",
  "permanently-closed": "Permanently closed",
  unknown: "Status unknown",
};

/**
 * Build a Google Maps link. Priority:
 * 1. an explicit `googleMaps` URL from the entry's frontmatter (always wins);
 * 2. a NAME-based place search ("Randy's Donuts, Inglewood") — this lands on the actual
 *    Google Maps place listing (photos, hours, reviews) instead of a bare GPS pin that
 *    resolves to "nearby location". The coordinates ride along as a hint so same-named
 *    places elsewhere don't hijack the result;
 * 3. raw coordinates, only when no name is available.
 */
export function googleMapsLink(
  lat: number,
  lng: number,
  explicit?: string,
  name?: string,
  locality?: string,
): string {
  if (explicit) return explicit;
  if (name) {
    // "Name, City" — what a human would type; locality disambiguates same-named places.
    // Titles often carry an editorial subtitle ("Morinji Temple — Bunbuku Chagama") that
    // only hurts the search, so drop everything from the first em-dash; and skip the
    // locality when the name already contains it ("Randy's Donuts — Inglewood").
    const base = name.split("—")[0].trim();
    const q =
      locality && !base.toLowerCase().includes(locality.toLowerCase())
        ? `${base}, ${locality}`
        : base;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

/** Compact label for a list of seasons, e.g. ["spring","autumn"] → "Spring · Autumn". */
export function seasonsLabel(seasons: Season[]): string {
  if (!seasons.length) return "Year-round";
  return seasons.map((s) => SEASON_LABEL[s]).join(" · ");
}

export function monthsLabel(months: number[]): string {
  if (!months.length) return "";
  return months
    .slice()
    .sort((a, b) => a - b)
    .map((m) => MONTH_LABEL[m]?.slice(0, 3))
    .join(", ");
}

export function priceLabel(type: CostType, priceJpy?: number, note?: string): string {
  if (note) return note;
  if (type === "free") return "Free";
  if (type === "paid" && typeof priceJpy === "number") return `¥${priceJpy.toLocaleString("en-US")}`;
  return COST_LABEL[type];
}

/** Great-circle distance in km between two lat/lng points. */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

const DATE_FMT = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const DATE_FMT_YEAR = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

/** Format an event window. For annual events the year is suppressed. */
export function formatDateRange(start: Date, end: Date, recurrence = "annual"): string {
  const fmt = recurrence === "annual" ? DATE_FMT : DATE_FMT_YEAR;
  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) return fmt.format(start);
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

export function isoDate(d: Date | string): string {
  return new Date(d).toISOString();
}

/**
 * Deterministic pastel gradient + emoji used as an image placeholder when an entry has no
 * photo. Keeping placeholders generated (not bundled files) keeps the repo light and the
 * UI never shows a broken image. Returns inline CSS + an emoji glyph.
 */
export function placeholderStyle(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  const h2 = (h + 40) % 360;
  return `background: linear-gradient(135deg, hsl(${h} 70% 82%), hsl(${h2} 65% 70%));`;
}

/**
 * Inline onerror handler for remote photos. Hero/photo images may be hotlinked Wikimedia
 * Commons *thumbnails*; if the requested thumb width exceeds the original's width the thumb
 * URL 404s while the original always exists — so on error we retry the original file, and
 * failing that hide the broken <img> (revealing the placeholder/background instead).
 */
export const IMG_ONERROR =
  "this.onerror=null;" +
  "var m=this.src.match(/^(https:\\/\\/upload\\.wikimedia\\.org\\/wikipedia\\/commons)\\/thumb(\\/.+)\\/[0-9]+px-[^\\/]+$/);" +
  "if(m){this.src=m[1]+m[2];}else{this.style.display='none';}";

/**
 * Public credit line for who found a place. Community submissions carry the visitor's
 * name/handle in `submittedBy`; everything the site adds itself (editorial, AI agents,
 * imports) is credited to Cinnamon — he is, after all, a very busy squirrel.
 */
export function contributorName(source: string, submittedBy?: string): string {
  if (source === "community" && submittedBy && submittedBy.trim() && submittedBy !== "editorial") {
    return submittedBy.trim().slice(0, 60);
  }
  return "Cinnamon";
}
