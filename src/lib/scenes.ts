/**
 * scenes.ts — discovery for bespoke Scene Art (docs/SCENE_ART.md).
 *
 * Scenes are authored as src/data/scenes/<slug>.<model>.svg and auto-discovered at build
 * time. This module is Vite-glob based (build-time only) and imports nothing from
 * astro:content/Node, so it stays isomorphic-safe like src/lib/adventures.ts.
 */

export type SceneModel = "sonnet" | "opus";

export interface SceneVariant {
  slug: string;
  model: SceneModel;
  /** Raw authored SVG source. */
  raw: string;
  /** data-title from the SVG root, for accessible labeling. */
  title: string;
}

/** Display labels for the A/B comparison chips. */
export const SCENE_MODEL_LABEL: Record<SceneModel, string> = {
  sonnet: "Sonnet",
  opus: "Opus",
};

const scenes = import.meta.glob<string>("../data/scenes/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
});

const MODEL_ORDER: SceneModel[] = ["sonnet", "opus"];

export const SCENES: SceneVariant[] = Object.entries(scenes)
  .map(([path, raw]): SceneVariant | null => {
    const m = path.match(/\/([^/]+)\.(sonnet|opus)\.svg$/);
    if (!m) return null;
    const [, slug, model] = m;
    return {
      slug,
      model: model as SceneModel,
      raw,
      title: raw.match(/data-title="([^"]*)"/)?.[1] ?? "",
    };
  })
  .filter((v): v is SceneVariant => v !== null)
  .sort(
    (a, b) =>
      a.slug.localeCompare(b.slug) || MODEL_ORDER.indexOf(a.model) - MODEL_ORDER.indexOf(b.model),
  );

export const scenesFor = (slug: string): SceneVariant[] => SCENES.filter((v) => v.slug === slug);
