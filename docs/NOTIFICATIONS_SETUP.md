# Notifications setup — instant auto-triage, the LINE report, and submitter emails

This is the one-time setup you do at your computer. Everything on the code side is already
built; this page is just the secrets and the switch-on. Three independent pieces — do any or
all:

- **A. Instant automatic triage** — the moment someone submits, Claude processes it on your
  subscription, no phone needed. *(Already set up as a Routine — see §D — fires on the GitHub
  "issue opened" event, not a schedule.)*
- **B. The per-submission LINE report** — a message sent right after each submission is
  processed, with what got added/held/skipped and links to each. Free — no phone number, no
  per-message cost. A once-a-day backstop also exists in case a run silently fails.
- **C. Submitter emails** — emails the person who submitted, after their note is processed.

None of these send anything until its secrets exist, so it's safe to set them up one at a time.

> **Activation gate (do this first): merge to `main`.** The event-driven Routine and the daily
> backstop Action both read/run against `main`. So the very first step is getting the relevant
> branch merged. Until then, nothing fires. (Ask me to open the PR, or merge it yourself.)

---

## A. Instant automatic triage — already set up on my end

A **Routine** (Claude Code scheduled/event trigger) runs "process the inbox" for you the moment
someone submits, on your Claude subscription — like you opening the app and asking, but
automatic and immediate. It:

- **fires on a GitHub event**: a new issue opened with label `inbox` (i.e. the instant the
  submission worker files one) — not on a timer,
- processes that submission (and any other still-open `inbox` issues) per
  [`docs/AUTONOMOUS_TRIAGE.md`](./AUTONOMOUS_TRIAGE.md) (strict safety gate; clearly-safe places
  go live, anything borderline is **held** for you, junk is rejected),
- publishes, commits, and pushes to `main`,
- **sends you a LINE message right then** with the outcome (piece B) — not on a delay,
- triggers submitter emails (piece C) for anyone who left an address.

**What you need to do:** nothing to *create* it — already set up in the Claude Code Routines UI
under the name **"Cinnamon Land Submission Review"**, trigger type **GitHub event → Issue
opened**, filtered to **label is one of `inbox`**. Two things to know:

- It runs on your **subscription quota**. Occasional submissions are cheap; if you were ever out
  of quota when one arrived, that run would be skipped — the daily backstop (piece B) catches
  this and tells you items are waiting.
- It only does real work when there's actually a new `inbox` issue. No submissions = it simply
  never fires.

If you ever want to **pause** it, disable the Routine from the Claude Code Routines UI (or tell
me to). To test it, submit something through `/submit` on the live site and watch for the LINE
message that follows.

---

## B. The per-submission LINE report (+ daily backstop) — ~5 min

**Primary path:** every time a submission gets processed, you get **one LINE message right
after**, describing exactly what happened with that submission — who submitted it (name + email
if given), when, what got added (with a link to each live page), what's held for your review
(with a link to the GitHub issue), what was skipped, and any new country. See
`docs/AUTONOMOUS_TRIAGE.md` §5 for the exact format the agent writes.

**Backstop path:** once a day (~08:00 JST) a free GitHub Action checks whether anything's stuck
— items waiting with no successful run today — and sends a warning only if so. Normal days it's
completely silent; this exists purely in case the event trigger ever misses.

This uses the **LINE Messaging API** — free at this volume, no phone number, no per-message
cost. You already have a channel set up (from the `sockscam` project) with a channel access
token and your personal LINE user ID, so this is mostly reusing what exists.

### 1. What you need

From your existing LINE Messaging API channel (LINE Developers Console →
[developers.line.biz/console](https://developers.line.biz/console/) → your provider → your
channel → **Messaging API** tab):

- **Channel access token (long-lived)** — issue one if you don't already have it saved. This is
  `LINE_TOKEN`.
- **Your LINE user ID** — the personal one you already have from `sockscam` (not a group ID,
  since this is just for you). This is `LINE_USER_ID`.

If you're reusing the same channel as `sockscam`, that's fine — a channel can push to multiple
different user IDs / for multiple purposes; nothing here conflicts with that project.

### 2. Add two repo secrets (2 min)

GitHub → this repo → **Settings → Secrets and variables → Actions → New repository secret**.
Add both:

| Secret | Value |
| --- | --- |
| `LINE_TOKEN` | your channel access token (long-lived) |
| `LINE_USER_ID` | your personal LINE user ID |

I can't set these myself — no tool available to me can write repo secrets (nor should it; they
shouldn't pass through chat either way). This is the one step that's on you. *(Skip this if
you've already added them — they carry over from the earlier LINE setup.)*

### 3. Test it (1 min)

GitHub → **Actions → "LINE notify" → Run workflow →** leave `message` blank and set
**force = true → Run**. That exercises the backstop path. You should get a test message within
a minute. The real, day-to-day test is simpler: submit something on `/submit` and see if a
report follows.

---

## C. Submitter emails via Gmail — ~5 min

Emails the person who submitted a note, once their submission is processed — a **personalized
thank-you written in Cinnamon's voice** (per `docs/CINNAMON.md` §5): it references what they
actually said, tells them what he found when he went, links each place that's now live with
their name on it, and explains the sender ("my friend Socks the cat is the tech lead — he has
the thumbs, so the email comes from his address"). The automated triage authors and triggers
it by itself; `.github/workflows/notify-submitter.yml` only delivers.

The plan is to send from **Socks's Gmail** (the account you already use for the `sockscam`
project) — the Socks framing in the email is written for exactly that. Note: the workflow
sends via **SMTP + App Password**, not the OAuth `credentials.json`/`token.json` files from
sockscam — those are for Google API clients and can't be used by this Action. The App Password
takes 2 minutes on the same account:

1. Log in to that Google account → [myaccount.google.com](https://myaccount.google.com) →
   **Security** → make sure **2-Step Verification** is on.
2. Security → **App passwords** (search for it if hidden) → create one, name it e.g.
   `cinnamon-land` → copy the 16-character password.
3. GitHub → repo → **Settings → Secrets and variables → Actions**, add two secrets:
   - `MAIL_USERNAME` — the Gmail address itself.
   - `MAIL_PASSWORD` — that 16-character App Password. *Not* the account password.

No secrets → the email step just skips; everything else still works. To test after setup:
Actions → "Notify submitter" → Run workflow, with a real inbox issue number that contains
your own email and any test body.

---

## D. The Routine (piece A) — exact settings, in case you need to (re)create it

Already live in the Claude Code Routines UI. If you ever need to recreate it:

- **Name:** Cinnamon Land Submission Review
- **Repository:** `jasonsheinkopf/roadside_japan`
- **Trigger:** GitHub event → **Issue opened OR Issue labeled**, with a filter: **labels is one
  of `inbox`**. (Not a schedule — this fires the moment a submission comes in. The "labeled"
  half is what lets the watchdog below re-fire this same Routine — see piece E.)
- **Connector:** the repo's GitHub connector (shown as `Claude_Code_Remote` or similar) needs to
  be attached so the agent can read/write issues, commit, and push.
- **Instructions:**

  > You are the automated daily inbox-triage agent for the Cinnamon Land atlas (repo
  > jasonsheinkopf/roadside_japan). This runs UNATTENDED — do not ask for confirmation.
  >
  > 1. Make sure you are on the latest `main`.
  > 2. If `docs/AUTONOMOUS_TRIAGE.md` does NOT exist, do nothing and exit (the feature hasn't
  >    merged yet).
  > 3. Otherwise follow `docs/AUTONOMOUS_TRIAGE.md` exactly, which extends `docs/INBOX.md`:
  >    process every OPEN GitHub issue labeled `inbox`, oldest first; verify each place
  >    independently; apply the safety gate; choose PUBLISH (approval: published, clearly-safe +
  >    clearly-verified only), HOLD (approval: pending, anything borderline), or REJECT; for
  >    multi-place submissions, delegate mechanical sub-steps (frontmatter extraction, snapshot
  >    captions, LINE report data lines) to Haiku subagents per AUTONOMOUS_TRIAGE.md §3's cost
  >    note, keeping the safety-gate decision, entry prose, field report, and thank-you email on
  >    Sonnet; author full entries for PUBLISH/HOLD using the photo pipeline and the full
  >    Cinnamon block (`quote`, `emoji`, `report` field report per `docs/CINNAMON.md`, plus two
  >    `snapshots` for new entries, plus `visitorTip` when the note included a recommendation);
  >    leave the structured triage comment on each issue AS A NEW COMMENT — NEVER by
  >    editing/replacing the issue's body, which holds the submitter's original text and email
  >    (docs/INBOX.md §4 explains why this specific mistake silently breaks the thank-you email);
  >    apply labels, and close it; run `npm run data:validate && npm run build` and never push a
  >    broken build; commit and push to `main`; author a personalized Cinnamon-voice thank-you
  >    email (docs/CINNAMON.md §5) and trigger `notify-submitter.yml` with
  >    `{ issue_number, body, subject }` for any processed issue that included an email;
  >    update `tools/reports/latest.json`; then author a LINE report per §5 and trigger
  >    `line-notify.yml` (`actions_run_trigger`, `run_workflow`, `inputs: { message: "<report>" }`)
  >    so the maintainer hears about it immediately.
  > 4. When in doubt, HOLD — never PUBLISH. Empty inbox → do nothing beyond a short
  >    acknowledgement.

---

## E. The inbox watchdog — catches submissions that arrive while quota is out

**The gap this closes:** the Routine above only fires on the GitHub "issue opened" event. If
your Claude usage was at its cap the instant a submission came in, that event is missed —
nothing re-tries it later on its own.

**The fix — a free GitHub Actions workflow that directly calls the Routine's API endpoint.**
The watchdog fires the Routine programmatically via its "Call via API" trigger:

- `.github/workflows/inbox-watchdog.yml` runs on a schedule **every 15 minutes** (free — GitHub
  Actions cron costs nothing to run this often).
- It lists open issues labeled `inbox` that do **not** also have the `processed` label and are
  **older than ~20 minutes** (a grace window so it never races the instant event-trigger path).
- For each batch found, it fires the Routine's API endpoint directly, passing the stuck issue
  list as context. The Routine processes them on your subscription, on your time.
- If nothing is stuck, the workflow does nothing — silent, zero cost either way.

This means: quota was out when someone submitted → their issue sits open, untouched → within
15–35 minutes of quota returning, the watchdog's next tick notices it's still open and unprocessed
→ calls the Routine's API endpoint → the Routine fires and processes it normally, exactly as if
it had just arrived.

**One-time setup (on you) — two repo secrets (~3 min):**

1. **Get your Routine's API endpoint.**
   - Open the Claude Code Routines UI → find **"Cinnamon Land Submission Review"**.
   - Look for the **"Call via API"** trigger section (or **Triggers → Add → API trigger**).
   - Copy the full **fire URL** and the **authentication token** shown there.

2. **Add two GitHub repo secrets.**
   - GitHub → this repo → **Settings → Secrets and variables → Actions → New repository secret**.
   - Add both:

   | Secret | Value |
   | --- | --- |
   | `ROUTINE_FIRE_URL` | the full fire URL copied above |
   | `ROUTINE_FIRE_TOKEN` | the auth token copied above |

3. **Test it (optional).**
   - GitHub → **Actions → "Inbox watchdog" → Run workflow**.
   - Leave inputs blank, hit **Run**. The workflow will check for stuck issues; if any exist, it
     will fire the Routine. You should see the Routine fire in your Claude Code session activity
     or via the LINE message that follows processing.

**Note:** No changes needed to the Routine's trigger configuration — the API trigger coexists
peacefully with the "Issue: Opened" event trigger.

---

## How the pieces fit

```
visitor submits ─▶ Cloudflare Worker ─▶ GitHub Issue opened (label: inbox)
                                                │
                    Routine fires INSTANTLY (GitHub event trigger, your subscription, Sonnet)
                    reads the issue ─▶ verifies + safety-gates ─▶ publishes / holds / rejects
                    ─▶ pushes to main ─▶ triggers submitter email (piece C)
                    ─▶ authors a LINE report ─▶ triggers line-notify.yml on-demand ─▶ you get
                      a message right away (piece B, primary path)
                                                │
                    ~08:00 JST daily  GitHub Action (free cron, backstop only)
                    reads tools/reports/latest.json + live open-inbox count
                    ─▶ LINE-messages you ONLY if something looks stuck (piece B, safety net)
```

You do nothing day-to-day. You get a LINE message right after each submission is handled,
telling you exactly what happened — added, held for your review, or skipped, each with a link.
If it says something was **held for review**, that's your cue to open the issue and take a look.
