# Adventures in Cinnamon Land — the animated film system

Every film is a **~15-second looping animated short** on an entry's detail page: a branded
title card, then 4–6 carefully framed scenes telling one small story about the cast visiting
that place, with dialogue in a persistent subtitle bar under the picture. The same authored
file renders two ways:

1. **Live SVG** — the file plays in the browser via `AdventureFilm.astro` (crisp, tiny).
2. **GIF** — `npm run adventures:gif` records the identical film into
   `public/adventures/<slug>.<model>.gif` (heavier, but portable).

A film is ONE self-contained SVG document in `src/data/adventures/<slug>.<model>.svg`
(`<model>` = `sonnet` | `opus`). No JSON, no build config — author one file, validate, done.

---

## 1. What "good" looks like

This replaces a retired comic-strip system that failed because every panel looked the same:
characters plopped on a gradient with a caption. **The bar now is: each scene is a designed
shot.** Before drawing anything, write the story beats like a storyboard artist:

- **A story, not a slideshow.** Someone wants something, does something, reacts. "Socks
  doesn't want to go in → goes in → is weirdly into it" is a story. Five angles of the
  building is not.
- **Every scene has a different camera setup.** Mix at least three of: establishing wide
  (place small, sky big), medium two-shot (characters + the thing), close-up / insert
  (paws, a ticket, a noodle), reaction shot (faces only, big), payoff wide (echo of the
  opening framing with something changed). Two scenes with the same composition = redo one.
- **Backgrounds are real vector art, not gradients.** Minimum three depth layers per scene:
  (a) sky/atmosphere, (b) far layer (mountain silhouette, skyline, cave dark), (c) mid
  layer (the building/rock/room with actual architectural detail — windows, beams, ribs,
  signage), (d) ground plane with texture (boards, tiles, grass tufts, puddle). Rooms get
  walls with stuff on them. Aim for 15–40 deliberate shapes per scene, not 4.
- **Motion is blocking, not decoration.** Each scene has one primary action (a character
  walks in, points, jumps back, slurps) plus one or two ambient loops (steam, water
  shimmer, dust motes, blinking sign). Idle characters still breathe (tiny 2–3s bob).
- **The facts are real.** Dialogue facts (heights, counts, years, prices) must come from
  the entry's frontmatter/body. The antics are invented; the facts never are
  (`docs/CINNAMON.md` §3 rule).

## 2. The cast (canon: `docs/CINNAMON.md` §1, §1.5)

- **Cinnamon** 🐿️ — squirrel, engine of the trip. Curious, dives in first, polite to
  objects, food-motivated, measures things in squirrel units.
- **Socks** 🐈‍⬛ — tuxedo cat, tech lead, secretly a scaredy-cat. Startles at normal things,
  fine with weird things. In *captions* he speaks normally (lolcat-speak is only for things
  he *types*).
- **Mon-chan** 🐕 — shiba pup, self-appointed leader, jealous of anything bigger or
  fluffier than him. Wounded dignity is the running gag.

Use **two of the three** per film (all three allowed if the story needs it; one is too few
for dialogue). Ready-made standing poses exist as shared symbols you can `<use>`:

```svg
<use href="#advc-cinnamon" x="300" y="150" width="90" height="90"/>   <!-- viewBox 240 -->
<use href="#advc-socks"    x="80"  y="170" width="70" height="70"/>   <!-- viewBox 200 -->
<use href="#advc-mon"      x="180" y="168" width="72" height="72"/>   <!-- viewBox 200 -->
```

Feet sit ~6% above the bottom edge of the use-box. Flip a character with
`transform="translate(2x+w,0) scale(-1,1)"` (or wrap in a `<g>` and flip that). For
close-ups and custom poses, **draw your own** variant faces/limbs — stay on-model:

| element | colors |
| --- | --- |
| Cinnamon fur / belly | `#9c7c55`→`#7d6242` gradient, belly `#e9d8bd`, paws `#b9966c` |
| Cinnamon neckerchief | `#7a8f52` stroke `#5f7040` (moss green, knot at front) |
| Socks body / face+paws | `#26221f` body, `#f5f1ea` white; **black nose dot** `#171412` (never omit) |
| Socks eyes | `#c8d24e` (yellow-green) |
| Mon-chan fur / cream | `#e8973f`, muzzle+chest `#f7ecd8`, blush `#e7a793` |
| Mon-chan bandana | `#6f8a4d` with `#f7ecd8` karakusa dots |
| Eyes/outline darks | `#241c16`, `#171412`, mouth strokes `#3a2c24` |

Scene palettes beyond the cast are yours — commit to a mood per scene (cave teal-dark,
museum warm paper, winter blue) and keep shapes flat with occasional soft highlights
(the site's house style is flat storybook vector, thick clean silhouettes, no gradients
except sky/water/fur, no filters, no blurs).

## 3. File contract (enforced by `npm run adventures:validate`)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 270"
     data-episode="The Six-Story Pachyderm" data-prefix="lucys">
  <style>
    /* all animation + styling CSS */
  </style>
  <defs><!-- optional shared gradients/shapes --></defs>
  <g class="scene" data-dur="3.4" data-caption="CINNAMON: “They built a WHAT in 1881?”">
    <!-- full scene art -->
  </g>
  <!-- 3–5 more scenes -->
</svg>
```

- **Stage** is exactly `viewBox="0 0 480 270"` (16:9). Draw edge to edge; anything outside
  the viewBox is clipped (useful for entrances).
- **`data-episode`** — the episode title shown on the title card, ≤ 40 chars, in quotes on
  the card, so write it like a storybook chapter ("The Six-Story Pachyderm", "Silk in the
  Soup"). Don't repeat the place name verbatim — the card already shows it.
- **`data-prefix`** — a short unique token for this film (suggestion: 4 letters of the slug
  + first letter of the model, e.g. `lucys`, `blueo`). **Every class name, id, and
  `@keyframes` name in the file must start with `<prefix>-`** (the structural class
  `scene` is the one exception). This is what lets two films share a page without CSS
  collisions.
- **Scenes**: 4–6 top-level `<g class="scene">`, each `data-dur` 1.6–5s, total 9–18s.
  Scenes are **hard cuts** (the runtime handles visibility — do not animate scene opacity
  yourself, and don't `display:none` them; stack order doesn't matter since only one shows
  at a time; later scenes simply paint over earlier ones while both render during capture,
  so give every scene an opaque full-bleed background rect as its first shape).
- **`data-caption`** — the subtitle for that scene. Formats:
  `SPEAKER: “line”` (speaker ∈ `CINNAMON` | `SOCKS` | `MON-CHAN`) or plain narration
  (no speaker). ≤ 120 chars. Use curly quotes `“”` inside the attribute, never `"`.
  One caption per scene — write dialogue that's worth reading; it persists the whole scene.
- **Forbidden**: `<script>`, `<image>`, external `href`s (only `#fragment` refs allowed),
  `<foreignObject>`, CSS `@import`/`url(`. `<text>` is allowed for *in-world* signage
  only (a shop sign, a museum label) — never for dialogue.

## 4. Animating (the timeline contract)

The runtime plays: **title card (2.6s) → your scenes in order → loop.** All CSS animations
in the file restart at the top of each loop (the runtime remounts the film), so author
everything relative to a single run:

- The film root exposes CSS variables **`--t1`, `--t2`, … `--t6`** = the absolute start
  time of each of your scenes (title card included — `--t1` is `2.6s`). Trigger anything
  relative to its scene's start:

  ```css
  .lucys-walkin {
    animation: lucys-walk 1.4s cubic-bezier(.3,.9,.4,1) both;
    animation-delay: calc(var(--t2) + 0.2s);
  }
  ```

- **One-shot actions** (entrances, jumps, points): `both` fill + a `calc(var(--tN) + …)`
  delay, as above. They hold their end state for the rest of the run — fine, the scene
  cuts away.
- **Ambient loops** (steam, shimmer, bobbing, blinks): plain `infinite` animations with
  their own short durations, no delay needed:

  ```css
  .lucys-steam { animation: lucys-rise 2.2s linear infinite; }
  ```

- Animate `transform` and `opacity` only (compositor-friendly; also what the GIF recorder
  samples reliably). Set `transform-origin` / `transform-box: fill-box` explicitly when
  rotating or scaling a group.
- **Camera moves**: wrap the whole scene's content in one inner `<g class="lucys-cam3">`
  and animate its transform — a slow 4–6% scale-up reads as a push-in; a translate reads
  as a pan. One camera move per scene max, and keep it slow.
- Nothing may animate `width/height/x/y` attributes via SMIL — CSS animations only
  (SMIL doesn't survive the GIF recorder's seek).

## 5. Writing the beats (do this before drawing)

Sketch on paper first, e.g. for a noodle shop with silk in the broth:

1. *Wide establishing* — shop exterior at dusk, lit lanterns, cast walks in from frame
   left. `SOCKS: “I read the reviews. They put SILK in the soup. On purpose.”`
2. *Medium interior* — counter, steam, bowls land. `CINNAMON: “Two bowls please. He has
   trust issues.”`
3. *Close-up* — a bowl, chopsticks lift glossy noodles, sheen sweep.
   `SOCKS: “…it's so smooth. I'm not scared of this at all.”`
4. *Reaction* — both faces big, Socks's eyes gone sparkly. `MON-CHAN: “I was not invited
   and I will remember this.”` (cut to him outside the window)
5. *Payoff wide* — exterior again, night now, cast waddles out round-bellied.
   `Narration: Open till 9. The silk is real. Socks bought a to-go cup.`

Then, per scene, decide the frame: horizon line, where the subject sits (rule of thirds),
what's near/far, where the action enters. THEN write the SVG.

## 6. Site integration & the A/B experiment

`AdventureFilm.astro` auto-discovers `src/data/adventures/*.svg`; a detail page shows a
"🎬 Adventures in Cinnamon Land" section when films exist for its slug. Each variant is
labeled with its authoring model and format. The standalone player page
`/adventures/<slug>/<model>/` renders one film alone (also used by the GIF recorder).

### Current experiment roster (2026-07: Sonnet vs Opus, same 5 entries)

| slug | sonnet file | opus file | GIFs |
| --- | --- | --- | --- |
| khao-bin-cave | `khao-bin-cave.sonnet.svg` | `khao-bin-cave.opus.svg` | `public/adventures/khao-bin-cave.{sonnet,opus}.gif` |
| blue-pond-biei | `blue-pond-biei.sonnet.svg` | `blue-pond-biei.opus.svg` | `public/adventures/blue-pond-biei.{sonnet,opus}.gif` |
| meguro-parasitological-museum | `meguro-parasitological-museum.sonnet.svg` | `meguro-parasitological-museum.opus.svg` | `public/adventures/meguro-parasitological-museum.{sonnet,opus}.gif` |
| japanese-sword-museum | `japanese-sword-museum.sonnet.svg` | `japanese-sword-museum.opus.svg` | `public/adventures/japanese-sword-museum.{sonnet,opus}.gif` |
| lucy-the-elephant | `lucy-the-elephant.sonnet.svg` | `lucy-the-elephant.opus.svg` | `public/adventures/lucy-the-elephant.{sonnet,opus}.gif` |

**To drop a variant later** (e.g. "keep Opus, remove Sonnet"): delete that model's five
`src/data/adventures/*.{model}.svg` files and `public/adventures/*.{model}.gif` files —
nothing else references them; the section, player pages, and labels disappear on rebuild.
To adopt one model going forward, also update this doc and the label UI in
`AdventureFilm.astro` (drop the model chip once there's no comparison to show).

## 7. Toolchain

```bash
npm run adventures:validate   # contract checks on all films (also run by capture)
npm run build                 # films render live on detail + /adventures/ pages
npm run adventures:gif        # SITE_BASE=/ build → Playwright frame-seek capture → PIL GIF
```

The GIF recorder (`scripts/capture-adventures.mjs` + `scripts/assemble-gifs.py`) pauses
every animation on the player page, seeks the timeline frame-by-frame (deterministic — no
realtime jitter), screenshots the film, and assembles a shared-palette looping GIF at
~14 fps. Requires the globally installed Playwright + its bundled Chromium.
