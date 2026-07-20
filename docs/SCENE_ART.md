# Scene Art — bespoke, hand-composed place illustrations

The default per-entry vector art (`CinnamonScene` / `CinnamonSnapshot` / `PlaceScene`) is a
**parametric template**: the canonical Cinnamon/Socks/Mon SVG + one big emoji on a seeded
gradient. It's consistent and cheap, but it never actually *draws the place* — a festival
scene is just Cinnamon next to a 🏮, not lanterns and dancers.

**Scene Art** is the upgrade path: a genuinely illustrated, hand-composed SVG per entry —
a real background, place-specific midground, and the cast placed *in* the scene. Each entry
can be authored twice (by different models) so we can compare quality side-by-side, exactly
like the Adventures A/B (docs/ADVENTURES.md).

Presence of a file **is** the tracking system: an entry is "upgraded" for a model iff
`src/data/scenes/<slug>.<model>.svg` exists. The roster lives in §5.

---

## 1. File format

One file per entry per model:

```
src/data/scenes/<slug>.<model>.svg      model ∈ { sonnet, opus }
```

`<slug>` must match an entry id (the markdown filename in `src/content/**`).

Root element:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 300"
     data-prefix="koen" data-title="Koenji Awa Odori — lantern-lit night dance">
  ...
</svg>
```

- **viewBox** is exactly `0 0 480 300` (an 8:5 landscape frame — fills the hero and the
  in-page postcard cleanly).
- **data-prefix** — 3–12 lowercase alphanumerics, **unique across all scene files**. Every
  `id`, every gradient/filter id, and every CSS class/`@keyframes` name you define **must**
  start with `<prefix>-`. Two model scenes render on the same page, so un-namespaced ids
  (especially gradients) collide and bleed. This is the one hard rule that keeps the A/B
  honest — the validator enforces it.
- **data-title** — 2–60 chars, a short accessible label for the whole scene.

## 2. Reusing the cast

The canonical characters are shared symbols (see `AdventureCastDefs.astro`), already on any
page that renders Scene Art. Drop them into the composition with `<use>`, positioned and
scaled with a wrapping `<g transform>`:

```xml
<g transform="translate(300 150) scale(0.5)">
  <use href="#advc-cinnamon" width="240" height="240" />
</g>
```

Available: `#advc-cinnamon` (240×240), `#advc-socks` (200×200), `#advc-mon` (200×200).
Draw them in-scene — dancing, peering, mid-leap — don't just park one in the corner. You may
also draw your own bespoke characters/props; just keep every id `<prefix>-`namespaced.

## 3. The quality bar

This is the whole point — the reason the emoji template wasn't good enough. Each scene must:

- **Compose an actual place.** Background (sky/ground/architecture), a place-specific
  midground (the lanterns, the dancers, the drum, the water, the machine), and a bit of
  foreground. Aim for **25–60 drawn shapes**, not five.
- **Be specific, not generic.** A festival scene shows amigasa straw hats, happi coats,
  strung chōchin lanterns, a taiko drum — the things that make *this* place *this* place.
- **Frame it deliberately.** Think about depth, focal point, where the eye lands, where the
  cast sits in the scene. Use gradients for sky/water/glow.
- **Read at small sizes.** The postcard renders ~320px wide. Keep silhouettes clear.

## 4. Forbidden content

Same isolation rules as Adventures films:

- No `<script>`, `<image>`, `<foreignObject>`.
- No SMIL (`<animate>` / `<animateTransform>` / `<animateMotion>` / `<set>`). Static art.
  (A small **CSS** `<style>` block with `<prefix>-` scoped rules is allowed if you want a
  subtle ambient loop — optional, not required.)
- No external references: every `href` must be a `#fragment`; `<use>` targets must be a cast
  symbol (`#advc-*`) or `<prefix>-`namespaced.
- No `@import`, no external `url(...)`; no `display:none`.
- Keep each file **under 30 KB**.

Validate with:

```
python3 scripts/validate-scenes.py           # all scenes
python3 scripts/validate-scenes.py src/data/scenes/koenji-awa-odori.opus.svg
```

## 5. A/B roster & tracking

| slug | sonnet | opus |
| --- | --- | --- |
| koenji-awa-odori | ✅ | ✅ |

Entries not listed still use the parametric template. When a winning model is picked for an
entry, delete the losing `src/data/scenes/<slug>.<model>.svg` and the row stays as the
record of what's upgraded. To wire a chosen scene in as the real hero/postcard (replacing
the template), see `SceneArt.astro` and the detail-page integration in `DetailLayout.astro`.
