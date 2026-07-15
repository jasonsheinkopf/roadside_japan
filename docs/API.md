# Internal API

Cinnamon Land is static, so the **read API** is a set of JSON/XML files generated at build
time, and **write operations** happen through Git (the agent tool and GitHub Issue Forms).
This split keeps the site serverless while still exposing a clean, documented surface.

All read endpoints respect the deploy base path (e.g. `/roadside_japan/api/...`). The client
builds URLs with `src/lib/url.ts`.

---

## Read endpoints (static, live)

### `GET /api/attractions.json`
The canonical feed — an array of `IndexRecord` (see `src/lib/types.ts`) for every
**published** attraction and event. Powers client search, filtering, the map, nearby, and
random. Implemented in `src/pages/api/attractions.json.ts` from `getIndexRecords()`.

```jsonc
[
  {
    "id": "ushiku-daibutsu",
    "collection": "attractions",
    "title": "Ushiku Daibutsu",
    "summary": "One of the tallest statues on Earth…",
    "url": "/roadside_japan/attractions/ushiku-daibutsu",
    "prefecture": "ibaraki", "prefectureName": "Ibaraki", "region": "Kanto",
    "lat": 35.9931, "lng": 140.2249,
    "category": "religious", "tags": ["giant-statue", "kids", "..."],
    "seasons": [], "months": [],
    "difficulty": "easy", "timeRequired": "half-day", "costType": "paid",
    "wheelchair": "partial", "dogFriendly": "limited",
    "parkingAvailable": "yes", "transitAccessible": true,
    "status": "open", "featured": true,
    "keywords": ["great buddha", "..."],
    "createdAt": "2025-08-15T00:00:00.000Z", "updatedAt": "2025-10-30T00:00:00.000Z"
    // events also include startDate / endDate
  }
]
```

### `GET /api/tags.json`
`{ "tags": [{ "slug", "label", "icon", "group", "count" }] }` — sorted by usage.

### `GET /api/seasons.json`
`{ "seasons": [{ "slug", "label", "count" }] }`.

### `GET /api/prefectures.json`
`{ "prefectures": [{ "slug", "name", "nameJa", "region", "lat", "lng", "count" }] }`.

### Other generated files
- `GET /rss.xml` — newest 30 discoveries.
- `GET /sitemap.xml` — every route (for SEO).
- `GET /manifest.webmanifest` — PWA manifest (base-path-aware).

### Derived operations (client-side, over the feed)
These aren't separate endpoints — they're computed in the browser from
`/api/attractions.json`, using the **same** isomorphic modules the server uses:

| Operation       | How |
| --------------- | --- |
| **Text search** | `createSearch(records)` → Fuse (`src/lib/search.ts`). |
| **Filter**      | `applyFilters(records, ids)` (`src/lib/filters.ts`); within-group OR, across-group AND. |
| **Season**      | `matchesSeason` / `matchesMonth` (`src/lib/filters.ts`). |
| **Map / nearby**| `haversineKm` (`src/lib/format.ts`); `nearest()` server-side for detail pages. |

---

## Write operations

There is no public write endpoint (by design). Content changes flow through Git:

| Operation                 | Mechanism |
| ------------------------- | --------- |
| **Create / update / delete attraction** | Add/edit/remove a Markdown file in `src/content/attractions/`. The build validates it. |
| **Create event**          | Same, in `src/content/events/`. |
| **Submit (public)**       | On-site form / GitHub Issue Form (`labels: submission`) → review queue → merged to repo. |
| **Comment (public)**      | On-site form / GitHub Issue Form (`labels: comment`) → moderated → file in `src/content/comments/` with `approved: true`. |
| **AI create**             | The agent writes a `pending` entry; a human reviews and publishes. |

### Local agent server API
`npm run agent:server` exposes (localhost, permissive CORS — a dev tool):

| Method & path       | Body | Returns |
| ------------------- | ---- | ------- |
| `GET /api/health`   | —    | `{ ok, providers:[{id,label,available,models,default}], default }` |
| `POST /api/research`| `{ query, provider?, model? }` | `{ query, provider, model, candidates:[Candidate] }` |
| `POST /api/save`    | `{ candidate, approval? }` | `{ ok, path }` — writes a content file |

A `Candidate` (see `tools/agent/agents/research.ts`) carries `{ slug, collection, frontmatter,
body, markdown, sources, confidence, reasoning, warnings }`.

---

## Versioning & stability

`IndexRecord` is the contract most consumers depend on. If you add a field, append it
(don't repurpose existing ones) and update `src/lib/types.ts`, `toIndexRecord()`, and this
doc together.
