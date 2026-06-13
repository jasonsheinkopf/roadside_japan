# Photo enrichment workflow

Roadside Japan should show real visual context, but it should not copy random images from the web into the repository.

## Safe default

For each entry, add remote image metadata only when the image has a clear reuse path and attribution target.

Good sources:

- Wikimedia Commons files with an explicit license page.
- Official tourism websites when they explicitly provide reusable press assets.
- Photos submitted by the traveler or community contributor.

Avoid:

- Copying Google Images results.
- Hotlinking travel blog photos without permission.
- Long verbatim review quotes.

## Entry fields

Use the existing fields in `src/content.config.ts`:

```yaml
heroImage: "https://..."
photos:
  - src: "https://..."
    alt: "Useful, specific description of the image"
    credit: "Photographer or source"
    creditUrl: "https://license-or-file-page"
sources:
  - title: "Official site or reliable reference"
    url: "https://..."
tips:
  - "Practical synthesized tip, not a copied review."
```

## Curation rule

The hero image should answer one question quickly: why would someone care about this place?

Prefer images that show the core roadside hook:

- the giant object,
- the strange museum interior,
- the best seasonal look,
- the approach or scale,
- the thing people actually detour for.

## Review quote rule

Do not paste review text directly unless it is short, attributed, and legally safe. Prefer synthesized patterns:

- "Many visitors recommend arriving before noon because the parking lot fills quickly."
- "Several reports mention that the final trail section is icy in winter."
- "Recent visitors say the cafe can sell out early on weekends."

## Batch process for agents

For every attraction or event:

1. Read the entry and identify the visual hook.
2. Search official sites, Wikimedia Commons, and reputable tourism pages.
3. Pick one hero candidate and optionally one to three gallery candidates.
4. Add `heroImage`, `photos`, `sources`, and synthesized `tips`.
5. Update `updatedAt`.
6. Run `npm run data:validate` and `npm run build` before merging.

If the image license is uncertain, leave the image out and add only source links and tips.
