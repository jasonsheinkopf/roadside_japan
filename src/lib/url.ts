/**
 * url.ts — base-path-aware URL building.
 *
 * On GitHub Pages PROJECT sites the app is served from a sub-path (e.g.
 * "/roadside_japan/"), so EVERY internal link and local asset must be prefixed with
 * import.meta.env.BASE_URL or it 404s in production. Always build internal URLs through
 * these helpers instead of writing string literals. External (http/https) URLs pass
 * through untouched.
 */

const RAW_BASE = import.meta.env.BASE_URL || "/";
/** Normalized base with no trailing slash: "" (root) or "/roadside_japan". */
export const BASE = RAW_BASE.endsWith("/") ? RAW_BASE.slice(0, -1) : RAW_BASE;

export function withBase(path = "/"): string {
  if (/^(https?:)?\/\//.test(path) || path.startsWith("mailto:") || path.startsWith("#")) {
    return path;
  }
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${BASE}${p}` || "/";
}

export const homeUrl = () => withBase("/");
export const mapUrl = () => withBase("/map");
export const exploreUrl = () => withBase("/explore");
export const attractionUrl = (slug: string) => withBase(`/attractions/${slug}`);
export const eventUrl = (slug: string) => withBase(`/events/${slug}`);
export const prefectureUrl = (slug: string) => withBase(`/prefectures/${slug}`);
export const tagUrl = (slug: string) => withBase(`/tags/${slug}`);
export const seasonUrl = (slug: string) => withBase(`/seasons/${slug}`);

/** URL for a record regardless of collection. */
export function recordUrl(collection: "attractions" | "events", slug: string): string {
  return collection === "events" ? eventUrl(slug) : attractionUrl(slug);
}
