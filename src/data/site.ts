/**
 * site.ts — global site configuration in one place (name, repo, social handles,
 * GitHub Issue Form intake links). Reference this instead of hard-coding URLs.
 */
export const SITE = {
  name: "Roadside Japan",
  tagline: "Discover the Japan most tourists never see.",
  repo: "https://github.com/jasonsheinkopf/roadside_japan",
  /** Owner/name — used to build GitHub issue intake links. */
  owner: "jasonsheinkopf",
  repoName: "roadside_japan",
  license: "Content CC BY-SA 4.0 · Code MIT",
};

/** Build a prefilled "new issue" URL against the project repo. */
export function newIssueUrl(opts: {
  template?: string;
  title?: string;
  body?: string;
  labels?: string;
}): string {
  const p = new URLSearchParams();
  if (opts.template) p.set("template", opts.template);
  if (opts.title) p.set("title", opts.title);
  if (opts.body) p.set("body", opts.body);
  if (opts.labels) p.set("labels", opts.labels);
  return `${SITE.repo}/issues/new?${p.toString()}`;
}
