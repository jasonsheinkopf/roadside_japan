# Contributing

Roadside Japan grows through people who notice the odd sign, the tiny museum, the festival
nobody wrote about. There are three ways in — pick whichever fits.

## 1. Suggest a place (no coding)

- Use the on-site **[Submit](https://jasonsheinkopf.github.io/roadside_japan/submit)** form, or
- Open a **[Submission issue](https://github.com/jasonsheinkopf/roadside_japan/issues/new?labels=submission)**.

Tell us what it is, why it's worth the detour, roughly where it is, and (if seasonal) when.
A maintainer or an AI agent verifies and enriches it before it's published.

## 2. Comment / correct (no coding)

Use the comment box on any place's page, or a
**[Comment issue](https://github.com/jasonsheinkopf/roadside_japan/issues/new?labels=comment)**.
Comments are reviewed before they appear.

## 3. Add or edit entries directly (a little Git)

```bash
git clone https://github.com/jasonsheinkopf/roadside_japan
cd roadside_japan && npm install && npm run dev
```

1. Copy an existing file in `src/content/attractions/` (or `events/`). **Filename = slug = URL.**
2. Fill the frontmatter per [`docs/DATA_MODEL.md`](./docs/DATA_MODEL.md). Set
   `approval: published` to make it live (leave `pending` to queue it).
3. Validate and build:
   ```bash
   npm run data:validate   # schema check (must pass)
   npm run build           # full build (must pass)
   ```
4. Open a pull request.

### What makes a good entry

Read [`docs/STYLE_GUIDE.md`](./docs/STYLE_GUIDE.md). In short: it should make a reader think
*"I had no idea this existed."* Be specific, vivid, and honest; prefer the overlooked over the
obvious; include practical "need to know" details and at least one source for facts.

### PR checklist

- [ ] `npm run data:validate` and `npm run build` pass.
- [ ] Coordinates are correct (drop a pin in Google Maps to confirm).
- [ ] `summary` is punchy and ≤ 280 chars; `category` and `tags` are accurate.
- [ ] Seasonality (`seasons`/`months`/`seasonNote`) set if relevant.
- [ ] Facts have a `source`; images have `alt` and credit.
- [ ] If you changed code/behavior, you updated the relevant doc.

## Using AI to help

Maintainers can have the AI research assistant draft entries (with sources + confidence) for
review — see [`docs/AI_AGENTS.md`](./docs/AI_AGENTS.md). AI-drafted entries always enter as
`pending` and need a human to publish.

## Conduct

Be kind, be accurate, respect local communities and private property, and don't add anything
you wouldn't want a stranger doing at your own neighborhood's hidden gem.

## License

By contributing you agree that code is licensed **MIT** and content is licensed
**CC BY-SA 4.0** (see [`LICENSE`](./LICENSE)).
