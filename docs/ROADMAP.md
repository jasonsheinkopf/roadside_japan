# Roadmap

Directional, not a contract. Reorder freely as the project's needs become clear. ✅ = done in
the current foundation.

## Phase 0 — Foundation ✅
- ✅ Astro + TypeScript + Tailwind v4 design system, dark mode, PWA.
- ✅ Schema-validated content collections (attractions, events, comments).
- ✅ Homepage, Explore (combinable filters + search), full map, detail pages, listings
  (prefecture/tag/season), submit, about, admin, random, 404.
- ✅ Client search (Fuse) behind a `SearchProvider` seam; Leaflet map with clustering.
- ✅ Read API (JSON), RSS, sitemap, manifest.
- ✅ AI research agent: provider abstraction (Ollama/OpenAI/Anthropic/Gemini), CLI, local
  server, admin chat with approve-to-queue.
- ✅ GitHub Pages deploy workflow; Issue Forms intake; seed content across regions/seasons.

## Phase 1 — Content & polish
- Grow to a few hundred quality entries across all 8 regions.
- Real photos: adopt `astro:assets`, a `public/images/<slug>/` convention, and image credits.
- Saved favorites & a simple trip list (localStorage; no accounts).
- "Near me" using the Geolocation API on the map.
- Per-entry redirects when slugs change.

## Phase 2 — Search & scale
- Switch islands to fetch + paginate when the dataset is large (already supported by
  `data.ts`).
- Build a richer index at deploy time (Pagefind) and/or a **vector/semantic** `SearchProvider`
  (embeddings generated in CI) — the interface already exists in `src/lib/search.ts`.
- Map performance: viewport-based loading for very large sets.

## Phase 3 — The AI crew (multi-agent)
Each new agent is a `tools/agent/agents/<name>.ts` reusing the provider registry:
- **Fact-Checker** — verify claims/coords/hours vs sources; set confidence.
- **Photo Agent** — find openly-licensed images + credits.
- **Duplicate Detector** — flag near-duplicates pre-save.
- **Translator** — Japanese (and more) localizations.
- **SEO Agent** — refine summaries, keywords, structured data.
- **Moderation Agent** — triage the submission/comment queue.
- **Map Agent** — coordinate sanity checks; enrich transit/parking.
- An **orchestrator** that chains them (research → factcheck → photo → dedupe → propose PR).

## Phase 4 — Internationalization
- Japanese UI + content fields (the data model already carries `nameJa` for prefectures).
- Locale routing under the existing base-path strategy.

## Phase 5 — Community & richer comments
- No-login in-page comments via `PUBLIC_COMMENTS_ENDPOINT` (Worker/Formspree) or a
  GitHub-Discussions widget.
- Contributor credits and leaderboards (sourced from `submittedBy`).
- Curated collections / themed routes ("Weird museums of Kansai", "Autumn drives").

## Always-on
- Keep docs in sync with code (it's a rule — see `AGENTS.md`).
- Watch dependency advisories; keep Astro/Tailwind current.
- Accessibility and performance budgets on every new page.
