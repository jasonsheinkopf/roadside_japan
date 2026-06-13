/**
 * content.config.ts — THE canonical data contract for Roadside Japan.
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
  prefecture: z.enum(PREFECTURE_SLUGS),
  city: z.string().optional(),
  address: z.string().optional(),
  lat: z.number().min(20).max(46), // Japan's rough bounding box
  lng: z.number().min(122).max(154),
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
  photos: z.array(photo).default([]),
  website: z.string().url().optional(),

  // --- Editorial extras (shown in dedicated UI blocks) ---
  tips: z.array(z.string()).default([]),

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
