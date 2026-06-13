# Data Model

The atlas is a set of Markdown files with YAML frontmatter, validated by Zod in
[`src/content.config.ts`](../src/content.config.ts). That file is the **authoritative**
contract; this document is the human-readable companion. If they ever disagree, the schema
wins — and you should fix this doc.

There are three collections:

| Collection    | Folder                      | What it holds                              |
| ------------- | --------------------------- | ------------------------------------------ |
| `attractions` | `src/content/attractions/`  | Permanent-ish places (the core atlas)      |
| `events`      | `src/content/events/`       | Seasonal / time-bound happenings           |
| `comments`    | `src/content/comments/`     | Moderated visitor comments                 |

> **The filename is the slug.** `meguro-parasitological-museum.md` → `/attractions/meguro-parasitological-museum`.

---

## Attraction & Event frontmatter

Attractions and events share all the fields below (`commonFields`). Events add four more
(see [Event-only fields](#event-only-fields)). The **Markdown body** holds the narrative
(rendered as prose); recommended H2 sections: `## Why It's Interesting`, `## Best Time to
Visit`, `## Getting There`.

### Required

| Field        | Type                         | Notes |
| ------------ | ---------------------------- | ----- |
| `title`      | string (≥2)                  | Display name. |
| `summary`    | string (10–280)              | One–two sentence teaser; used in cards, search, meta description, OG. |
| `prefecture` | enum (slug)                  | One of the 47 — see `src/data/prefectures.ts`. |
| `lat`        | number (20–46)               | Latitude (Japan bounds enforced). |
| `lng`        | number (122–154)             | Longitude. |
| `category`   | enum                         | One primary bucket: `nature, scenic, food, museum, roadside, religious, art, history, oddity, abandoned, viewpoint, shop, experience, animal, festival`. |

### Optional (with defaults)

| Field           | Type / default                              | Notes |
| --------------- | ------------------------------------------- | ----- |
| `city`          | string                                      | Town/city. |
| `address`       | string                                      | Human-readable address. |
| `googleMaps`    | url                                         | Explicit link; auto-generated from lat/lng if omitted. |
| `tags`          | string[] = `[]`                             | Free-form slugs; reuse those in `src/data/tags.ts`. |
| `seasons`       | (`spring\|summer\|autumn\|winter`)[] = `[]` | Empty = year-round. |
| `months`        | number[] (1–12) = `[]`                      | Precise peaks, e.g. cherry blossoms `[3,4]`. |
| `seasonNote`    | string                                      | e.g. "Peak foliage mid-November". |
| `difficulty`    | `easy\|moderate\|challenging` = `easy`      | Physical effort. |
| `timeRequired`  | `one-hour\|half-day\|full-day\|multi-day` = `one-hour` | Drives duration filters. |
| `cost`          | `{ type, priceJpy?, note? }` = `{type:free}`| `type`: `free\|paid\|donation\|varies`. |
| `parking`       | `{ available, note? }` = `{available:unknown}` | `available`: `yes\|no\|limited\|nearby\|unknown`. |
| `transit`       | `{ nearestStation?, note? }` = `{}`         | Presence of `nearestStation` marks it transit-accessible. |
| `accessibility` | `{ wheelchair, note? }` = `{wheelchair:unknown}` | `wheelchair`: `yes\|partial\|no\|unknown`. |
| `dogFriendly`   | `yes\|no\|limited\|nearby\|unknown` = `unknown` | |
| `heroImage`     | string                                      | Optional hero; else first photo; else a generated gradient. |
| `photos`        | `{ src, alt, credit?, creditUrl? }[]` = `[]`| `src` = `/public` path or remote URL. Always include `alt`. |
| `website`       | url                                         | Official site. |
| `tips`          | string[] = `[]`                             | Short bullet tips, shown in a dedicated box. |
| `status`        | `open\|seasonal\|temporarily-closed\|permanently-closed\|unknown` = `open` | Operational status. |
| `approval`      | `published\|pending\|rejected\|draft` = `draft` | **Only `published` is public.** |
| `source`        | `editorial\|community\|ai-agent\|imported` = `editorial` | Provenance. |
| `submittedBy`   | string = `editorial`                        | e.g. `community:handle`, `ai:research-agent`. |
| `sources`       | `{ title, url, retrieved? }[]` = `[]`       | Citations — important for AI/community entries. |
| `confidence`    | number 0–1                                  | AI confidence, when applicable. |
| `aiSummary`     | string                                      | Shown in a highlighted callout. |
| `aiKeywords`    | string[] = `[]`                             | Boost search; merged into the record's keywords. |
| `featured`      | boolean = `false`                           | Surfaces on the homepage. |
| `related`       | reference(attractions)[] = `[]`             | Explicit related slugs; nearby fills the rest. |
| `createdAt`     | date = now                                  | Drives "Newest". |
| `updatedAt`     | date = now                                  | "Last updated". |

### Event-only fields

| Field        | Type / default                    | Notes |
| ------------ | --------------------------------- | ----- |
| `startDate`  | date (**required**)               | Start of the window. |
| `endDate`    | date (**required**)               | End of the window. |
| `recurrence` | `annual\|one-time\|irregular` = `annual` | Annual events suppress the year in labels. |
| `venue`      | reference(attractions)            | Optionally tie an event to a permanent place. |

---

## Comment frontmatter

| Field        | Type / default                    | Notes |
| ------------ | --------------------------------- | ----- |
| `target`     | string (**required**)             | Slug of the attraction/event it belongs to. |
| `targetType` | `attraction\|event` = `attraction`| Which collection the target is in. |
| `author`     | string = `Anonymous traveler`     | |
| `createdAt`  | date = now                        | |
| `approved`   | boolean = `false`                 | **Only `approved` comments render.** |

The Markdown body is the comment text.

---

## Full example

```markdown
---
title: "Meguro Parasitological Museum"
summary: "A tiny, free museum devoted entirely to parasites — home to an 8.8-metre tapeworm."
prefecture: tokyo
city: "Meguro"
lat: 35.6258
lng: 139.7066
category: museum
tags: [oddity, museum, indoor, rainy-day, free, transit-accessible]
difficulty: easy
timeRequired: one-hour
cost:
  type: free
accessibility:
  wheelchair: partial
status: open
approval: published
source: editorial
featured: false
createdAt: 2025-10-05
updatedAt: 2025-12-01
---

Tucked near the Meguro River is a museum so single-minded it's a legend…

## Why It's Interesting
Two floors, ~300 specimens, and one famous 8.8m tapeworm…
```

---

## Why this shape

- **Frontmatter for structured data, body for narrative** — keeps long-form editable and
  rich while everything filterable/sortable stays typed and validated.
- **Provenance & moderation are first-class** (`source`, `submittedBy`, `approval`,
  `confidence`, `sources`) because this is a community- and AI-fed dataset.
- **Enums come from `src/data/vocab.ts`**, so the vocabulary is single-sourced across the
  schema, the UI filters, and the AI agent's prompt.
