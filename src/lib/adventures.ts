/**
 * adventures.ts — discovery for "Adventures in Cinnamon Land" films (docs/ADVENTURES.md).
 *
 * Films are authored as src/data/adventures/<slug>.<model>.svg and auto-discovered at
 * build time; GIF renditions live at public/adventures/<slug>.<model>.gif. This module
 * is Vite-glob based (build-time only usage) and imports nothing from astro:content/Node.
 */

export type AdventureModel = "sonnet" | "opus";

export interface AdventureVariant {
  slug: string;
  model: AdventureModel;
  /** Raw authored SVG source. */
  raw: string;
  /** True when a recorded GIF rendition exists in public/adventures/. */
  hasGif: boolean;
}

/** Display labels for the A/B experiment chips. */
export const MODEL_LABEL: Record<AdventureModel, string> = {
  sonnet: "Sonnet",
  opus: "Opus",
};

const films = import.meta.glob<string>("../data/adventures/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
});
// Keys only — used as an existence check for recorded GIFs, never imported.
const gifs = new Set(
  Object.keys(import.meta.glob("/public/adventures/*.gif")).map((p) => p.split("/").pop()!),
);

const MODEL_ORDER: AdventureModel[] = ["sonnet", "opus"];

export const ADVENTURES: AdventureVariant[] = Object.entries(films)
  .map(([path, raw]): AdventureVariant | null => {
    const m = path.match(/\/([^/]+)\.(sonnet|opus)\.svg$/);
    if (!m) return null;
    const [, slug, model] = m;
    return {
      slug,
      model: model as AdventureModel,
      raw,
      hasGif: gifs.has(`${slug}.${model}.gif`),
    };
  })
  .filter((v): v is AdventureVariant => v !== null)
  .sort(
    (a, b) =>
      a.slug.localeCompare(b.slug) || MODEL_ORDER.indexOf(a.model) - MODEL_ORDER.indexOf(b.model),
  );

export const adventuresFor = (slug: string): AdventureVariant[] =>
  ADVENTURES.filter((v) => v.slug === slug);
