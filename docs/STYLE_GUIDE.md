# Style Guide

Two parts: how we **write** and how we **look**.

---

## Voice & content

**Audience:** English speakers visiting or living in Japan who'd otherwise never find these
places. **North star:** every entry should make a reader think *"I had no idea this existed."*

- **Curious and warm, never hypey.** No "must-see!", no SEO sludge, no breathless adjectives.
  Earn the wonder with specifics.
- **Lead with the hook.** The `summary` is one or two vivid sentences that capture what's
  strange or special. It's used in cards, search, and social — make it count.
- **Be concrete.** "An 8.8-metre tapeworm with a ribbon beside it so you can walk its length"
  beats "fascinating exhibits."
- **Be honest.** Note when something is remote, hard, seasonal, or closed. Trust > clicks.
- **Respect people and places.** Real residents, sacred sites, and private property deserve
  care. Don't encourage trespassing.
- **Cite facts.** Anything non-obvious (height, dates, history) should have a `source`.
- **Prefer the overlooked.** If it's already on every itinerary, find the overlooked angle or
  skip it.

### Entry body shape
A short intro paragraph (the hook), then optional `## Why It's Interesting`, `## Best Time to
Visit`, `## Getting There`. 2–4 tight paragraphs. Put short actionable nuggets in `tips`.

### Microcopy
Friendly and light, with the occasional wink ("You've wandered off the map."). Buttons are
verbs ("Open the map", "Surprise me"). Emoji are welcome as accents, not decoration overload.

### Cinnamon's voice
Everything written *as the mascot* — scene quotes, field reports, thank-you emails — follows
**[`docs/CINNAMON.md`](./CINNAMON.md)**, the persona bible. Read it before writing him.

---

## Visual design

The feel: **a field notebook crossed with Atlas Obscura** — warm paper, ink text, a torii-red
accent, seasonal greens/blues/golds. Clean, friendly, a little adventurous.

### Color (semantic tokens, defined in `src/styles/global.css`)
Use the Tailwind tokens, never raw hex, so dark mode and theming "just work."

| Token         | Light     | Role |
| ------------- | --------- | ---- |
| `canvas`      | `#fbf7ef` | Page background (warm paper) |
| `surface`     | `#fffdf9` | Cards |
| `surface-2`   | `#f3ebdb` | Insets / chips |
| `ink`         | `#23201b` | Text |
| `ink-soft`    | `#6b6456` | Secondary text |
| `line`        | `#e7ddca` | Borders |
| `sun`         | `#e0492f` | **Brand accent** (torii red) |
| `pine`        | `#2f6b5e` | Nature green |
| `sky`         | `#2f6bae` | Water/scenic blue |
| `gold`        | `#c9892a` | Seasonal / autumn |

Dark mode is class-based (`.dark`) and flips the same variables. Always test both.

### Type
- **Display (headings):** a serif stack (`Iowan Old Style, Palatino, Georgia, ui-serif`) for
  notebook warmth — `font-display`.
- **Body/UI:** the system sans stack — `font-sans`.
- Self-hosted/web fonts are intentionally avoided (speed, offline, reliability). Swapping one
  in is a one-line change in `@theme` if ever desired.

### Components & shape
- Rounded corners (`rounded-2xl`/`rounded-3xl`, `--radius-card`), soft borders (`border-line`),
  gentle hover lift on cards.
- Reusable classes: `.card`, `.chip`, `.btn`/`.btn-primary`/`.btn-ghost`, `.link-underline`,
  `.bg-topo` (subtle dot texture). Prefer these over re-inventing.
- **Imagery:** emoji for category/tag icons and map pins (zero weight, never broken); missing
  photos fall back to a deterministic gradient (`placeholderStyle`). Real photos use
  `object-cover` with required `alt`.

### Logo
A scenic-byway route-marker badge (Mt. Fuji + rising sun + winding road). Source SVG is
`public/icon.svg`; rasters (favicons, PWA icons, OG) come from `npm run assets`. Don't recolor
or distort it; keep clear space around it. The wordmark pairs the badge with "Roadside" in the
display serif and "Japan" in `sun`.

### Accessibility (non-negotiable)
- Maintain contrast in both themes; `ink`/`canvas` and `sun`/white are checked.
- Every image has meaningful `alt` ("" only if purely decorative).
- Keyboard focus is visible (`:focus-visible` outline in `sun`); there's a skip link.
- Respect `prefers-reduced-motion` (already handled globally).
- Use semantic HTML and `aria-*` where interactive (chips use `aria-pressed`, menus
  `aria-expanded`).

### Responsiveness
Mobile-first; design at 360px width first, enhance up. No user-agent sniffing — breakpoints
only. Tap targets ≥ 40px. The map page uses `100dvh` to handle mobile browser chrome.
