/**
 * countries.ts — display + map metadata for each country in the atlas.
 *
 * The site is designed around browsing one country at a time: the header shows a tab per
 * country, each country has a landing page (/countries/<slug>), and selecting a country
 * on the Map recenters/zooms to that country's view. `filterId` doubles as the id of the
 * country's option in FILTER_GROUPS (src/lib/filters.ts), so links like
 * /explore?f=thailand and /map?f=thailand scope those pages to the country.
 */
import type { Country } from "./vocab";

export interface CountryMeta {
  slug: Country;
  name: string;
  /** Short label for compact chips (e.g. "JP") — full name still used where space allows. */
  code: string;
  flag: string; // emoji — consistent with the site's zero-asset icon convention
  tagline: string;
  /** Map framing when this country is selected. */
  center: [number, number];
  zoom: number;
  /** Currency hint shown in practical info contexts. */
  currency: string;
}

export const COUNTRY_META: Record<Country, CountryMeta> = {
  japan: {
    slug: "japan",
    name: "Japan",
    code: "JP",
    flag: "🇯🇵",
    tagline: "Wisteria tunnels, snow monsters, giant Buddhas, and the museums nobody told you about.",
    center: [36.2048, 138.2529],
    zoom: 5,
    currency: "JPY ¥",
  },
  thailand: {
    slug: "thailand",
    name: "Thailand",
    code: "TH",
    flag: "🇹🇭",
    tagline: "Dragon towers, sticky waterfalls, train-track markets, and temples like fever dreams.",
    center: [15.0, 101.0],
    zoom: 5,
    currency: "THB ฿",
  },
  usa: {
    slug: "usa",
    name: "USA",
    code: "USA",
    flag: "🇺🇸",
    tagline: "Painted mountains, dinosaur-sized roadside giants, UFO museums, and monuments to beautiful obsession.",
    center: [39.5, -98.35],
    zoom: 4,
    currency: "USD $",
  },
};

export const COUNTRY_LIST: CountryMeta[] = Object.values(COUNTRY_META);

export function getCountry(slug: string): CountryMeta | undefined {
  return COUNTRY_META[slug as Country];
}
