/**
 * tags.ts — display metadata for tag slugs.
 *
 * Tags are free-form in the schema (any string is allowed) so the dataset can grow
 * organically, but tags listed here get a nice label + emoji wherever they're shown.
 * Unknown tags fall back to a title-cased label and a generic icon (see tagMeta()).
 *
 * `group` is used to organize tags in browse UIs. It does NOT have to match a filter
 * group — filters are defined separately in src/lib/filters.ts.
 */

export type TagGroup =
  | "theme"
  | "season"
  | "audience"
  | "conditions"
  | "access"
  | "vibe";

export interface TagMeta {
  slug: string;
  label: string;
  icon: string; // emoji — zero asset weight, renders everywhere
  group: TagGroup;
  description?: string;
}

export const TAGS: TagMeta[] = [
  // theme
  { slug: "nature", label: "Nature", icon: "🌲", group: "theme" },
  { slug: "food", label: "Food", icon: "🍜", group: "theme" },
  { slug: "museum", label: "Museum", icon: "🏛️", group: "theme" },
  { slug: "roadside", label: "Roadside", icon: "🛣️", group: "theme" },
  { slug: "scenic", label: "Scenic", icon: "🏞️", group: "theme" },
  { slug: "viewpoint", label: "Viewpoint", icon: "🔭", group: "theme" },
  { slug: "festival", label: "Festival", icon: "🎏", group: "theme" },
  { slug: "religious", label: "Shrine & Temple", icon: "⛩️", group: "theme" },
  { slug: "art", label: "Art", icon: "🎨", group: "theme" },
  { slug: "history", label: "History", icon: "📜", group: "theme" },
  { slug: "abandoned", label: "Abandoned", icon: "🏚️", group: "theme" },
  { slug: "oddity", label: "Oddity", icon: "🛸", group: "theme" },
  { slug: "giant-statue", label: "Giant Statue", icon: "🗿", group: "theme" },
  { slug: "animal", label: "Animals", icon: "🦊", group: "theme" },
  { slug: "garden", label: "Garden", icon: "🌸", group: "theme" },
  { slug: "onsen", label: "Hot Spring", icon: "♨️", group: "theme" },
  { slug: "industrial", label: "Industrial", icon: "🏭", group: "theme" },
  { slug: "shop", label: "Old Shop", icon: "🏪", group: "theme" },

  // season highlights
  { slug: "cherry-blossom", label: "Cherry Blossoms", icon: "🌸", group: "season" },
  { slug: "autumn-leaves", label: "Autumn Leaves", icon: "🍁", group: "season" },
  { slug: "snow", label: "Snow", icon: "❄️", group: "season" },
  { slug: "fireworks", label: "Fireworks", icon: "🎆", group: "season" },
  { slug: "illumination", label: "Illumination", icon: "💡", group: "season" },
  { slug: "flowers", label: "Flowers", icon: "🌼", group: "season" },

  // audience
  { slug: "kids", label: "Kids", icon: "🧒", group: "audience" },
  { slug: "dog-friendly", label: "Dog Friendly", icon: "🐕", group: "audience" },
  { slug: "photography", label: "Photography", icon: "📷", group: "audience" },
  { slug: "romantic", label: "Romantic", icon: "💞", group: "audience" },
  { slug: "solo", label: "Solo", icon: "🚶", group: "audience" },

  // conditions
  { slug: "night", label: "Night", icon: "🌙", group: "conditions" },
  { slug: "rainy-day", label: "Rainy Day", icon: "🌧️", group: "conditions" },
  { slug: "indoor", label: "Indoor", icon: "🏠", group: "conditions" },
  { slug: "outdoor", label: "Outdoor", icon: "🌄", group: "conditions" },

  // access
  { slug: "free", label: "Free", icon: "🆓", group: "access" },
  { slug: "wheelchair", label: "Wheelchair", icon: "♿", group: "access" },
  { slug: "transit-accessible", label: "Transit OK", icon: "🚆", group: "access" },

  // vibe
  { slug: "hidden-gem", label: "Hidden Gem", icon: "💎", group: "vibe" },
  { slug: "weird", label: "Weird", icon: "🤪", group: "vibe" },
  { slug: "nostalgic", label: "Nostalgic", icon: "📻", group: "vibe" },
  { slug: "instagrammable", label: "Photogenic", icon: "✨", group: "vibe" },
  { slug: "free-parking", label: "Free Parking", icon: "🅿️", group: "vibe" },
];

const BY_SLUG = new Map(TAGS.map((t) => [t.slug, t]));

/** Title-case a slug like "old-shop" → "Old Shop". */
function titleCase(slug: string): string {
  return slug
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Get display metadata for any tag slug, with a sensible fallback. */
export function tagMeta(slug: string): TagMeta {
  return (
    BY_SLUG.get(slug) ?? {
      slug,
      label: titleCase(slug),
      icon: "🏷️",
      group: "theme",
    }
  );
}
