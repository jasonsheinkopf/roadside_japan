/**
 * The Research Agent. Pipeline: user query → provider (any) → strict JSON candidates →
 * normalized into schema-shaped frontmatter + a ready-to-commit Markdown file.
 *
 * This is the first of several planned agents (Photo, Fact-checker, Duplicate Detector,
 * Translator, …) — see docs/AI_AGENTS.md. They all share the provider registry and the
 * entry-writing utilities, so adding one is mostly prompt + parse.
 */
import type { Provider } from "../providers/types.ts";
import { RESEARCH_SYSTEM_PROMPT } from "./research-prompt.ts";
import { buildMarkdown, slugify } from "../lib/entry.ts";
import { CATEGORIES } from "../../../src/data/vocab.ts";

export interface RawCandidate {
  title: string;
  summary: string;
  prefecture: string;
  city?: string;
  lat: number;
  lng: number;
  category: string;
  tags?: string[];
  seasons?: string[];
  months?: number[];
  seasonNote?: string;
  difficulty?: string;
  timeRequired?: string;
  costType?: string;
  website?: string;
  body: string;
  sources?: { title: string; url: string }[];
  confidence?: number;
  reasoning?: string;
}

export interface Candidate {
  slug: string;
  collection: "attractions";
  frontmatter: Record<string, unknown>;
  body: string;
  markdown: string;
  sources: { title: string; url: string }[];
  confidence: number;
  reasoning: string;
  /** Schema concerns we noticed (e.g. unknown category) for the human reviewer. */
  warnings: string[];
}

/** Pull the first JSON object out of a model response, tolerating fences/preamble. */
function extractJson(text: string): unknown {
  const fenced = text.replace(/```(?:json)?/gi, "```").split("```").find((s) => s.trim().startsWith("{"));
  const body = fenced ?? text;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object found in model response.");
  return JSON.parse(body.slice(start, end + 1));
}

function normalize(raw: RawCandidate): Candidate {
  const warnings: string[] = [];
  const today = new Date();
  let category = (raw.category || "").toLowerCase();
  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    warnings.push(`Unknown category "${raw.category}" → coerced to "oddity"`);
    category = "oddity";
  }
  const confidence = typeof raw.confidence === "number" ? Math.max(0, Math.min(1, raw.confidence)) : 0.5;

  const frontmatter: Record<string, unknown> = {
    title: raw.title,
    summary: (raw.summary || "").slice(0, 280),
    prefecture: (raw.prefecture || "").toLowerCase(),
    city: raw.city || undefined,
    lat: raw.lat,
    lng: raw.lng,
    category,
    tags: raw.tags ?? [],
    seasons: raw.seasons ?? [],
    months: raw.months ?? [],
    seasonNote: raw.seasonNote || undefined,
    difficulty: raw.difficulty || "easy",
    timeRequired: raw.timeRequired || "one-hour",
    cost: { type: raw.costType || "free" },
    website: raw.website || undefined,
    status: "open",
    approval: "pending",
    source: "ai-agent",
    submittedBy: "ai:research-agent",
    sources: raw.sources ?? [],
    confidence,
    aiKeywords: raw.tags ?? [],
    featured: false,
    createdAt: today,
    updatedAt: today,
  };

  const slug = slugify(raw.title || "untitled");
  return {
    slug,
    collection: "attractions",
    frontmatter,
    body: raw.body || raw.summary || "",
    markdown: buildMarkdown(frontmatter, raw.body || raw.summary || ""),
    sources: raw.sources ?? [],
    confidence,
    reasoning: raw.reasoning ?? "",
    warnings,
  };
}

export interface ResearchResult {
  query: string;
  provider: string;
  model: string;
  candidates: Candidate[];
}

export async function runResearch(
  provider: Provider,
  query: string,
  opts: { model?: string } = {},
): Promise<ResearchResult> {
  const model = opts.model || provider.defaultModel;
  const text = await provider.generate(
    [
      { role: "system", content: RESEARCH_SYSTEM_PROMPT },
      { role: "user", content: query },
    ],
    { model, json: true, temperature: 0.5, maxTokens: 4096 },
  );

  const parsed = extractJson(text) as { candidates?: RawCandidate[] };
  const raws = Array.isArray(parsed.candidates) ? parsed.candidates : [];
  return {
    query,
    provider: provider.id,
    model,
    candidates: raws.filter((r) => r && r.title).map(normalize),
  };
}
