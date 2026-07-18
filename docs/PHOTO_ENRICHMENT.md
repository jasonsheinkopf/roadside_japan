# Photos & the Cinnamon scene

Every entry gets **two visuals**, no exceptions:

1. **A real photo** as the hero — found and verified through the pipeline below.
2. **A Cinnamon scene** — a unique vector vignette of Cinnamon "doing the thing" at that
   place, with a hand-written funny quote (`cinnamon:` frontmatter → `CinnamonScene.astro`).
   When no licensed photo can be verified, the scene **is** the hero, so no page ever
   falls back to a bare gradient.

This is part of entry creation, not an afterthought: **no new entry ships without
running the photo pipeline and writing a `cinnamon` block.**

## The photo pipeline (proven to work from the agent environment)

Direct HTTP to Wikipedia/Commons/image APIs is blocked by the environment's network
policy (403 at the proxy — this includes WebFetch). The method that works:

### 1. Search Wikimedia Commons via scoped WebSearch

For each entry, run a WebSearch with `allowed_domains: ["commons.wikimedia.org"]` and a
query naming the place plus its visual hook (e.g. `Carhenge Alliance Nebraska`,
`"File:" "Lucy the Elephant" jpg` — the `"File:"` prefix trick surfaces file pages when
plain queries only return categories).

**Accept a result only if the `File:` name unambiguously names the exact place.** A bare
`Category:` page is not enough on its own; a near-match or generic subject photo is a
skip. Skipping is fine — that's what the Cinnamon-scene hero is for. Roughly a third of
obscure entries (food stalls, small shops) have no usable Commons file; don't force it.

### 2. Build the image URL deterministically — no API needed

Wikimedia's storage path is computable from the filename (MD5 hash path scheme):

```js
const crypto = require("crypto");
function commonsUrls(fileTitle, width = 960) {
  let name = fileTitle.replace(/^File:/i, "").trim().replace(/ /g, "_");
  name = name.charAt(0).toUpperCase() + name.slice(1);
  const md5 = crypto.createHash("md5").update(name, "utf8").digest("hex");
  const d1 = md5[0], d2 = md5.slice(0, 2);
  const enc = encodeURIComponent(name);
  return {
    thumb: `https://upload.wikimedia.org/wikipedia/commons/thumb/${d1}/${d2}/${enc}/${width}px-${enc}`,
    original: `https://upload.wikimedia.org/wikipedia/commons/${d1}/${d2}/${enc}`,
    page: `https://commons.wikimedia.org/wiki/File:${enc}`,
  };
}
```

Use the **960px thumb** as `heroImage`, with `credit: "Photo via Wikimedia Commons"` and
`creditUrl` = the file page. **Do not also copy that same image into `photos[]`** — the hero
already shows it, and "Cinnamon's camera roll" (`photos[]`) is for genuinely *additional*
pictures, not a second copy of the hero. Only add to `photos[]` if you verified a second,
different Commons image of the place. Non-ASCII filenames are fine (MD5 over UTF-8 bytes) —
but only use filenames you can copy exactly; never transcribe from memory.

### 3. Broken-image safety net

Every remote `<img>` uses `IMG_ONERROR` (`src/lib/format.ts`): if a Commons *thumb* 404s
it retries the original file URL; anything else failing hides the img so the layout's
fallback shows. Never remove this from image-rendering components.

### Source priority

1. **Wikimedia Commons** (default — free licenses, credit page per file, searchable via
   scoped WebSearch).
2. Official press/tourism assets explicitly offered for reuse (link the terms page in
   `creditUrl`).
3. Photos submitted by the community contributor themselves (credit them by name).
4. **Nothing** → the Cinnamon scene carries the page. Never hotlink blogs, socials, or
   Google Images results.

## The Cinnamon scene (`cinnamon:` frontmatter)

```yaml
cinnamon:
  quote: "A pink tower with a dragon wrapped around all 17 floors. You can walk INSIDE the dragon. I did. Twice."
  emoji: "🐉"
```

- `quote` — one hand-written line in Cinnamon's voice **about this specific place**:
  first-person, playful, concrete (mention the thing he did/saw), no generic filler.
  Reading the site's quotes in a row should feel like one small squirrel's very full
  travel diary. See `docs/STYLE_GUIDE.md` for voice.
- `emoji` — the single emoji for the thing he's engaging with in the scene (🛕 🍜 👽 …).
  Pick the *place's* icon, not a face.

`CinnamonScene.astro` renders these with a deterministic per-slug pose (flip/tilt/prop
size + background hue), so every entry's scene is unique without hand-drawn art. It
appears as a "🐿️ Cinnamon was here" postcard on every detail page, and doubles as the
hero when there's no photo. The component has category-based fallback quotes, but those
are a safety net — writing the real quote is part of authoring the entry.

## Batch process for agents

For every new or photo-less entry:

1. Identify the visual hook; run the scoped Commons search (step 1).
2. Verified `File:` name → compute URLs → set `heroImage` + prepend `photos[]` with
   credit; no verified file → skip photo, the scene becomes the hero.
3. Write the `cinnamon` block (always).
4. Bump `updatedAt`; run `npm run data:validate && npm run build`.

## Review quote rule

Do not paste visitor-review text into entries unless short, attributed, and legally
safe. Prefer synthesized patterns: "Many visitors recommend arriving before noon…"
