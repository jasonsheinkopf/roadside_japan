# Decisions (ADR log)

Why things are the way they are. Append new decisions; don't silently reverse old ones —
add a superseding entry. Format: **Decision · Why · Trade-offs**.

---

### 1. Astro 6, static output
**Why:** Content-first, ships almost no JS by default, first-class typed Content Collections,
and trivially hostable on GitHub Pages. Ideal for an SEO-friendly, mostly-static atlas.
**Trade-offs:** Dynamic features (comments, AI) need progressive/offline patterns rather than
a server — which fits the "repo as database, no infra" goal anyway.

### 2. Repository **is** the database (Markdown + YAML, validated by Zod)
**Why:** Version control = free history, diffs, review, rollback, and forking. Markdown is the
most AI- and human-editable format. Zod (`content.config.ts`) makes the build fail on bad
data, so quality is enforced mechanically.
**Trade-offs:** No ad-hoc queries/transactions; large-scale relational needs would require
rethinking. Not a concern at this project's scale or ambition.

### 3. TypeScript everywhere
**Why:** Types are documentation an agent can't ignore; catches whole classes of errors.

### 4. Tailwind CSS v4 via **PostCSS** (not the Vite plugin)
**Why:** Astro 6 ships Rolldown-based Vite, whose resolver is currently incompatible with
`@tailwindcss/vite` (`Missing field tsconfigPaths`). `@tailwindcss/postcss` produces identical
output and is stable. **Trade-offs:** One extra config file (`postcss.config.mjs`). Revisit if
the Vite plugin gains Rolldown support.

### 5. Vanilla-TS client islands (no React/Vue/Svelte)
**Why:** The interactivity (filters, map, search, random) is light. Vanilla TS via Astro
`<script>` keeps bundles tiny, avoids a framework runtime, and is the simplest idiom for an
agent to extend. **Trade-offs:** Manual DOM wiring; acceptable at this complexity.

### 6. Leaflet + Esri World Street Map (OpenStreetMap fallback)
**Why:** No API key, no billing, open data. Robust clustering via `markercluster`. Esri's
World Street Map is the primary tile layer instead of OpenStreetMap's default tiles because
Esri labels the entire world in English/Latin script; OSM's default raster tiles label each
region in its local script (Japanese place names for a site whose content is in English),
which read as a mismatch. OSM tiles are kept as an automatic fallback if Esri's tiles fail to
load repeatedly (CSP block, outage), so the map degrades to local-script labels rather than
going blank. **Trade-offs:** Raster tiles look less slick than vector. Custom emoji markers
sidestep Leaflet's notorious bundler-broken default-marker images. Esri's tile coordinate
order is `{z}/{y}/{x}`, not OSM's `{z}/{x}/{y}` — easy to get backwards when editing.

### 7. Fuse.js behind a `SearchProvider` interface
**Why:** Instant client-side fuzzy search with zero infra, and an explicit seam so semantic/
vector search can be added later without touching callers.

### 8. Emoji icons + generated gradient placeholders (instead of image files)
**Why:** Zero asset weight, never a broken image, renders on every platform, and keeps the
repo light. Real photos can be added per entry whenever available.

### 9. GitHub Issue Forms + Actions for intake (submissions & comments)
**Why:** True zero-infra, spam-resistant (GitHub's gate), human-moderatable, and keeps the
repository the single source of truth. **Trade-offs:** The frictionless path nudges users to
GitHub at the final step. An optional `PUBLIC_COMMENTS_ENDPOINT` enables fully no-login,
in-page posting when the owner wires a form service/Worker.

### 10. AI agent is a **local tool**, not a hosted service
**Why:** API keys and cost stay on the maintainer's machine; the public site stays static and
safe. The agent edits the repo directly and proposes PRs — exactly the intended human-approval
workflow. **Trade-offs:** The `/admin` chat only reaches the agent when run locally (it can't
call `localhost` from the deployed site) — documented and expected.

### 11. Providers via raw `fetch` (no vendor SDKs)
**Why:** Keeps dependencies minimal, makes the abstraction obvious, and means adding a
provider is one small file. Node 22's global `fetch` is enough.

### 12. `IndexRecord` split (authoring shape vs client shape)
**Why:** Authoring frontmatter is rich/nested; the browser only needs a lean flat object.
`toIndexRecord()` is the one boundary, which also defines exactly what ships to clients.

### 13. Environment-driven `site`/`base`
**Why:** One codebase deploys to a project site (`/roadside_japan`), a user site, or a custom
domain by setting `SITE_URL`/`SITE_BASE`. All internal URLs go through `withBase()` so nothing
breaks under a sub-path.

### 14. PWA (manifest + runtime-caching service worker)
**Why:** Travelers often have patchy signal; an installable, offline-capable app is a real
win. Started simple (runtime cache); deeper precaching is on the roadmap.

### 15. npm (not pnpm/yarn)
**Why:** Most universal, simplest for CI and for agents; `package-lock.json` enables
reproducible `npm ci` in the deploy workflow.

### 16. Upgraded Astro 5 → 6 early
**Why:** Astro 5's bundled Vite/esbuild carried (dev-server-only) advisories fixed in Astro 6.
Done before writing app code to avoid churn. Remaining transitive esbuild advisories affect
only the dev server, not the static build or deployed site.

### 17. Seasonality as a first-class, derived dimension (Timeline + Availability filter)
**Why:** A lot of the best entries are time-bound (blooms, illuminations, snow, festivals),
but seasonality was scattered across `seasons`, `months`, and event `startDate`/`endDate`.
Rather than add a field, two pure helpers in `lib/filters.ts` *derive* the truth from what's
already there: `isSeasonal(r)` (is this on a clock at all?) and `activeMonths(r)` (which months
1–12 is it active — expanding event date windows and season tuples to months). Those feed an
**Availability** filter group (Seasonal / Year-round, automatic in Explore + Map) and a new
`/timeline` "When to go" planner — a server-rendered Gantt of the year, enhanced client-side
with month filtering. **Trade-offs:** `activeMonths` collapses to a Jan→Dec linear axis (a
winter window shows as Dec + Jan–Feb rather than wrapping); fine for a year planner, and no
new data to author or keep in sync.

### 18. Map "When are you visiting?" trip-date filter
**Why:** The headline use case is *"I land on these dates — what can I actually catch?"* The
Map now takes an **arriving / leaving** date range and shows only records active in that
window, plus a *Seasonal only* toggle (which simply drives the existing `seasonal` Availability
filter, so there's one source of truth). The logic is one isomorphic helper,
`matchesDateRange(r, from, to)` in `lib/filters.ts`: year-round places always pass; **events**
overlap at **day** precision (annual events are projected onto the trip's year(s) by month/day,
handling New-Year wrap; one-time/irregular use literal dates); **seasonal attractions** overlap
at **month** precision via the existing `matchesMonth`. This needed `recurrence` on
`IndexRecord` (populated in `toIndexRecord`) so the client can tell annual from one-time. State
is URL-encoded (`?from=&to=`) so a planned window is shareable/bookmarkable. **Trade-off:**
attraction matching is month-granular (a peak-in-April bloom matches any April visit), which is
the right resolution for fuzzy "best months" data; events, which carry exact dates, are precise.

### 19. "Add it with ChatGPT" submission deep-link
**Why:** The lowest-friction way to submit from a phone, with **no backend, no API keys, and
no custom GPT** (so it works for anyone with any ChatGPT account, free or paid). `/submit`
deep-links to `https://chatgpt.com/?q=<prompt>` with a prompt that briefs ChatGPT as a
submission assistant: it interviews the visitor, then returns a one-tap, prefilled
`issues/new?labels=submission&...` GitHub link in the **exact** body format the website form
produces — so AI- and form-sourced submissions land in the same review queue, identically
shaped. The valid `CATEGORIES` are injected into the prompt so ChatGPT can't pick an invalid
one. Nothing weakens the publish gate: it still creates a `pending` issue a maintainer reviews.
