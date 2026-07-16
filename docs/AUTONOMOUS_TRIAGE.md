# Autonomous daily triage — protocol & safety policy

**Audience: the AI agent running the scheduled 4 AM job.** This file governs the *automated,
unattended* processing of the community inbox. It exists because processing now runs on a
schedule with **no human in the loop at publish time**, so the bar is stricter and the safety
rules are non-negotiable.

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
| **PUBLISH** (`approval: published`) | Verified through independent sources **and** clears every safety check below with no doubt at all. | Author the full entry (photo pipeline + Cinnamon scene) and publish. |
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
   nudity/shock/graphic. Any doubt about an image → ship the entry with **no photo** (the
   Cinnamon scene becomes the hero). Never hotlink or guess.

10. **General taste line.** The atlas can be quirky, macabre-lite, and not-for-toddlers. It must
    never be gross-out, cruel, demeaning, or something the maintainer would be embarrassed to
    have their name on. If you can imagine it causing a "why is this on your site?" email —
    HOLD or REJECT.

Everything else from `docs/INBOX.md` still applies: independent existence check, accuracy,
the "mildly interesting" bar, duplicate check.

---

## 3. The automated run, start to finish

Fire time: **~04:00 Japan time, daily** (see `docs/NOTIFICATIONS_SETUP.md` for the exact
schedule and how it's wired). Model: **Sonnet** is fine for this. Steps:

1. **Guard.** Make sure you're on the latest `main` and that *this file exists*. If it does not
   (e.g. the change hasn't merged yet), **do nothing and exit** — do not process with the old
   two-outcome rules unattended.
2. **Read the queue.** Open GitHub issues labeled `inbox`, oldest first. Zero open → write the
   "no activity" report (§4), commit it, and stop.
3. **Process each** per `docs/INBOX.md` §1–§4 **and** the safety gate above, choosing
   PUBLISH / HOLD / REJECT. Author full entries (frontmatter + photo pipeline + `cinnamon`
   block) for PUBLISH and HOLD. Leave the structured triage comment on each issue, apply
   labels (`processed`, `added`, `country:<slug>`, `spam`), and close it.
4. **New country?** If a submission warrants a country not yet in the atlas and it clearly
   passes, follow AGENTS.md "Add a country." If it's borderline, HOLD the places and note it.
5. **Verify the build.** `npm run data:validate && npm run build`. If the build fails, **do not
   push broken content** — revert the entries to `pending` or drop them, and report the failure.
6. **Write the report** (§4) to `tools/reports/latest.json`, overwriting it.
7. **Commit & push** to `main` (content + the report file). Use a clear message, e.g.
   `Automated inbox triage: +2 published, 1 held, 1 skipped`.
8. **Notify submitters.** For each processed issue that contained an email, trigger
   `notify-submitter.yml` (`actions_run_trigger`) with the issue number and a one-line human
   summary, per `docs/INBOX.md` §5. (It self-skips if mail secrets aren't set.)
9. **Stop.** The 07:00 JST GitHub Action reads `tools/reports/latest.json` and texts the
   maintainer — you do **not** send the SMS yourself (you don't hold the Twilio secrets).

If your usage quota is exhausted and the run can't complete, that's fine and expected
occasionally: the issues stay open, `latest.json` keeps yesterday's date, and the 07:00 job
detects "items waiting + no fresh run" and texts the maintainer a heads-up instead.

---

## 4. The report file — `tools/reports/latest.json`

This is the handoff from the (subscription-run) processing session to the (free, cron-run)
GitHub Action that sends the text. The processing session **generates the human-readable SMS
text itself** (it has the full context of what it just did); the Action only delivers it.

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
  "sms_body": "Cinnamon Land 7/17 report:\n✅ Added 2:\n• Morinji Temple, Gunma — from “Maya” (asked for the tanuki tea-kettle temple). Published.\n• Wall Drug, USA — anonymous. Published.\n⏸ Held 1 for your review: “the Osaka love hotel with the UFO room” — needs your call.\n❌ Skipped 1: unverifiable “cool bridge.”\nNo new countries. 0 still waiting.\nhttps://jasonsheinkopf.github.io/roadside_japan/new"
}
```

Field rules:

- **`date`** — the JST date the run represents (YYYY-MM-DD).
- **`completed`** — `true` if the run finished cleanly; `false`/absent means it died mid-run.
- **`changed`** — `true` if *anything* happened worth a text (added, held, skipped, new country,
  or items still waiting). `false` only on a truly quiet day (no open inbox, nothing done).
- **`open_inbox_remaining`** — count of `inbox` issues still open after the run (should be 0 on
  a clean run; >0 signals leftover/failed work).
- **`sms_body`** — the actual text message, **authored by you**, following §5. Plain text with
  `\n` line breaks. This is what the maintainer reads.

On a **no-activity** day, still write the file with `changed: false` and a short `sms_body`
(the Action will read `changed:false` + empty inbox and send nothing).

---

## 5. Writing the SMS report (voice & content)

The maintainer wants to understand, in one text, **what happened and what changed** — without
opening anything. Write it like a terse, friendly ops report, not marketing copy:

- Lead with counts: added / held / skipped.
- For each **added** and **held** place: its name + region, **who submitted it** (name from the
  note, or "anonymous"), and a *one-clause* paraphrase of what they asked for. Never quote the
  raw submission; summarize it.
- Call out **new countries** explicitly if any ("🆕 Added Vietnam as a country").
- If anything is **held for review**, make that prominent — it's the only part that needs the
  maintainer to act.
- If the run **couldn't finish** (quota, build failure), say so plainly and say what's still
  waiting.
- End with the `/new` link so they can eyeball results.
- Keep it scannable. It may span multiple SMS segments — that's fine — but every line should
  earn its place. No emoji spam; a few status glyphs (✅ ⏸ ❌ 🆕 ⚠️) are enough.

The goal: the maintainer reads one message and knows exactly what their site looks like now and
whether they need to do anything.
