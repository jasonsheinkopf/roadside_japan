# Architecture

## Goals

1. **Static & cheap.** Deployable to GitHub Pages with zero servers or paid infra.
2. **Repository as the database.** Version-controlled, transparent, forkable, AI-editable.
3. **AI-first maintainability.** Conventions, schema, and docs let an agent continue the work
   autonomously for years.
4. **Delightful & fast on any device.** Mobile-first, installable, offline-capable.

## High-level picture

```
                       ┌──────────────────────── BUILD (Astro, static) ───────────────────────┐
 Markdown content ───▶ │  content.config.ts (Zod validate)  →  lib/content.ts (publish gate,   │
 src/content/**        │  IndexRecord)  →  pages/components (SSG)  →  dist/ (HTML/CSS/JS/JSON)   │
 src/data (vocab)      └───────────────────────────────────────────────────────────────────────┘
                                                   │ deploy (GitHub Actions)
                                                   ▼
                                         GitHub Pages (static)
                                                   │
        ┌──────────────────────────────────────────┼───────────────────────────────────────┐
   Browsing/SEO (pre-rendered HTML)        Client islands (vanilla TS)              PWA shell
   homepage, detail, listings        Explore filters · Map (Leaflet) · Search       manifest + sw.js
                                     · Random — all read /api/attractions.json       (offline)

   Intake (no servers):  GitHub Issue Forms → review queue → merged into src/content/
   Curation (local):     tools/agent (Ollama/OpenAI/Anthropic/Gemini) → drafts entries → PR
```

## Layers

### 1. Data (authoring) — `src/content/`, `src/data/`
Markdown + YAML frontmatter, one file per place. Controlled vocabulary (enums, prefectures,
tags, categories) is single-sourced in `src/data/` and consumed by the schema, the UI, and
the AI agent alike.

### 2. Contract & gate — `src/content.config.ts`
Zod schemas validate every entry during `astro sync`/`build`. Invalid data fails the build,
so the published site is always schema-correct. This is the project's quality backbone.

### 3. Transform — `src/lib/content.ts` (server-only)
The single place that touches `astro:content`. It enforces the **publish gate**
(`approval === 'published'`), and flattens rich entries into `IndexRecord` — the lean,
client-facing shape (`src/lib/types.ts`). Also provides `nearest()`, `getRelated()`,
`getFeatured()`, `getNewest()`, comments.

### 4. Render — `src/pages/`, `src/components/`, `src/layouts/`
Astro statically renders every route: homepage, `/explore`, `/map`, `/attractions/[slug]`,
`/events/[slug]`, `/prefectures/*`, `/tags/[tag]`, `/seasons/*`, plus `submit`, `about`,
`admin`, `random`, `404`. `DetailLayout` and `CollectionPage` keep pages thin. `BaseLayout`
owns the head, SEO, OG, JSON-LD, and PWA wiring.

### 5. Endpoints — `src/pages/api/*.json.ts`, `rss.xml.ts`, `sitemap.xml.ts`, `manifest.webmanifest.ts`
Statically generated JSON/XML. `/api/attractions.json` is the canonical read feed that all
client islands consume. See `docs/API.md`.

### 6. Client islands — `src/scripts/`, page `<script>` blocks
Vanilla TypeScript (no UI framework — keeps bundles tiny and idioms simple). They reuse the
**isomorphic** `src/lib/` modules (`filters.ts`, `search.ts`, `format.ts`), so filter logic
is identical on server and client. Data comes from an embedded JSON blob or
`/api/attractions.json` via `src/scripts/data.ts`.

### 7. AI agent — `tools/agent/`
A local Node tool (run via `node --experimental-strip-types`). Provider abstraction over
Ollama/OpenAI/Anthropic/Gemini; a research agent that drafts schema-valid entries; a CLI; and
a local server backing the `/admin` chat. It writes files and you commit/PR them — keys and
compute stay on your machine. See `docs/AI_AGENTS.md`.

## Search

`src/lib/search.ts` defines a `SearchProvider` interface. Today's implementation is
`FuseSearch` (client-side fuzzy search over the JSON feed — instant, free, offline). The
interface is the seam for the roadmap's **semantic/vector search**: a future provider
(embeddings + cosine similarity, or a hosted vector index built at deploy time) can implement
the same interface without changing callers.

## Map

`src/scripts/leaflet-map.ts` is the one map engine, used by both the mini-map on detail pages
(`MapView.astro`) and the full `/map` page. Tiles from OpenStreetMap (no key, attribution
included), custom emoji `DivIcon` markers (avoids broken default-marker images and looks
on-brand), and `markercluster` for a readable all-Japan view.

## PWA & offline

`BaseLayout` links a generated `manifest.webmanifest` (base-path-aware) and registers
`public/sw.js` — a runtime cache (network-first navigations, stale-while-revalidate assets +
data). Pages you've visited work offline; deeper precaching is on the roadmap.

## Build & deploy

`npm run build` → `dist/`. `.github/workflows/deploy.yml` builds on push to `main` and
publishes to GitHub Pages. `SITE_URL`/`SITE_BASE` (env or repo variables) make the same code
deploy to a project site, a user site, or a custom domain. See `docs/DEPLOYMENT.md`.

## Scaling notes (when the atlas grows)

- **Search/map at thousands of entries:** switch islands from embedded JSON to fetching
  `/api/attractions.json` (already supported by `data.ts`), add pagination to Explore, and
  consider building a Pagefind index or a vector index at deploy time.
- **Images:** entries currently use gradient placeholders or URLs. Introduce `astro:assets`
  optimization and a conventional `public/images/<slug>/` layout when real photos arrive.
- **Comments at volume:** wire `PUBLIC_COMMENTS_ENDPOINT` to a serverless function that opens
  PRs, or adopt a GitHub-Discussions widget. The data model (file-per-comment) already
  supports moderation and removal.
