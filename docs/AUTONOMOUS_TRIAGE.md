# Autonomous inbox triage — protocol & safety policy

**Audience: the AI agent running the event-driven triage job.** This file governs the
*automated, unattended* processing of the community inbox. A Routine fires the moment a new
GitHub issue labeled `inbox` is opened (i.e. the instant someone submits through the site) and
runs this file's protocol with **no human in the loop at publish time**, so the bar is stricter
and the safety rules are non-negotiable.

Interactive triage (maintainer sitting there saying "process the inbox") still follows
[`docs/INBOX.md`](./INBOX.md). This file is the *delta* for when nobody is watching: the same
verification work, plus a hard safety gate and a three-way outcome that keeps anything risky
out of public view until a human looks at it.

> **The one rule that makes autonomy safe:** when unattended, *publish only what is clearly
> safe and clearly verified.* Everything else is either held as `pending` (for the maintainer's
> eyes) or rejected. Automation must never be the thing that puts borderline content live.

---

## 1. Three outcomes, not two

Interactive triage publishes or skips. Automated triage has **three** buckets. Decide per place:

| Outcome | When | What you do |
| --- | --- | --- |
| **PUBLISH** (`approval: published`) | Verified through independent sources **and** clears every safety check below with no doubt at all. | Author the full entry (photo pipeline + Scene Art hero if no photo + Cinnamon block) and publish. |
| **HOLD** (`approval: pending`) | Genuinely interesting and probably fine, but touches *any* sensitive area below, or verification is thin/single-source, or you had to make a judgment call. | Author the entry but leave it `pending` so it stays **off** the public site. List it in the report as "held for review." |
| **REJECT** (no entry) | Fails a safety check, is unverifiable, is spam/promotional, or is off-mission. | Create nothing. Record why in the triage comment and the report. |

**When in doubt, HOLD — never PUBLISH.** Holding costs the maintainer a glance; wrongly
publishing costs them their reputation. The tie always breaks toward HOLD.

---

## 2. Safety gate (apply to every candidate, before anything is published)

A candidate that trips any of these is **REJECT**, unless a clearly legitimate framing applies
(noted per item) in which case it is **HOLD** for a human, never an automatic PUBLISH.

1. **Hate / discrimination.** Nothing that promotes, celebrates, or is primarily a symbol of
   racism, antisemitism, ethnic/religious hatred, sexism, homophobia/transphobia, or any hate
   ideology. → REJECT.
   *Legitimate framing:* a memorial, museum, or historic site that **solemnly documents** an
   atrocity or a painful history (e.g. a peace memorial) is valuable — but because the subject
   is sensitive, **HOLD** it for human review rather than auto-publishing. Never publish content
   that valorizes the perpetrators or the ideology.

2. **Sexual / adult content.** No entries whose primary draw is pornographic, explicit, or
   sexual services. → REJECT.
   *Legitimate framing:* a culturally/historically significant site with a sexual dimension
   (a fertility shrine, a folk festival, a serious museum) can belong in the atlas, but written
   factually and non-titillating — **HOLD** for human review.

3. **Gore / shock / death spectacle.** Nothing whose appeal is gore, real human remains as
   spectacle, torture, self-harm, or shock value. → REJECT.
   *Legitimate framing:* catacombs, war history, and respectfully presented memento-mori sites
   can be legitimate — **HOLD** for review, and keep the writing sober.

4. **Danger / illegality as the draw.** No trespassing spots, "sneak into the abandoned X,"
   drug tourism, or anywhere whose main appeal is doing something illegal or physically
   dangerous. → REJECT. (A safely accessible, legal historic ruin is fine.)

5. **Private individuals & privacy.** No private residences, no naming or locating private
   people, no doxxing, nothing that would draw strangers to where someone lives. → REJECT.

6. **Defamation / unverified claims about real named people or businesses.** Never publish a
   negative or sensational claim about a named person or business that you cannot back with a
   credible, citable source. Stick to verifiable, neutral facts. If the "story" is the
   allegation, → REJECT (or HOLD if there's a genuinely sourced, newsworthy angle).

7. **Extremist / propaganda purpose.** Content whose main purpose is partisan political or
   religious-extremist propaganda. → REJECT. (Ordinary temples, shrines, churches, and mosques
   as cultural/architectural sites are the atlas's bread and butter — this is about extremism,
   not faith.)

8. **Spam / promotion / scams.** Pure advertising, affiliate/crypto shilling, "please add my
   shop" with nothing interesting, contact-harvesting. → REJECT (label `spam`, close, no
   comment) per `docs/INBOX.md`.

9. **Images.** Only Wikimedia Commons / clearly-licensed photos via the pipeline in
   `docs/PHOTO_ENRICHMENT.md`. The image must genuinely show the place and contain nothing
   nudity/shock/graphic. Any doubt about an image → ship the entry with **no photo** — and in
   that case, **drawing a Scene Art `hero` (required, see §3 below) is not optional.** Never
   hotlink or guess an image.

10. **General taste line.** The atlas can be quirky, macabre-lite, and not-for-toddlers. It must
    never be gross-out, cruel, demeaning, or something the maintainer would be embarrassed to
    have their name on. If you can imagine it causing a "why is this on your site?" email —
    HOLD or REJECT.

Everything else from `docs/INBOX.md` still applies: independent existence check, accuracy,
the "mildly interesting" bar, duplicate check.

---

## 3. The automated run, start to finish

Fires **per submission**: a Routine watches for GitHub issues labeled `inbox` being opened and
fires within moments of one appearing (see `docs/NOTIFICATIONS_SETUP.md` for exactly how it's
wired). Model: **Sonnet** coordinates the run. Steps:

**Cost note — hybrid model, coordinate-and-delegate.** A submission with N candidate places
costs roughly N× a single-place run (each place needs its own verification + full authoring),
so for multi-place submissions, delegate the mechanical, non-judgment sub-steps to **Haiku**
subagents (via the `Agent` tool) to cut cost without touching quality where it matters:
- **Haiku**: turning verified research into frontmatter fields (tags, seasons, cost, parking,
  transit — structured extraction, not judgment), writing the two camera-roll `snapshots`
  captions (§7 of CINNAMON.md — lower creative bar than the field report), and drafting the
  LINE report's data lines (§5 below).
- **Keep on Sonnet** (the coordinator, never delegate): the PUBLISH/HOLD/REJECT safety-gate
  decision, the entry body prose ("Why It's Interesting" etc.), the Cinnamon field report
  (`cinnamon.report` — needs his voice), and the submitter thank-you email. These are exactly
  the parts where a mistake is either public-facing or represents you to a real person.
Skip the delegation entirely for a single-place submission — the coordination overhead isn't
worth it below a few places.

1. **Guard.** Make sure you're on the latest `main` and that *this file exists*. If it does not
   (e.g. the change hasn't merged yet), **do nothing and exit** — do not process with the old
   two-outcome rules unattended.
2. **Read the queue.** Open GitHub issues labeled `inbox`, oldest first — normally this is just
   the one issue that triggered this run, but process any others still open too (e.g. leftovers
   from a prior run that didn't finish). Zero open (shouldn't normally happen on a trigger fire,
   but possible on a manual/backstop run) → send a short "nothing to do" LINE message (§5) and
   stop; don't write a whole report for nothing.
3. **Process each** per `docs/INBOX.md` §1–§4 **and** the safety gate above, choosing
   PUBLISH / HOLD / REJECT. Author full entries for PUBLISH and HOLD — frontmatter, photo
   pipeline, **and the complete Cinnamon block per `docs/CINNAMON.md`**: `quote`, `emoji`,
   the **field report** (`cinnamon.report`, §3 there — his first-person story grounded in
   your research), **and two camera-roll snapshots** (`cinnamon.snapshots`, §7 — two candid
   vector vignettes, no story arc required; new entries only). If the
   submitter's note contained a genuine recommendation, carry it as `visitorTip: { text, by }`.
   When a real hero photo exists, it's the page's main image — don't also copy it into
   `photos[]` (the camera roll is for genuinely *additional* photos, not a second hero).

   **Required — no real photo → draw a Scene Art hero.** This is a required step, not a
   nice-to-have — do not ship a photo-less entry with only the emoji `PlaceScene` fallback. Per
   `docs/SCENE_ART.md` (§1–§4, §7): spawn a **Sonnet** subagent (or draw it yourself if you are
   already Sonnet) to produce `src/data/scenes/<slug>.hero.svg` — a genuine illustration of the
   place, no cast, viewBox `0 0 480 300`, a unique `data-prefix`, ≥20 shapes, grounded in the
   entry's real facts (read the content file for subject matter). The agent must iterate:
   `python3 scripts/validate-scenes.py <file>` to zero violations, then
   `node scripts/preview-scene.mjs <file> /tmp/out.png` and actually look at the render,
   fixing anything broken/floating/uncanny before calling it done — one shot with no visual
   check is not acceptable. This runs **per photo-less entry**, same as the photo pipeline; it
   is not optional busywork to skip under time pressure. After authoring, regenerate the ledger
   (`python3 scripts/scene-status.py`) so `docs/SCENE_STATUS.md` stays accurate — the maintainer
   uses it to track what's been upgraded.

   Set `createdAt`/`updatedAt` to the **full ISO timestamp** (e.g.
   `2026-07-17T05:32:00Z`), not a bare date — `/new` orders entries to the minute. Leave the
   structured triage comment on each issue **as a new comment, never as a body edit** — see
   `docs/INBOX.md` §4 for why this specific mistake breaks the thank-you email — apply
   labels (`processed`, `added`, `country:<slug>`, `spam`), and close it. Note each issue's
   **submitter name/handle**,
   **email if given**, and **the issue's `created_at` timestamp** — you'll need these for the
   report and the thank-you email.
4. **New country?** If a submission warrants a country not yet in the atlas and it clearly
   passes, follow AGENTS.md "Add a country." If it's borderline, HOLD the places and note it.
5. **Verify the build.** `npm run data:validate && npm run build`. If the build fails, **do not
   push broken content** — revert the entries to `pending` or drop them, and report the failure.
6. **Commit & push, then land it on `main` yourself.** Use a clear commit message, e.g.
   `Automated inbox triage: +2 published, 1 held, 1 skipped`.
   - If your session can push straight to `main`, do that.
   - If your session is scoped to a working branch (e.g. a Claude Code Remote session bound
     to a designated branch, with a "never push to a different branch without explicit
     permission" rule) — push there, open a PR into `main`, and **merge it yourself
     immediately**, the same run. **The maintainer has pre-authorized this**: once
     `data:validate`/`check`/`build` are green on that branch and the safety gate above is
     clear (i.e. you're in PUBLISH/HOLD/REJECT territory, not stuck on an ambiguous call),
     merging your own inbox-triage PR is in scope — don't leave it sitting open waiting for
     manual review. Check the PR's status (`pull_request_read` → `get_check_runs`) before
     merging so you're not merging over a red CI check.
   - Only skip the merge, leave the PR open, and clearly flag it in the report + LINE
     message (§5) when something is genuinely uncertain — the build failed, a safety-gate
     call was borderline, or the merge itself errors (branch protection, permissions). That's
     the "needs a human" case; routine successful runs are not.
7. **Notify submitters — always, whatever the outcome.** For each processed issue that
   contained an email (dedicated "Submitter email:" line or anywhere in the note), **author
   a personalized email in Cinnamon's voice** per `docs/CINNAMON.md` §5 and trigger
   `notify-submitter.yml` (`actions_run_trigger`, `run_workflow`) with
   `inputs: { issue_number, body, subject }`. Added → the thank-you with links. Held,
   unverifiable, or plain confusing → still send: warm, honest, what he tried, why it
   didn't land, invitation to try again. Only obvious spam/abuse gets silence. (The
   workflow self-skips if mail secrets aren't set.)
   **Before writing the LINE message's email-status line (§5), check whether it actually
   sent:** the workflow posts `📧 Submitter thanked by email…` as a comment on the issue when
   it succeeds. Give it a few seconds, then re-check the issue's comments — if that comment
   appeared, report "sent"; if it didn't (workflow still running, or mail secrets aren't
   configured), report "requested" / "not sent" honestly rather than assuming success.
8. **Update the report file** `tools/reports/latest.json` (§4) — this is now just the backstop's
   data source (audit trail + "did today's automation actually run" signal), not the primary
   notification path.
9. **Message the maintainer directly.** Author the LINE message per §5 and trigger `line-notify.yml`
   (`actions_run_trigger`, `run_workflow`, with `inputs: { message: "<your text>" }`) so it sends
   **right now** — this is the maintainer's actual notification for this run.

If your usage quota is exhausted mid-run, that's fine and expected occasionally: whatever
didn't get processed stays open, `latest.json` keeps its last date, and the daily backstop
(`line-notify.yml`'s schedule trigger) will notice items waiting with no fresh completed run
and send a heads-up.

---

## 4. The report file — `tools/reports/latest.json`

Now that notification is instant and per-run (via `line-notify.yml`'s on-demand path, §3 step
9), this file's job shrunk to being the **backstop's** data source and an audit trail — it is
no longer how the LINE message gets its content. Still write it every run so the daily backstop
schedule (`line-notify.yml`, ~08:00 JST) can tell "did automation run successfully today."

Write exactly this shape, overwriting the file each run:

```json
{
  "date": "2026-07-17",
  "ran_at": "2026-07-16T19:20:00Z",
  "completed": true,
  "changed": true,
  "added_count": 2,
  "pending_count": 1,
  "skipped_count": 1,
  "new_countries": [],
  "open_inbox_remaining": 0,
  "approx_tokens": 34000,
  "sms_body": "(kept for audit continuity — the actual message was already sent via line-notify.yml in step 9, see §5)"
}
```

Field rules:

- **`date`** — the JST date the run represents (YYYY-MM-DD).
- **`completed`** — `true` if the run finished cleanly; `false`/absent means it died mid-run.
  This is the field the backstop actually cares about.
- **`open_inbox_remaining`** — count of `inbox` issues still open after the run (should be 0 on
  a clean run; >0 signals leftover/failed work).
- **`approx_tokens`** — the same rough token count reported in the LINE message's cost line
  (§5) — an absolute number for comparing run cost over time, never a percentage of a plan cap.
- **`sms_body`** — keep populated with whatever message you sent, for audit/debugging purposes,
  but it is **not read** by the notification path anymore (that's the on-demand `message` input
  to `line-notify.yml`, sent directly in step 9 — see §5).

---

## 5. Writing the LINE message (voice & content)

Sent immediately after each run via `actions_run_trigger` → `line-notify.yml` (`run_workflow`,
`inputs: { message: "<this text>" }`) — see §3 step 9. **The LINE message is Socks reporting
to the boss.** He's the tech lead; this is his job and he loves it. The maintainer still needs
to understand, in one message, exactly what happened — who sent it, what was done, where to
look — so the structure stays crisp; Socks's voice lives in the frame lines, not the data
lines.

**Structure:**

1. **Socks's opener** — one line, his lolcat typing (see `docs/CINNAMON.md` §1):
   `🐈‍⬛ socks here. new mail came in, we handled it. report below (i typed it myself)`
2. **Header** — when it was submitted and by whom, when processing finished:
   `📥 Submitted 2026-07-17 14:32 JST by Maya (maya@example.com)` (omit the parenthetical if no
   email was given; use "anonymous" if no name was given either)
   `⚙️ Processed 2026-07-17 14:35 JST`
3. **Email status line** — always present, right after the header, so the maintainer never has
   to wonder whether a reply actually went out. Confirm via the check in §3 step 7 (look for
   the workflow's own `📧 Submitter thanked by email…` comment) before claiming success:
   - Confirmed sent: `📧 Emailed maya@example.com — thank-you sent`
   - Triggered but not yet confirmed (workflow still running): `📧 Emailed maya@example.com —
     requested, sending now`
   - Found but mail secrets aren't configured: `📧 Found maya@example.com — NOT sent (mail
     secrets not configured)`
   - No address anywhere (dedicated field or note): `📧 No email given — no reply sent`
   Get the actual address from whatever you found (dedicated "Submitter email:" field or
   anywhere in the note) — never just "yes/no."
4. **Per outcome bucket**, only include buckets that have items. Data lines stay clean and
   correctly spelled — links must work and names must be right:
   - `✅ Added (N):` — for each: name + region, then **a real clickable link to its live page**:
     `https://roadside-japan.pages.dev/attractions/<slug>/` (or `/events/<slug>/`). Never the
     github.io URL — it does not resolve for the maintainer.
   - `⏸ Held for your review (N):` — for each: name/description + **why** (one clause) + a link
     to **the GitHub issue** (held items aren't public yet):
     `https://github.com/jasonsheinkopf/roadside_japan/issues/<n>`
   - `❌ Skipped (N):` — for each: a short reason. No link needed.
   - `🆕 New country:` — name it if one was added.
5. **Cost line** — one line reporting this run's own token usage, so the maintainer can compare
   cost across submissions of different sizes over time:
   `📊 ~18K tokens this run · 2 places`
   This is a **token count you observe from the run itself** (rough input+output total for
   everything this run did: verification, authoring, comment/email/report writing) — never a
   percentage of any plan/rate-limit cap. You have no way to see the maintainer's actual
   4-hour or weekly usage-limit state from inside a run, so never claim a before/after % —
   report only the number you can actually know.
6. **Socks's sign-off** — one line, his voice, can react to the content:
   `— socks 🐈‍⬛ (cinnamon sez the donut was "structurally significant." i had a nap)`
7. If the run **couldn't finish** (quota, build failure), Socks says so plainly — being funny
   never obscures a problem: `⚠️ boss, sumthing went rong:` + the plain facts + what's pending.
8. If one trigger fire processed **multiple submitters' issues**, group header + outcomes per
   submitter rather than merging them into one anonymous list.

**Tone/format rules:**
- Voice lines (opener/sign-off): lolcat typing, lowercase, light misspellings. Data lines
  (names, places, links, counts, times): clean and exact. Submitter names always capitalized
  correctly — Socks is serious about names.
- Never quote the raw submission text; paraphrase in a clause ("asked for the tanuki
  tea-kettle temple").
- Scannable — every line earns its place; a few glyphs (🐈‍⬛ 📥 ⚙️ ✅ ⏸ ❌ 🆕 ⚠️), no emoji spam.
- Blank lines between sections — LINE renders plain text, so whitespace IS the formatting.
- The submitter's email is fine to include — this is a **private** message to the maintainer,
  unlike the public `submittedBy:` field (which must never contain an email, per
  `docs/INBOX.md`).

**Example** (single submission, two places, one held):

```
🐈‍⬛ socks here. new mail came in, we handled it. report below (i typed it myself)

📥 Submitted 2026-07-17 14:32 JST by Maya (maya@example.com)
⚙️ Processed 2026-07-17 14:35 JST
📧 Emailed maya@example.com — thank-you sent

✅ Added (2):
• Morinji Temple, Gunma — tanuki tea-kettle temple
  https://roadside-japan.pages.dev/attractions/morinji-temple-tatebayashi/
• Wall Drug, USA — roadside jackalope stop
  https://roadside-japan.pages.dev/attractions/wall-drug/

⏸ Held for your review (1):
• "the Osaka love hotel with the UFO room" — sexual-content adjacent, needs your call
  https://github.com/jasonsheinkopf/roadside_japan/issues/31

No new countries.

📊 ~34K tokens this run · 2 places

— socks 🐈‍⬛ (cinnamon iz still talking abt the tea kettle. send help)
```

The goal: the maintainer reads one message and knows exactly what happened with that submission
— what went live, what needs their eyes, and where to click. Fun frame, exact data.
