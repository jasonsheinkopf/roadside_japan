# Scene Art — bespoke, hand-composed place illustrations

The old per-entry vector art was a **parametric template**: the canonical Cinnamon/Socks/Mon
SVG + one big emoji on a seeded gradient. It's consistent and cheap, but it never actually
*draws the place* — a festival was just Cinnamon next to a 🏮.

**Scene Art** replaces that with genuinely illustrated, hand-composed SVG per entry. After an
Opus-vs-Sonnet bake-off, **Sonnet** is the chosen author for this art. Each upgraded entry
gets up to three drawn scenes, each with a distinct **role**:

| role | file | where it renders | cast? |
| --- | --- | --- | --- |
| `hero` | `<slug>.hero.svg` | the hero frame, when the entry has **no licensed photo** (replaces `PlaceScene`) | **no cast** — it's a photo substitute of the *place itself* |
| `snap1` | `<slug>.snap1.svg` | first tile of "📸 Cinnamon's camera roll" | cast encouraged |
| `snap2` | `<slug>.snap2.svg` | second camera-roll tile | cast encouraged |

Presence of a file **is** the tracking system: an entry is "upgraded" for a role iff
`src/data/scenes/<slug>.<role>.svg` exists. Roster in §6.

---

## 1. File format

```
src/data/scenes/<slug>.<role>.svg      role ∈ { hero, snap1, snap2 }
```

`<slug>` must match an entry id (the markdown filename in `src/content/**`).

Root element:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 300"
     data-prefix="koenh" data-title="Koenji Awa Odori — lantern-lit shopping street at night">
  ...
</svg>
```

- **viewBox** is exactly `0 0 480 300` (8:5 landscape). The `hero` is cover-cropped to fill
  the hero frame; snapshots render as full 8:5 cards.
- **data-prefix** — 3–12 lowercase alphanumerics, **unique across all scene files** (all three
  of an entry's scenes share a page, so give each a distinct prefix, e.g. `koenh` / `koes1` /
  `koes2`). Every `id`, gradient/filter id, and CSS class/`@keyframes` you define **must**
  start with `<prefix>-`. This is the one hard rule that stops ids colliding — the validator
  enforces it.
- **data-title** — 2–70 chars. For `hero` it's the accessible label; for `snap1`/`snap2` it's
  **also the caption shown under the tile**, so write it like a real photo caption.

## 2. Reusing the cast (snapshots only)

The canonical characters are shared symbols (`AdventureCastDefs.astro`), already on any page
that renders Scene Art. Place them in a snapshot with `<use>` inside a wrapping
`<g transform>`:

```xml
<g transform="translate(300 150) scale(0.5)">
  <use href="#advc-cinnamon" width="240" height="240" />
</g>
```

Available: `#advc-cinnamon` (240×240), `#advc-socks` (200×200), `#advc-mon` (200×200). Draw
them *in* the scene — dancing, peering, mid-leap. **The `hero` scene must NOT use the cast** —
it's the place as a photo would show it. (You may draw your own bespoke people/props in any
role; keep every id `<prefix>-`namespaced.)

## 3. The quality bar — this is the whole point

Make it look genuinely good. Put in the effort.

- **Compose an actual place.** Background (sky/architecture), a place-specific midground (the
  lanterns, dancers, drum, water, machine, storefront), and foreground detail. **25–70 drawn
  shapes**, not five.
- **Be specific.** A festival shows amigasa straw hats, happi coats, strung chōchin lanterns, a
  taiko drum — the things that make *this* place *this* place.
- **Vary the camera between the two snapshots.** They should NOT be the same shot twice. Give
  each a different **perspective**: e.g. `snap1` a tight **close-up** (a character mid-action,
  faces, texture), `snap2` a **top-down / wide** angle (the procession from above, the room
  from a high corner). Think like a photographer working the scene.
- **Light it.** Use gradients for sky/water/glow; think about focal point and depth.
- **Read at small sizes.** Snapshots render ~300–460px wide; the hero is cover-cropped. Keep
  silhouettes clear and keep important content away from the extreme edges (the hero crops).

## 4. Forbidden content

- No `<script>`, `<image>`, `<foreignObject>`; no SMIL (`<animate>` / `<animateTransform>` /
  `<animateMotion>` / `<set>`). Static art. (A small `<style>` block with `<prefix>-` scoped
  rules is allowed for a subtle ambient loop — optional.)
- No external references: every `href` is a `#fragment`; `<use>` targets are a cast symbol
  (`#advc-*`, snapshots only) or `<prefix>-`namespaced.
- No `@import`, no external `url(...)`, no `display:none`. Under **30 KB** per file.
- `hero` role: no `#advc-*` cast references (validator enforces).

Validate:

```
python3 scripts/validate-scenes.py
python3 scripts/validate-scenes.py src/data/scenes/koenji-awa-odori.hero.svg
```

Preview any scene to a PNG for review:

```
node scripts/preview-scene.mjs src/data/scenes/koenji-awa-odori.snap1.svg /tmp/out.png
```

## 5. How it wires in

`src/lib/scenes.ts` discovers files and exposes `heroScene(slug)` and `snapScenes(slug)`.
`DetailLayout.astro` uses them: the drawn `hero` fills the hero frame when there's no photo,
and drawn snapshots replace the emoji `CinnamonSnapshot` tiles in the camera roll. `SceneArt.astro`
renders a scene (cover-fill for hero, captioned card for snapshots). No per-entry code — drop
the files in and they appear.

## 6. Roster & tracking

| slug | hero | snap1 | snap2 | notes |
| --- | --- | --- | --- | --- |
| koenji-awa-odori | ✅ | ✅ | ✅ | hero is a fallback (entry has a real photo); camera roll uses the drawn snaps |
| tachikawa-yokai-bon-odori | ✅ | ✅ | ✅ | |
| uwara-risokyo | ✅ | ✅ | ✅ | |
| uwara-beach | ✅ | ✅ | ✅ | |
| katsuura-morning-market | ✅ | ✅ | ✅ | |
| cape-hachiman-park | ✅ | ✅ | ✅ | |

Entries not listed still use the parametric template (`PlaceScene` / `CinnamonSnapshot`).
