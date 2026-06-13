/**
 * search.ts — search abstraction with a pluggable provider.
 *
 * Today we ship FuseSearch (client-side fuzzy search over the JSON feed): instant, free,
 * works offline, no server. The SearchProvider interface is the seam for the roadmap's
 * semantic/vector search — a future VectorSearch (embeddings + cosine similarity, or a
 * hosted vector DB) can implement the same interface and slot in without touching callers.
 * See docs/ARCHITECTURE.md → "Search".
 */
import Fuse from "fuse.js";
import type { IndexRecord } from "./types";

export interface SearchProvider {
  search(query: string): IndexRecord[];
}

export class FuseSearch implements SearchProvider {
  private fuse: Fuse<IndexRecord>;

  constructor(records: IndexRecord[]) {
    this.fuse = new Fuse(records, {
      includeScore: true,
      threshold: 0.4,
      ignoreLocation: true,
      minMatchCharLength: 2,
      keys: [
        { name: "title", weight: 0.4 },
        { name: "summary", weight: 0.2 },
        { name: "keywords", weight: 0.18 },
        { name: "prefectureName", weight: 0.1 },
        { name: "city", weight: 0.06 },
        { name: "category", weight: 0.06 },
      ],
    });
  }

  search(query: string): IndexRecord[] {
    const q = query.trim();
    if (!q) return [];
    return this.fuse.search(q).map((r) => r.item);
  }
}

export function createSearch(records: IndexRecord[]): SearchProvider {
  return new FuseSearch(records);
}
