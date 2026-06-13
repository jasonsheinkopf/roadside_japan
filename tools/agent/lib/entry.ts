/** Turn an agent proposal into a content Markdown file and (optionally) write it. */
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "../config.ts";
import { toYaml } from "./yaml.ts";

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 64);
}

export function buildMarkdown(frontmatter: Record<string, unknown>, body: string): string {
  return `---\n${toYaml(frontmatter as never)}---\n\n${body.trim()}\n`;
}

export type Collection = "attractions" | "events";

/** Write a markdown entry, returning its repo-relative path. Won't clobber by default. */
export function writeEntry(
  collection: Collection,
  slug: string,
  markdown: string,
  overwrite = false,
): { path: string; relPath: string; existed: boolean } {
  const dir = join(ROOT, "src", "content", collection);
  mkdirSync(dir, { recursive: true });
  let finalSlug = slug;
  const exists = (s: string) => existsSync(join(dir, `${s}.md`));
  if (!overwrite && exists(finalSlug)) {
    let n = 2;
    while (exists(`${slug}-${n}`)) n++;
    finalSlug = `${slug}-${n}`;
  }
  const existed = exists(finalSlug);
  const path = join(dir, `${finalSlug}.md`);
  writeFileSync(path, markdown, "utf8");
  return { path, relPath: `src/content/${collection}/${finalSlug}.md`, existed };
}
