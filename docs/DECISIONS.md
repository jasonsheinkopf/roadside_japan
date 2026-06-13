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

### 6. Leaflet + OpenStreetMap
**Why:** No API key, no billing, open data. Robust clustering via `markercluster`.
**Trade-offs:** Raster tiles look less slick than vector. Custom emoji markers sidestep
Leaflet's notorious bundler-broken default-marker images.

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
