/**
 * content.config.ts — THE canonical data contract for Cinnamon Land.
 *
 * This file is the source of truth and the enforcement gate: `astro sync` / `astro build`
 * validate every entry against these Zod schemas and FAIL on any violation. That means
 * invalid data can never reach the published site, which is exactly what we want for an
 * AI- and community-fed dataset.
 *
 * Two collections:
 *   - attractions: permanent-ish places (the core atlas)
 *   - events: time-bound / seasonal happenings (festivals, illuminations, blooms)
 *
 * They share most fields via `commonFields`. See docs/DATA_MODEL.md for the full,
 * human-readable description and authoring guidance.
 */
import { defineCollection, reference, z } from "astro:content";
import { glob } from "astro/loaders";
import {
  CATEGORIES,
  COST_TYPES,
  COUNTRIES,
  DIFFICULTIES,
  MONTHS,
  RECURRENCE,
  SEASONS,
  SOURCE,
  STATUS,
  TIME_REQUIRED,
  WHEELCHAIR,
  YES_NO_LIMITED,
  APPROVAL,
} from "./data/vocab";
import { PREFECTURE_SLUGS } from "./data/prefectures";

const photo = z.object({
  src: z.string(), // URL, or path under /public (e.g. "/images/foo.jpg"), or remote https URL
  alt: z.string(),
  /** Short, personality-filled caption (often in Mon-chan's voice) shown under the photo. */
  caption: z.string().optional(),
  credit: z.string().optional(),
  creditUrl: z.string().url().optional(),
});

const sourceRef = z.object({
  title: z.string(),
  url: z.string().url(),
  retrieved: z.coerce.date().optional(),
});

/** Fields shared by attractions and events. */
const commonFields = z.object({
  title: z.string().min(2),
  /** Short teaser (≤ ~160 chars) used in cards, search results, and meta description. */
  summary: z.string().min(10).max(280),

  // --- Location ---
  /** Which country the entry belongs to. Defaults to japan (the original dataset). */
  country: z.enum(COUNTRIES).default("japan"),
  /** Prefecture (Japan) or province (Thailand) slug — see src/data/prefectures.ts. */
  prefecture: z.enum(PREFECTURE_SLUGS),
  city: z.string().optional(),
  address: z.string().optional(),
  // Bounding box covering all atlas countries. The atlas is global — this stays wide
  // enough for anywhere inhabited (Hawaii's far west → the US East Coast → Hokkaido),
  // while still catching nonsense coordinates (e.g. a stray 0,0 or a transposed pair).
  lat: z.number().min(-60).max(72),
  lng: z.number().min(-180).max(180),
  /** If omitted, a Google Maps link is generated from lat/lng at render time. */
  googleMaps: z.string().url().optional(),

  // --- Classification ---
  category: z.enum(CATEGORIES),
  tags: z.array(z.string()).default([]),

  // --- Seasonality ---
  seasons: z.array(z.enum(SEASONS)).default([]),
  /** Specific peak months (1-12), e.g. cherry blossoms = [3,4]. Empty = year-round. */
  months: z.array(z.number().int().min(1).max(12)).default([]),
  seasonNote: z.string().optional(),

  // --- Practical info ---
  difficulty: z.enum(DIFFICULTIES).default("easy"),
  timeRequired: z.enum(TIME_REQUIRED).default("one-hour"),
  cost: z
    .object({
      type: z.enum(COST_TYPES).default("free"),
      priceJpy: z.number().nonnegative().optional(),
      note: z.string().optional(),
    })
    .default({ type: "free" }),
  parking: z
    .object({
      available: z.enum(YES_NO_LIMITED).default("unknown"),
      note: z.string().optional(),
    })
    .default({ available: "unknown" }),
  transit: z
    .object({
      nearestStation: z.string().optional(),
      note: z.string().optional(),
    })
    .default({}),
  accessibility: z
    .object({
      wheelchair: z.enum(WHEELCHAIR).default("unknown"),
      note: z.string().optional(),
    })
    .default({ wheelchair: "unknown" }),
  dogFriendly: z.enum(YES_NO_LIMITED).default("unknown"),

  // --- Media & links ---
  heroImage: z.string().optional(),
  /**
   * Attribution for heroImage (e.g. "Photo via Wikimedia Commons" + the file page).
   * Required in practice for Commons-licensed heroes — do NOT duplicate the hero into
   * `photos[]` just to carry a credit (docs/PHOTO_ENRICHMENT.md).
   */
  heroCredit: z.string().optional(),
  heroCreditUrl: z.string().url().optional(),
  photos: z.array(photo).default([]),
  website: z.string().url().optional(),

  // --- Editorial extras (shown in dedicated UI blocks) ---
  tips: z.array(z.string()).default([]),

  /**
   * Cinnamon scene — every entry's unique mascot vignette (see docs/PHOTOS.md).
   * `quote` is a hand-written one-liner in Cinnamon's voice about THIS place;
   * `emoji` is the thing he's engaging with in the scene. Renders in-page as the
   * "Cinnamon was here" postcard on every detail view.
   * `report` is his field report (docs/CINNAMON.md): a short first-person story —
   * how he heard about the place, why it hooked him, what he did there, and his
   * honest squirrel take, grounded in the entry's researched facts.
   */
  cinnamon: z
    .object({
      quote: z.string().min(4),
      emoji: z.string().default("📍"),
      report: z.string().min(40).optional(),
      /**
       * Two candid "camera roll" snapshots (docs/CINNAMON.md §7) — quick vector
       * vignettes of the cast at the place from a different angle/moment each
       * (a selfie with the statue, feet in the spring), not a sequential story.
       * `cast` = who's in the shot; `prop` = the panel's emoji; `caption` = the
       * short line below the art (never a speech bubble).
       */
      snapshots: z
        .array(
          z.object({
            cast: z.array(z.enum(["cinnamon", "socks", "mon"])).min(1).default(["cinnamon"]),
            prop: z.string().default("📍"),
            caption: z.string().min(2),
          }),
        )
        .min(2)
        .max(2)
        .optional(),
    })
    .optional(),

  /**
   * A tip passed along by the person who submitted the place ("get the beef jerky").
   * Rendered inside Cinnamon's field report, credited to `by` (handle or
   * "a fellow traveler" — never an email address).
   */
  visitorTip: z
    .object({
      text: z.string().min(3),
      by: z.string().default("a fellow traveler"),
    })
    .optional(),

  // --- Provenance, moderation, AI ---
  status: z.enum(STATUS).default("open"),
  approval: z.enum(APPROVAL).default("draft"),
  source: z.enum(SOURCE).default("editorial"),
  submittedBy: z.string().default("editorial"),
  sources: z.array(sourceRef).default([]),
  confidence: z.number().min(0).max(1).optional(),
  aiSummary: z.string().optional(),
  aiKeywords: z.array(z.string()).default([]),

  // --- Curation flags & relations ---
  featured: z.boolean().default(false),
  related: z.array(reference("attractions")).default([]),

  // --- Timestamps ---
  createdAt: z.coerce.date().default(() => new Date()),
  updatedAt: z.coerce.date().default(() => new Date()),
});

const attractions = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/attractions" }),
  schema: commonFields,
});

const events = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/events" }),
  schema: commonFields.extend({
    /** When the event runs. For annual events, the year is indicative — use `recurrence`. */
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    recurrence: z.enum(RECURRENCE).default("annual"),
    /** Optionally tie an event to a permanent place in the atlas. */
    venue: reference("attractions").optional(),
  }),
});

/**
 * comments — visitor comments, stored as files so they are version-controlled, trivially
 * removable (delete the file / revert the commit), and human-moderated (only approved:true
 * renders). New comments arrive via the submission form → review queue (see docs/API.md
 * and docs/MODERATION.md). The Markdown body is the comment text.
 */
const comments = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/comments" }),
  schema: z.object({
    /** Slug of the attraction or event this comment belongs to. */
    target: z.string(),
    targetType: z.enum(["attraction", "event"]).default("attraction"),
    author: z.string().default("Anonymous traveler"),
    createdAt: z.coerce.date().default(() => new Date()),
    /** Moderation gate — only approved comments render publicly. */
    approved: z.boolean().default(false),
  }),
});

export const collections = { attractions, events, comments };
