/**
 * categories.ts — display metadata (label, emoji, blurb) for each primary category.
 * Mirrors the CATEGORIES tuple in vocab.ts. Used by cards, filters, and browse pages.
 */
import type { Category } from "./vocab";

export interface CategoryMeta {
  label: string;
  emoji: string;
  blurb: string;
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  nature: { label: "Nature", emoji: "🌲", blurb: "Wild places, parks, and natural wonders" },
  scenic: { label: "Scenic", emoji: "🏞️", blurb: "Drives, vistas, and beautiful landscapes" },
  food: { label: "Food", emoji: "🍜", blurb: "Local specialties and unusual eats" },
  museum: { label: "Museum", emoji: "🏛️", blurb: "Collections strange and small" },
  roadside: { label: "Roadside", emoji: "🛣️", blurb: "Pull-over curiosities and odd stops" },
  religious: { label: "Shrine & Temple", emoji: "⛩️", blurb: "Sacred sites and quiet grounds" },
  art: { label: "Art", emoji: "🎨", blurb: "Installations, sculpture, and design" },
  history: { label: "History", emoji: "📜", blurb: "Where the past still lingers" },
  oddity: { label: "Oddity", emoji: "🛸", blurb: "Gloriously weird and unexpected" },
  abandoned: { label: "Abandoned", emoji: "🏚️", blurb: "Ruins and forgotten places" },
  viewpoint: { label: "Viewpoint", emoji: "🔭", blurb: "Big views worth the climb" },
  shop: { label: "Old Shop", emoji: "🏪", blurb: "Time-capsule stores and makers" },
  experience: { label: "Experience", emoji: "✨", blurb: "Things to do, not just see" },
  animal: { label: "Animals", emoji: "🦊", blurb: "Creatures great, small, and surprising" },
  festival: { label: "Festival", emoji: "🎏", blurb: "Seasonal celebrations and matsuri" },
};
