# Prompts

A library of prompts for the AI agents and for maintainers driving their own coding agent.
Keep working prompts here so good results are reproducible.

## Research Agent (system prompt)

The canonical system prompt lives in code: `tools/agent/agents/research-prompt.ts`. It injects
the controlled vocabulary (categories, seasons, prefecture slugs, example tags) from
`src/data/*` and pins the strict JSON output contract. Edit it there, not here, so the agent
and the docs can't drift.

### Good user queries (discovery)
These map directly to the brief's examples and tend to produce strong candidates:

- `unusual festivals in Hokkaido`
- `giant statues in Kyushu`
- `roadside attractions near Nikko`
- `things that peak in October`
- `weird museums in Osaka`
- `abandoned places in Gunma that are safe to view from outside`
- `tiny local food specialties in Shikoku`
- `scenic detours within 2 hours of Kyoto that tourists skip`
- `winter illuminations outside the big cities`

### Tips for better results
- Add a constraint: a region/prefecture, a season/month, a vibe ("eerie", "wholesome",
  "photogenic"), or an audience ("with kids", "dog-friendly").
- Ask for the overlooked: "…that aren't in guidebooks", "…locals know but tourists don't".
- Lower the temperature for accuracy-sensitive runs; raise it for ideation.
- Always review `sources` and `confidence` before approving; fact-check low-confidence claims.

## Maintainer prompts (driving a coding agent on this repo)

Paste these to an agent working in the repository. They assume the conventions in `AGENTS.md`.

- **Add entries:**
  > "Add 5 attractions in the Tohoku region as `src/content/attractions/*.md`, following the
  > schema in `src/content.config.ts` and the voice in `docs/STYLE_GUIDE.md`. Real places only,
  > with sources. Set `approval: published`. Run `npm run data:validate` and `npm run build`."

- **New filter:**
  > "Add an 'Onsen' filter to the Theme group in `src/lib/filters.ts` matching `category` or the
  > `onsen` tag. Verify it appears on Explore and Map and that the build passes."

- **New provider:**
  > "Implement a Mistral provider in `tools/agent/providers/` per the `Provider` interface and
  > register it. Confirm `npm run agent -- providers` lists it."

- **New agent:**
  > "Create a Fact-Checker agent in `tools/agent/agents/factcheck.ts` that takes a candidate,
  > checks its claims against its sources via the active provider, and returns adjusted
  > confidence + notes. Wire it into the CLI. Update `docs/AI_AGENTS.md`."

## Future agent prompt sketches

Starting points for the planned crew (see `docs/ROADMAP.md`). Move each into its agent's
`*-prompt.ts` when built.

- **Fact-Checker:** "You verify a proposed Roadside Japan entry. Given its claims and sources,
  flag anything unsupported or likely wrong (coordinates, dates, hours, superlatives). Return
  JSON: `{ verdicts:[{claim, status, note}], suggestedConfidence }`. Be skeptical of
  superlatives ('largest', 'only')."
- **Duplicate Detector:** "Given a candidate and a list of existing entries (title, prefecture,
  lat/lng, summary), return likely duplicates with a similarity score and reason. Treat places
  within ~300m and similar names as probable duplicates."
- **Translator:** "Translate this entry's `summary` and body into natural Japanese for a
  Japanese reader, preserving proper nouns and tone. Return the translated fields only."
- **SEO Agent:** "Improve `summary`, `aiKeywords`, and meta for search and social without
  hype, staying truthful and within the style guide. Return only changed fields."
- **Moderation Agent:** "Triage this submission/comment: classify as approve / needs-edit /
  reject / spam with a one-line reason. Be lenient on earnest tips, strict on spam and
  unverifiable claims."
