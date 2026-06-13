# CLAUDE.md

This project is developed primarily by AI agents. **Read [`AGENTS.md`](./AGENTS.md) first** —
it is the canonical operating manual (conventions, repo map, common tasks, verification).

Quick reminders:

- The repository **is** the database. Content = Markdown in `src/content/`, validated by
  `src/content.config.ts`. The build fails on invalid data — that's the quality gate.
- Only `approval: published` entries are public.
- Use `src/lib/url.ts` helpers for links (the site may run under a `/roadside_japan/` base).
- Keep `src/lib/*` isomorphic (no `astro:content`/Node imports); server-only code is in
  `src/lib/content.ts`.
- Verify with `npm run data:validate && npm run check && npm run build`.

Full docs index is in [`README.md`](./README.md#-documentation).
