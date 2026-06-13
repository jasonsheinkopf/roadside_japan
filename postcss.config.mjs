/**
 * Tailwind CSS v4 is wired through PostCSS rather than the @tailwindcss/vite plugin.
 *
 * WHY: Astro 6 ships Rolldown-based Vite, whose resolver plugin is currently incompatible
 * with @tailwindcss/vite (it throws "Missing field `tsconfigPaths`"). The PostCSS path is
 * stable and produces identical output. If you later upgrade and want the Vite plugin back,
 * re-add tailwindcss() to astro.config.mjs and delete this file. See docs/DECISIONS.md.
 */
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
