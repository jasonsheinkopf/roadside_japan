# 🗾 Cinnamon Land!

> **Discover the places most tourists never see.**
> An open, community- and AI-curated atlas of hidden gems, weird attractions, strange
> museums, giant statues, seasonal festivals, scenic detours, and roadside oddities —
> the *Roadside America of Japan*, with a dash of *Atlas Obscura*.

Cinnamon Land is a fast, static website backed by a **Git repository as its database**.
Every place is a small Markdown file validated against a strict schema, so the whole atlas
is transparent, version-controlled, and easy for both humans and AI agents to extend. It is
designed to be **developed primarily by AI agents** over a long horizon — read
[`AGENTS.md`](./AGENTS.md) first if you are one.

![Cinnamon Land](./public/og.png)

---

## ✨ What's inside

- **Interactive map** of all of Japan (Leaflet + Esri World Street Map, English labels
  worldwide, no API keys — OpenStreetMap tiles as automatic fallback).
- **Excellent filtering** — combine season, theme, cost, effort, duration, accessibility,
  and vibe filters; everything is shareable via the URL.
- **Seasonal feature** — filter by the current month, a season, or a specific window. Many
  discoveries only exist for a few weeks a year.
- **Rich attraction pages** — hero, story, "need to know" panel, photos, embedded map,
  related & nearby places, comments, AI summary, and structured data for SEO.
- **Public submissions & comments** — no account required (GitHub Issue Forms intake).
- **AI research assistant** — chat to find candidate places; it drafts schema-valid entries
  with sources and a confidence score for human approval. Works with Ollama, OpenAI,
  Anthropic, or Gemini behind one provider abstraction.
- **Mobile-first & installable** — responsive on phone/tablet/desktop and a PWA you can add
  to a home screen with offline support (great for travelers with patchy signal).

---

## 🚀 Quickstart

Requires **Node 20+** (Node 22 recommended).

```bash
npm install      # install dependencies
npm run dev      # start the dev server → http://localhost:4321/roadside_japan/
npm run build    # build the static site to dist/
npm run preview  # preview the production build locally
```

> **Heads up — the base path.** In development and on a GitHub Pages *project site*, the app
> is served under `/roadside_japan/` (not `/`). That's expected. See
> [Deploying](#-deploying-to-github-pages) to change it for a custom domain.

---

## 🌐 Deploying to GitHub Pages

**You do not point GitHub Pages at a single file.** Astro compiles the site into a `dist/`
folder (whose entry page is `dist/index.html`, generated from `src/pages/index.astro`), and a
GitHub Action publishes that folder. It's already wired up:

1. Push this repo to GitHub (the `main` branch is the deploy branch).
2. In the repo, go to **Settings → Pages → Build and deployment → Source** and choose
   **GitHub Actions**.
3. That's it. Every push to `main` runs [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml),
   which builds the site and deploys it. Your site appears at:

   ```
   https://<your-username>.github.io/roadside_japan/
   ```

   The homepage served there is `dist/index.html`.

### Using a custom domain or a `<user>.github.io` repo

The base path must become `/` instead of `/roadside_japan`. Set two **repository variables**
(Settings → Secrets and variables → Actions → *Variables*):

| Variable    | Value                                   |
| ----------- | --------------------------------------- |
| `SITE_BASE` | `/`                                     |
| `SITE_URL`  | `https://your-domain.com`               |

For a custom domain, also add a `public/CNAME` file containing the domain. Full details and
the "deploy from a branch" alternative are in [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md).

---

## 📱 Mobile & desktop

The site is **responsive and mobile-first** — the same markup adapts to phone, tablet, and
desktop via CSS breakpoints (we deliberately do **not** sniff the user agent, which is more
reliable). It also ships a **Web App Manifest** and a **service worker**, so on a phone you
can "Add to Home Screen" and get an app-like, offline-capable experience. Try it: open the
site on your phone and add it to your home screen.

---

## 🗂️ Project structure

```
roadside_japan/
├─ src/
│  ├─ content/            # THE DATABASE — markdown entries (the source of truth)
│  │  ├─ attractions/     #   permanent-ish places
│  │  ├─ events/          #   seasonal / time-bound happenings
│  │  └─ comments/        #   moderated visitor comments
│  ├─ content.config.ts   # Zod schema — the data contract & validation gate
│  ├─ data/               # controlled vocabulary (categories, tags, prefectures, …)
│  ├─ lib/                # isomorphic helpers (content, filters, search, format, url)
│  ├─ components/         # Astro UI components (cards, map, detail, comments, …)
│  ├─ layouts/            # BaseLayout (head, SEO, PWA, header/footer)
│  ├─ scripts/            # client-side islands (map, data loader)
│  ├─ pages/              # routes + JSON/RSS/sitemap endpoints
│  └─ styles/global.css   # Tailwind v4 design system
├─ tools/
│  ├─ agent/              # AI research agent: providers, CLI, local server
│  └─ build/gen-assets.ts # rasterizes the logo into favicons/PWA icons/OG image
├─ public/                # static assets (logo, icons, manifest, sw.js)
├─ .github/               # Pages deploy workflow + issue forms
└─ docs/                  # architecture, data model, decisions, roadmap, …
```

---

## 🧰 npm scripts

| Script                 | What it does                                                        |
| ---------------------- | ------------------------------------------------------------------- |
| `npm run dev`          | Dev server with hot reload                                          |
| `npm run build`        | Build the static site to `dist/`                                    |
| `npm run preview`      | Serve the built site locally                                        |
| `npm run check`        | Type-check (`astro check`)                                          |
| `npm run data:validate`| Validate all content against the schema (`astro sync`)              |
| `npm run agent -- …`   | AI research agent CLI (see below)                                   |
| `npm run agent:server` | Start the local agent server that powers the `/admin` chat          |
| `npm run assets`       | Regenerate favicons / PWA icons / OG image from the SVG logo        |

---

## ➕ Adding a discovery

Create a Markdown file in `src/content/attractions/` (or `events/`). The frontmatter must
satisfy the schema in `src/content.config.ts` — the build **fails** on invalid data, which is
how bad entries are kept out. Copy an existing entry as a template and read
[`docs/DATA_MODEL.md`](./docs/DATA_MODEL.md) for every field.

Don't want to touch code? Use the on-site [**Submit**](src/pages/submit.astro) form or the
GitHub Issue Form — both feed a review queue.

---

## 🤖 AI research assistant

```bash
cp .env.example .env                 # add a provider key (or just run Ollama locally)
npm run agent -- providers           # see what's available
npm run agent -- research "giant statues in Kyushu" --save
```

Or use the chat UI: `npm run agent:server` then open `/admin` in `npm run dev`. The assistant
proposes schema-valid entries with sources & confidence; you approve, and they're written to
the repo as `pending` for review. Details in [`docs/AI_AGENTS.md`](./docs/AI_AGENTS.md).

---

## 📚 Documentation

| Doc | Purpose |
| --- | --- |
| [`AGENTS.md`](./AGENTS.md) | **Start here if you're an AI agent.** Conventions & how-tos. |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md) | How submissions become published entries. |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | System design & data flow. |
| [`docs/DATA_MODEL.md`](./docs/DATA_MODEL.md) | Every field, with authoring guidance. |
| [`docs/DECISIONS.md`](./docs/DECISIONS.md) | Why the stack & structure are what they are. |
| [`docs/API.md`](./docs/API.md) | The internal read API + write contracts. |
| [`docs/AI_AGENTS.md`](./docs/AI_AGENTS.md) | Provider abstraction & the agent workflow. |
| [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) | Hosting on GitHub Pages & custom domains. |
| [`docs/MODERATION.md`](./docs/MODERATION.md) | Approving, editing, removing content. |
| [`docs/INBOX.md`](./docs/INBOX.md) | The public drop box + the AI triage protocol. |
| [`docs/STYLE_GUIDE.md`](./docs/STYLE_GUIDE.md) | Content voice + visual design language. |
| [`docs/ROADMAP.md`](./docs/ROADMAP.md) | What's next, including future agents. |
| [`docs/PROMPTS.md`](./docs/PROMPTS.md) | Reusable prompts for the AI agents. |

---

## 📄 License

Code: **MIT**. Atlas content (`src/content/`): **CC BY-SA 4.0**. Map data: **© OpenStreetMap
contributors**. See [`LICENSE`](./LICENSE).

*A passion project, not a tour company.*
