# AGENTS.md — operating manual for AI agents

You are very likely the one developing this project. This file is your first read. It tells
you how the repo is organized, the rules that keep it healthy, and the exact steps for common
tasks. Keep it accurate: **if you change how something works, update the relevant doc in the
same change.**

---

## 0. Golden rules

1. **The repository is the database.** Content lives as Markdown in `src/content/`. There is
   no external DB or server. Editing the atlas means editing files.
2. **The schema is law.** `src/content.config.ts` (Zod) validates every entry at build time.
   The build *fails* on invalid data. This is intentional — it's the quality gate. Never
   weaken it to push bad data through; fix the data.
3. **Only `approval: published` is public.** Everything else sits in the review queue. Public
   submissions and AI proposals enter as `pending`.
4. **Single source of truth for vocabulary.** Enums (categories, seasons, etc.) are declared
   once in `src/data/vocab.ts`. Never hard-code these strings elsewhere — import them.
5. **Respect the base path.** The site may be served from a sub-path (`/roadside_japan/`).
   Build internal links/asset URLs with the helpers in `src/lib/url.ts` (`withBase`, etc.),
   never with bare string literals.
6. **Keep `src/lib/` isomorphic.** Files there (`filters.ts`, `search.ts`, `format.ts`,
   `types.ts`, `url.ts`) run in both the server build and the browser. Do **not** import
   `astro:content` or Node APIs into them. Server-only code goes in `src/lib/content.ts`.
7. **Verify before you finish.** Run `npm run data:validate` (schema) and `npm run build`
   (full build). Both must pass. Prefer `npm run check` too.
8. **Document the *why*.** Architectural choices go in `docs/DECISIONS.md`.

---

## 1. Tech stack (and where things live)

- **Astro 6** (static output) + **TypeScript** — `astro.config.mjs`, `tsconfig.json`.
- **Tailwind CSS v4** via **PostCSS** (`postcss.config.mjs`, `src/styles/global.css`).
  *Not* the `@tailwindcss/vite` plugin — it's incompatible with Astro 6's Rolldown-Vite
  (see `docs/DECISIONS.md`).
- **Leaflet + Esri World Street Map** for maps (`src/scripts/leaflet-map.ts`) — no API keys.
  Esri tiles label the whole world in English (OpenStreetMap's default tiles label in each
  region's local script, e.g. Japanese for Japan); OSM tiles remain as an automatic fallback.
- **Fuse.js** for client search (`src/lib/search.ts`), behind a `SearchProvider` interface.
- **Content Collections** (`src/content.config.ts`) — `attractions`, `events`, `comments`.

```
src/data/        vocabulary & taxonomy (no Astro imports → safe for agent tooling to import)
  vocab.ts         enums: SEASONS, CATEGORIES, DIFFICULTIES, TIME_REQUIRED, COST_TYPES, …
  countries.ts     countries (flag, tagline, map center/zoom) — the site is browsed one
                   country at a time (header tabs, /countries/<slug>, map zoom, timeline)
  prefectures.ts   Japan's 47 prefectures + Thailand's provinces (slug, region, coords)
  categories.ts    category → {label, emoji, blurb}
  tags.ts          tag slug → {label, icon, group}
  site.ts          site config (repo URL, issue-link helpers)
src/lib/         ISOMORPHIC helpers (browser + server)
  types.ts         IndexRecord (the flattened client shape) + types
  url.ts           withBase() and URL builders — ALWAYS use these
  format.ts        labels, Google Maps links, haversine, placeholders
  filters.ts       the declarative filter ENGINE (predicates over IndexRecord); also the
                   seasonality helpers isSeasonal() + activeMonths() used by /timeline, and
                   matchesDateRange() powering the Map "When are you visiting?" date filter
  search.ts        Fuse search behind SearchProvider (vector search = future impl)
  content.ts       SERVER-ONLY: reads collections, enforces publish gate, builds IndexRecords
src/components/  Astro UI (AttractionCard, MapView, DetailLayout, Comments, CollectionPage…)
src/layouts/     BaseLayout (head/SEO/PWA/header/footer)
src/scripts/     client islands (data.ts loader, leaflet-map.ts)
src/pages/       routes + endpoints (api/*.json, rss.xml, sitemap.xml, manifest.webmanifest)
tools/agent/     AI research agent (providers, agents, cli.ts, server.ts)
tools/build/     gen-assets.ts (logo → icons/OG)
```

---

## 2. The data flow (how a place reaches the screen)

```
src/content/**/*.md  ──(Zod validate)──▶  getCollection()  ──▶  toIndexRecord()  ──▶  IndexRecord
   (authoring shape)        content.config.ts      lib/content.ts        (flat, client-facing)
                                                                              │
                  ┌───────────────────────────────────────────┬─────────────┤
            Astro pages (SSG)                         /api/attractions.json   │
       (cards, detail, listings)                      (the client feed) ──────┘
                                                            │
                                          browser islands: explore filters, map, search, random
```

- **Authoring shape** = full frontmatter (rich, nested). **IndexRecord** = lean flat object
  shipped to the browser; defined in `src/lib/types.ts`, produced by `toIndexRecord()`.
- Filter predicates (`src/lib/filters.ts`) operate on `IndexRecord`, so anything a filter
  needs must be included in `toIndexRecord()`.

---

## 3. Common tasks (do it exactly like this)

### Add an attraction
1. Copy an existing file in `src/content/attractions/` (e.g. `meguro-parasitological-museum.md`).
2. The **filename is the slug** and the URL (`/attractions/<slug>`).
3. Fill the frontmatter per `docs/DATA_MODEL.md`. Set `approval: published` to make it live.
4. **Visuals + voice (required):** find a real hero photo via the pipeline in
   `docs/PHOTO_ENRICHMENT.md` (Wikimedia-Commons-scoped WebSearch → deterministic URL +
   credit; don't duplicate the hero into `photos[]`), and write the entry's full
   `cinnamon: { quote, emoji, report, snapshots }` block per `docs/CINNAMON.md` — the scene
   quote, his first-person field report, AND two camera-roll snapshots (§7, new entries) —
   candid vector vignettes of the cast at the place, no story arc needed. No verified photo
   → a place-representing vector scene (no characters) is the hero automatically; never
   invent or hotlink unlicensed images.
   Use full ISO timestamps for `createdAt`/`updatedAt`.
5. `npm run data:validate` → fix any schema errors → `npm run build`.

### Add a seasonal event
Same, in `src/content/events/`, plus `startDate`, `endDate`, `recurrence`. Events show date
badges and appear on `/events` and the homepage's seasonal section.

### Add a new filter
Add one entry to a group in `FILTER_GROUPS` in `src/lib/filters.ts` with a `predicate`. The
Explore and Map UIs render it automatically. If the predicate needs a field not yet on
`IndexRecord`, add that field in `src/lib/types.ts` **and** populate it in
`toIndexRecord()` (`src/lib/content.ts`).

### Process the community inbox
When the maintainer says "process the inbox" / asks about submissions: follow
**`docs/INBOX.md`** exactly. Short version: open issues labeled `inbox` are unprocessed
free-text notes from visitors; verify every place independently, publish what clears the
bar with `source: community` + the submitter's name, leave the structured triage comment,
label + close the issue, trigger the notify workflow if they left an email. Never process
autonomously *interactively* — only when asked.

**Automated exception:** a Routine runs "process the inbox" unattended, triggered by the GitHub
event of a new issue labeled `inbox` being opened — i.e. instantly, per submission, not on a
schedule. It follows **`docs/AUTONOMOUS_TRIAGE.md`** — a stricter safety gate with three
outcomes (PUBLISH clearly-safe / HOLD borderline as `pending` / REJECT) — and after each run it
authors a LINE report and triggers `line-notify.yml` on demand so the maintainer hears about the
outcome immediately. A daily backstop Action separately checks for anything stuck. Setup and
secrets are in **`docs/NOTIFICATIONS_SETUP.md`**. If you are that automated job, read
`docs/AUTONOMOUS_TRIAGE.md` first.

### Add a country
Add the slug to `COUNTRIES` in `src/data/vocab.ts`, metadata (flag, tagline, map center/zoom)
to `src/data/countries.ts`, and its regions/provinces to `src/data/prefectures.ts` (with
`country:` set). The header tab, `/countries/<slug>` page, Country filter, map zoom, and
timeline chip all derive from those three files. Content entries set `country:` in
frontmatter (defaults to `japan`).

### Add a category
Add it to `CATEGORIES` in `src/data/vocab.ts`, then `CATEGORY_META` in
`src/data/categories.ts` (label + emoji). It flows into the schema enum, filters, and cards.

### Add an AI provider
Implement the `Provider` interface (`tools/agent/providers/types.ts`) in a new file and
register it in `tools/agent/providers/index.ts`. Everything else (CLI, server, admin chat)
picks it up. See `docs/AI_AGENTS.md`.

### Add a new agent (Photo, Fact-checker, …)
Add `tools/agent/agents/<name>.ts` reusing the provider registry + `lib/entry.ts`. Expose it
via the CLI and, if useful, the server. The architecture anticipates this — see
`docs/ROADMAP.md` and `docs/AI_AGENTS.md`.

---

## 4. Conventions & gotchas

- **Emoji over image assets** for category/tag icons and map pins — zero weight, no broken
  images, renders everywhere. Hero "photos" fall back to a deterministic gradient
  (`placeholderStyle`) so the UI never shows a broken image.
- **Client filtering** server-renders all cards, then a `display:contents` wrapper +
  `[hidden]` toggles visibility (see `explore.astro`). `[hidden]{display:none!important}` in
  `global.css` makes that win over `.contents`.
- **Embedded data**: filter/map pages embed the records JSON in a
  `<script type="application/json" is:inline>` and read it via `src/scripts/data.ts` (falls
  back to fetching `/api/attractions.json`). Keep `is:inline` on those.
- **Agent imports**: `tools/` run under `node --experimental-strip-types`, so relative
  imports there use explicit `.ts` extensions (including when importing `src/data/*`). The
  site build uses Astro/Vite resolution (no extensions). Don't "fix" one to match the other.
- **Dark mode** is class-based (`.dark` on `<html>`), bootstrapped before paint in
  `BaseLayout`. Colors are semantic CSS variables mapped to Tailwind tokens — use
  `bg-canvas`, `text-ink`, `text-sun`, etc., not hex.

---

## 5. Verify your work

```bash
npm run data:validate   # content matches the schema
npm run check           # types
npm run build           # full static build (the real gate)
```

For visual/behavioral confirmation, use the repo's `/run` or `/verify` flows, or
`npm run preview` and click through Explore, Map, a detail page, and `/admin`.

---

## 6. Where to write things down

- New capability or structural change → update `docs/ARCHITECTURE.md` + `docs/DECISIONS.md`.
- New/changed field → `docs/DATA_MODEL.md`.
- New agent/provider → `docs/AI_AGENTS.md`.
- User-facing voice/visuals → `docs/STYLE_GUIDE.md`.
- Anything you wish *you* had known starting out → back here, in `AGENTS.md`.
