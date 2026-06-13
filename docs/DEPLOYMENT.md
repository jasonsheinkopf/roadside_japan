# Deployment

The site is static (`dist/`) and ships with a GitHub Actions workflow that builds and
publishes to GitHub Pages on every push to `main`.

## TL;DR (project site)

1. Push to GitHub.
2. **Settings → Pages → Source → GitHub Actions.**
3. Push to `main`. Live at `https://<user>.github.io/roadside_japan/`.

The published entry page is `dist/index.html` (from `src/pages/index.astro`). You don't
configure a single file — the workflow uploads the whole `dist/` folder as the Pages artifact.

## How the base path works

GitHub Pages **project** sites serve under `/<repo>/`, so the app must know its base path or
every link 404s. `astro.config.mjs` reads it from env:

```js
site: process.env.SITE_URL  ?? "https://jasonsheinkopf.github.io"
base: process.env.SITE_BASE ?? "/roadside_japan"
```

The workflow sets these automatically from the GitHub context:

```yaml
SITE_URL:  https://<owner>.github.io
SITE_BASE: /<repo>
```

All internal URLs are built with `withBase()` (`src/lib/url.ts`), so they're correct under
any base.

## Custom domain or `<user>.github.io` repo

Here the base path must be `/`. Set **repository variables** (Settings → Secrets and variables
→ Actions → *Variables*):

| Variable    | Value                       |
| ----------- | --------------------------- |
| `SITE_BASE` | `/`                         |
| `SITE_URL`  | `https://your-domain.com` (or `https://<user>.github.io`) |

For a custom domain, also:
- Add `public/CNAME` containing just the domain (e.g. `roadsidejapan.com`).
- Configure DNS per GitHub's docs and set the domain under Settings → Pages.

## Optional build variables

| Variable                   | Purpose |
| -------------------------- | ------- |
| `PUBLIC_COMMENTS_ENDPOINT` | If set, the comment form POSTs here (no-login, in-page) instead of opening a GitHub issue. Must be `PUBLIC_`-prefixed to reach the browser. |

## Local production check

```bash
npm run build && npm run preview
```

Or simulate a custom-domain build:

```bash
SITE_BASE=/ SITE_URL=https://example.com npm run build
```

## Alternative: deploy from a branch

If you prefer not to use the Actions method, build locally and publish `dist/` to a
`gh-pages` branch (e.g. with the `gh-pages` npm tool), then set Pages → Source → *Deploy from a
branch* → `gh-pages` / root. A `public/.nojekyll` file is included so the `_astro/` directory
isn't stripped by Jekyll.

## Troubleshooting

| Symptom | Fix |
| ------- | --- |
| CSS/links/images 404 in production | Base path mismatch. Confirm `SITE_BASE` matches how Pages serves the site, and that links use `withBase()`. |
| Blank map | Network blocked OpenStreetMap tiles, or the container had zero height at init (the engine calls `invalidateSize`). Check the console. |
| Build fails on content | A frontmatter field violates the schema — read the error; it names the file and field. Fix the data. |
| `npm ci` fails in CI | Commit an up-to-date `package-lock.json`. |
| Pages shows old content | Check the Actions run succeeded; Pages caches briefly. |
