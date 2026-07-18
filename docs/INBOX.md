# The Inbox — community submissions & how to process them

**Audience: the AI agent.** When the maintainer says anything like *"process the inbox"*,
*"any new submissions?"*, or *"how many people have submitted?"* — this file is the
protocol. It is the single source of truth for triage; follow it without needing the
maintainer to re-explain.

## How submissions arrive

The `/submit` page is one free-text box, no account. A Cloudflare Worker
(`tools/submit-worker/`) files each note as a **GitHub Issue in this repo, labeled
`inbox`**, body = the visitor's raw text verbatim. That's the whole intake. The repo is
private, so submissions (including any emails in them) are not public.

There is **no separate database**. The issue queue is the database:

| Question | Answer |
| --- | --- |
| Anything new? / how many waiting? | count of **open** issues with label `inbox` |
| How many processed all-time? | count of **closed** issues with label `inbox` |
| Which produced additions? | closed issues also labeled `added` |
| Submissions about country X? | label `country:<slug>` (applied during triage) |
| When did it arrive? | the issue's own timestamp |
| What happened to it? | the structured **triage comment** on the issue (format below) |

Answer status questions with issue searches (`list_issues` / `search_issues`); never
guess. These queries stay cheap at any scale.

## Processing protocol

**Interactive rule: never process the inbox autonomously — only when the maintainer asks.**
The one exception is the **event-driven automated job**, which fires the instant a new `inbox`
issue is opened and runs unattended under a *stricter* set of rules: it publishes only
clearly-safe, clearly-verified places, **holds** anything borderline as `pending` for the
maintainer, and rejects the rest. That job follows
[`docs/AUTONOMOUS_TRIAGE.md`](./AUTONOMOUS_TRIAGE.md) (the safety gate + LINE report) **on top
of** everything below. If you are that automated job, read it first.

For interactive processing, and as the base procedure the scheduled job extends, for each
open `inbox` issue, oldest first:

### 1. Read the note as intent, not format

The text is unstructured by design. It may contain, in any mix and any language:

- one place, or many places in one paragraph;
- a vague tip ("a restaurant near Ueno serving silkworm udon") — the research is your job;
- a trip plan (route, cities, dates) + what they hope to find → treat as a research
  request: find genuinely good places along the route, using judgment on how many;
- a country not yet in the atlas → if the material is worth it, follow AGENTS.md
  "Add a country" first;
- a name/handle (credit them) and/or an email (notify them — step 5);
- nothing usable at all.

Scale requests with judgment: "add 1000 places" means "add the ones that are actually
good." You decide how many survive.

### 2. Verify independently — never publish on trust

For each candidate place:

- **Existence:** confirm through at least one independent source (WebSearch: official
  site, Wikipedia, news, credible blogs). No trace found → don't add; note it.
- **Accuracy:** verify name, location/coordinates, and any claimed facts yourself. The
  submitter's text is a lead, not a source. Write the entry from your research; cite
  real `sources`.
- **Interest bar:** it must be at least *mildly interesting* — strange, beautiful,
  overlooked, or story-worthy. A generic McDonald's is out; a McDonald's inside a
  100-year-old bank vault might be in. When torn, ask: would a curious traveler detour
  for this?
- **Safety & appropriateness:** nothing illegal, explicit, or hateful; no doxxing or
  private residences; nothing whose main draw is danger or trespassing. Photos follow
  the Commons method (docs/PHOTOS. see AGENTS.md) — verify the image genuinely shows the
  place and is appropriate (no nudity/shock content). When in doubt, ship without a photo.
- **Duplicates:** search existing entries first; if it exists, consider enriching the
  existing entry instead, and say so in the triage comment.

### 3. Create entries for what passes

Standard authoring rules (AGENTS.md, docs/DATA_MODEL.md), plus:

- **Photos + the full Cinnamon block are part of authoring, not optional** — run the photo
  pipeline in `docs/PHOTO_ENRICHMENT.md` (Commons-scoped WebSearch → deterministic URL)
  and write the entry's `cinnamon: { quote, emoji, report, snapshots }` block per
  `docs/CINNAMON.md` (the `report` is his first-person field report; `snapshots` is two
  candid camera-roll vignettes — §7 — for new entries). If the submitter's note
  included a genuine recommendation, carry it as `visitorTip: { text, by }`. No verified
  photo → a place-representing vector scene serves as the hero (never Cinnamon forced into
  the hero shot); never ship a bare entry. When there IS a hero photo, don't duplicate it
  into `photos[]`/the camera roll.
- `createdAt`/`updatedAt`: use the **full ISO timestamp** of processing (e.g.
  `2026-07-17T05:32:00Z`) — `/new` orders same-day entries to the minute.
- **Official website:** while verifying, check whether the place has an official site
  (or an official tourism-board page) and set `website:` when it does — it renders as a
  button on the detail page. Skip blogs/socials; official-ish only.
- `source: community`
- `submittedBy:` the name/handle from the note (verbatim, lightly cleaned); if none was
  given use `"a fellow traveler"` — never put their email here, it renders publicly.
- `approval: published` when verification is solid; `pending` when it's borderline and
  worth the maintainer's eyeball (mention any `pending` ones in your session summary).
- The submitter's name will then appear as "found by …" on `/new` and the detail page —
  that's the reward loop; site-originated entries show as Cinnamon.

### 4. Record the outcome on the issue

**Post it as a NEW comment (`add_issue_comment`) — never as an edit to the issue's `body`.**
The body holds the visitor's original raw submission, which is the only place their email
address lives; overwriting it with the triage report deletes that address and silently
breaks the thank-you email (`notify-submitter.yml` reads the body — plus every comment, as
a backup — looking for it). If you use an issue-update tool for labels/state, do not pass a
`body` argument.

Leave ONE structured triage comment (greppable format — keep the field names exact):

```
**Triage** · 2026-07-16
- Items: 3 candidate places
- Added: `wat-x` (published), `silkworm-udon-ueno` (pending)
- Skipped: "the cool bridge" — could not identify/verify
- Country: thailand, japan
- Credit: "Maya"
- Email: maya@example.com — sent / none found
```

The `Email:` line always shows the **actual address** found (dedicated field or anywhere in
the note), not just yes/no — and whether the outcome email was actually sent (vs. skipped
because no mail secrets are configured). If no address was found at all, write `none found`.

Then: add label `processed`, plus `added` if anything was published, plus
`country:<slug>` for each country involved (create labels as needed), and **close the
issue**. Open = waiting; closed = done. No other bookkeeping exists, so this comment is
the permanent record — make it accurate.

### 5. Notify the submitter

If an email address was given — in the dedicated field (a "Submitter email:" line in the
issue) or anywhere in the note — **always send an outcome email, whatever the outcome.**
Added, held, couldn't verify, or even "we couldn't make sense of the note": if a human
left an address, a human hears back. (Sole exception: obvious spam/abuse gets no reply.)
Author it in Cinnamon's voice — see `docs/CINNAMON.md` §5 for the full shape (reference
what they said, one detail from his field report when something was added, links to the
live entries, the Socks-the-cat framing, under ~180 words; for a nothing-added outcome,
keep it warm and honest: what he tried, why it didn't land, an invitation to try again) —
then trigger `notify-submitter.yml` (`actions_run_trigger`) with
`inputs: { issue_number, body, subject }`. The workflow extracts the email from the issue
body + comments itself and skips silently if mail secrets aren't configured. Never email
anyone about a different submission than their own.

### 6. Ship

Content changes go through the normal gate: `npm run data:validate && npm run check &&
npm run build`, PR, merge (per the maintainer's standing pattern). Reference the issue
numbers in the PR body so the audit trail links both ways.

## Spam & abuse

Honeypot and length caps live in the worker. If junk still arrives: label `spam`, close,
no comment needed, move on. Repeated abuse → suggest enabling Turnstile
(tools/submit-worker/README.md notes how).
