# Moderation

Everything is files in Git, so moderation is just editing, committing, and reverting — fully
auditable and reversible. The `/admin` page is a dashboard over this (queue + links + AI
tools); the actions themselves are Git operations.

## The publish gate

- Attractions/events render publicly **only** when `approval: published`.
- Comments render **only** when `approved: true`.
- Submissions and AI proposals enter as `pending` / unapproved.

So "nothing goes live by accident" is enforced by the schema + the publish gate in
`src/lib/content.ts`.

## Approve

Edit the entry's frontmatter: `approval: pending` → `approval: published`, bump `updatedAt`,
commit. For a comment: `approved: false` → `true`. The `/admin` queue links straight to each
file's GitHub editor.

## Edit

Edit the Markdown file. The build re-validates on every change.

## Reject / remove

- Reject a submission: set `approval: rejected` (kept for history) **or** delete the file.
- Remove a comment: delete its file in `src/content/comments/`.
- Take down a live entry fast: set `approval: pending` (instantly unpublishes on next build)
  or revert the commit. History remains in Git.

## Merge duplicates

1. Pick the canonical entry; fold the better details/sources into it.
2. Delete the duplicate file.
3. Repoint any `related`/`venue` references to the survivor.
4. (Optional) Add the old slug to a redirects list if/when redirects are implemented
   (roadmap).

The **Duplicate Detector** agent (roadmap) will flag likely duplicates before they're saved.

## Bulk operations

Because entries are plain files, bulk edits are scripted/agent-assisted:

- **Bulk tag / season / status:** a small Node script (or the agent) iterates
  `src/content/**/*.md`, parses frontmatter, edits, rewrites. Always run `npm run data:validate`
  after.
- **Bulk approve:** flip `approval` across a batch in one commit/PR.

Keep bulk changes in their own PR so the diff is reviewable.

## Submissions & comments from GitHub

Public intake arrives as labelled issues:

- `label:inbox` → the free-text drop box (`/submit` → worker). **The full triage
  protocol — verification standards, quality bar, labels, notification — is
  [`docs/INBOX.md`](./INBOX.md).** Processed only when the maintainer asks.
- `label:submission` → the legacy structured form (retired; a few may exist). Same
  treatment as `inbox`.
- `label:comment` → if good, add a file in `src/content/comments/` with `approved: true` and
  the right `target`; close the issue.

## Spam

- The on-site forms include a honeypot field; bot submissions are dropped client-side.
- GitHub's own auth gates issue creation, which filters most spam.
- For higher-volume needs, wire `PUBLIC_COMMENTS_ENDPOINT` to a service that adds rate
  limiting / captcha, or enable a Moderation agent to triage the queue.

## Audit trail

Git is the log: who changed what, when, and why (commit messages). Nothing is truly deleted —
it's recoverable from history, which is exactly what you want for moderation.
