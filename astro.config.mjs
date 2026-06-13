// @ts-check
import { defineConfig } from "astro/config";

/**
 * Site + base path are environment-driven so the same codebase deploys to:
 *   1. A GitHub Pages PROJECT site:  https://<user>.github.io/roadside_japan/  (default)
 *   2. A custom domain / user site:  https://example.com/        (set SITE_BASE=/)
 *
 * The deploy workflow (.github/workflows/deploy.yml) sets these automatically.
 * See docs/DEPLOYMENT.md for details.
 */
const SITE = process.env.SITE_URL ?? "https://jasonsheinkopf.github.io";
const BASE = process.env.SITE_BASE ?? "/roadside_japan";

// https://astro.build/config
export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: "ignore",
  // Static output — deployable to GitHub Pages with zero server infrastructure.
  output: "static",
  build: {
    format: "directory",
  },
});
