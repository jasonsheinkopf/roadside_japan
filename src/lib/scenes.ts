/**
 * scenes.ts — discovery for bespoke Scene Art (docs/SCENE_ART.md).
 *
 * Scenes are authored (by Sonnet) as src/data/scenes/<slug>.<role>.svg and auto-discovered
 * at build time. role ∈ { hero, snap1, snap2 }: `hero` replaces the PlaceScene hero fallback
 * (place only, no cast); `snap1`/`snap2` replace the emoji camera-roll snapshots. Vite-glob
 * based (build-time only), imports nothing from astro:content/Node — stays isomorphic-safe.
 */

export type SceneRole = "hero" | "snap1" | "snap2";

export interface SceneVariant {
  slug: string;
  role: SceneRole;
  /** Raw authored SVG source. */
  raw: string;
  /** data-title — accessible label, and the caption for snapshots. */
  title: string;
}

const scenes = import.meta.glob<string>("../data/scenes/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
});

const SNAP_ORDER: SceneRole[] = ["snap1", "snap2"];

const ALL: SceneVariant[] = Object.entries(scenes)
  .map(([path, raw]): SceneVariant | null => {
    const m = path.match(/\/([^/]+)\.(hero|snap[12])\.svg$/);
    if (!m) return null;
    const [, slug, role] = m;
    return {
      slug,
      role: role as SceneRole,
      raw,
      title: raw.match(/data-title="([^"]*)"/)?.[1] ?? "",
    };
  })
  .filter((v): v is SceneVariant => v !== null);

/** The drawn hero scene for an entry, if one exists (place only, no cast). */
export const heroScene = (slug: string): SceneVariant | undefined =>
  ALL.find((v) => v.slug === slug && v.role === "hero");

/** The drawn camera-roll snapshots for an entry, ordered snap1, snap2. */
export const snapScenes = (slug: string): SceneVariant[] =>
  ALL.filter((v) => v.slug === slug && v.role !== "hero").sort(
    (a, b) => SNAP_ORDER.indexOf(a.role) - SNAP_ORDER.indexOf(b.role),
  );
