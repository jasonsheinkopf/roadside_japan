# Notifications setup — daily auto-triage, the status text, and submitter emails

This is the one-time setup you do at your computer. Everything on the code side is already
built; this page is just the secrets and the switch-on. Three independent pieces — do any or
all:

- **A. The daily automatic triage** (4 AM JST) — Claude processes the inbox on your
  subscription, no phone needed. *(Already scheduled as a Routine — see §D.)*
- **B. The daily status text** (7 AM JST) — a text message, only when something changed.
- **C. Submitter emails** — emails the person who submitted, after their note is processed.

None of these send anything until its secrets exist, so it's safe to set them up one at a time.

> **Activation gate (do this first): merge to `main`.** Scheduled GitHub Actions only run from
> the default branch, and the 4 AM Routine clones `main`. So the very first step is getting this
> branch merged into `main`. Until then, nothing fires. (Ask me to open the PR, or merge it
> yourself.)

---

## A. The daily automatic triage (4 AM JST) — already set up on my end

A **Routine** (Claude Code scheduled trigger) is what runs "process the inbox" for you every
morning, on your Claude subscription — exactly like you opening the app and asking, but
automatic. It:

- fires ~04:00 Japan time daily,
- reads open `inbox` issues and processes them per
  [`docs/AUTONOMOUS_TRIAGE.md`](./AUTONOMOUS_TRIAGE.md) (strict safety gate; clearly-safe places
  go live, anything borderline is **held** for you, junk is rejected),
- publishes, commits, and pushes to `main`,
- writes the status report the 7 AM text is built from,
- triggers submitter emails (piece C) for anyone who left an address.

**What you need to do:** nothing to *create* it — I've set it up (or given you the exact
instructions if the automated setup couldn't complete; see §D). Two things to know:

- It runs on your **subscription quota**. On the $20/mo plan a daily run over a small inbox is
  cheap, but if you're out of quota that morning, the run is skipped — and the 7 AM text will
  tell you there are items waiting (that's the safety net).
- It only does real work when there's something in the inbox. Empty inbox = a few seconds and
  it stops.

If you ever want to **pause** it, tell me "pause the daily triage" (or disable the Routine from
the Claude Code Routines UI). To run it **right now** as a test, tell me "run the triage now."

---

## B. The daily status text (7 AM JST) via Twilio — ~10 min

You get **one text per day, and only if something changed** (places added, something held for
your review, or items waiting because the run couldn't finish). Quiet day = no text. It's an
AI-written summary: who submitted what, what got added, anything held, any new country.

### 1. Make a Twilio account & get a number (5 min)

1. Sign up at [twilio.com/try-twilio](https://www.twilio.com/try-twilio) (free trial includes
   credit; SMS is ~$0.008 each, so this costs pennies/month).
2. In the Console, note your **Account SID** (starts `AC…`) and **Auth Token** (click to reveal).
3. **Phone Numbers → Buy a number** with **SMS** capability (a ~$1/mo US local number is fine).
   This is your `TWILIO_FROM_NUMBER`, in E.164 form like `+15551234567`.
4. **Trial-account note:** a trial can only text *verified* numbers. Add your Google Voice
   number under **Phone Numbers → Verified Caller IDs** (Twilio texts/calls it a code once).
   Once you upgrade (add a little credit), that restriction goes away.
5. **US A2P note:** sending to/from US long-code numbers may require a quick, free A2P 10DLC
   registration in the Twilio console. For one recipient (you), a **toll-free** number
   (also selectable when buying) is the least-friction option and is fine for this volume.

### 2. Add four repo secrets (2 min)

GitHub → this repo → **Settings → Secrets and variables → Actions → New repository secret**.
Add all four:

| Secret | Value |
| --- | --- |
| `TWILIO_ACCOUNT_SID` | your `AC…` SID |
| `TWILIO_AUTH_TOKEN` | your auth token |
| `TWILIO_FROM_NUMBER` | your Twilio number, e.g. `+15551234567` |
| `ALERT_TO_NUMBER` | where to text you — your Google Voice number, e.g. `+15559876543` |

### 3. Test it (1 min)

GitHub → **Actions → "Daily status SMS" → Run workflow →** set **force = true → Run**. You
should get a test text within a minute. If not, open the run log — the "Decide what to send"
and "Send SMS via Twilio" steps print exactly what happened (Twilio errors are surfaced without
leaking secrets). Common trial gotcha: recipient number not verified (step 1.4).

After the test, normal days send only when there's news.

---

## C. Submitter emails via Gmail — ~5 min *(optional, unchanged from before)*

Emails the person who submitted a note, once their submission is processed. Already built as
`.github/workflows/notify-submitter.yml`; the 4 AM triage triggers it automatically.

GitHub → repo → **Settings → Secrets and variables → Actions**, add two secrets:

- `MAIL_USERNAME` — a Gmail address to send from (a dedicated one is fine).
- `MAIL_PASSWORD` — a Gmail **App Password** (Google Account → Security → 2-Step Verification →
  App passwords → create one for "Mail"). *Not* your normal password.

No secrets → the email step just skips; everything else still works.

---

## D. The Routine (piece A) — exact settings, in case you need to (re)create it

If I was able to create it for you, it's already live and you can skip this. If not (e.g. a
permissions hiccup during setup), create it yourself from the Claude Code **Routines** UI, or
just ask me again — the settings are:

- **Schedule:** daily, ~04:00 Japan time. (I set cron `17 19 * * *` assuming the Routine runs in
  **UTC**: 19:17 UTC = 04:17 JST. **Verify the "next run" time** shows early-morning Japan; if it's
  off by the UTC offset, adjust the hour.)
- **Session:** fresh session each fire (standalone), on **Sonnet**.
- **Prompt:**

  > You are the automated daily inbox-triage agent for the Cinnamon Land atlas. Make sure you
  > are on the latest `main`. If `docs/AUTONOMOUS_TRIAGE.md` does not exist, do nothing and
  > exit. Otherwise follow it exactly: process every open GitHub issue labeled `inbox` per
  > `docs/INBOX.md` plus the safety gate in `docs/AUTONOMOUS_TRIAGE.md`, choosing
  > PUBLISH / HOLD (`pending`) / REJECT for each place; author full entries with the photo
  > pipeline and Cinnamon scene; run `npm run data:validate && npm run build` and never push a
  > broken build; write `tools/reports/latest.json` (including the `sms_body` you author); commit
  > and push to `main`; and trigger `notify-submitter.yml` for any processed issue that included
  > an email. Do not ask for confirmation — this is unattended. When in doubt, HOLD, never PUBLISH.

---

## How the pieces fit

```
visitor submits ─▶ Cloudflare Worker ─▶ GitHub Issue (label: inbox)
                                                │
                    ~04:00 JST  Routine (your subscription, Sonnet)
                    reads inbox ─▶ verifies + safety-gates ─▶ publishes / holds / rejects
                    ─▶ pushes to main ─▶ writes tools/reports/latest.json
                    ─▶ triggers submitter emails (piece C)
                                                │
                    ~07:00 JST  GitHub Action (free cron)
                    reads latest.json + open-inbox count
                    ─▶ texts you via Twilio ONLY if something changed / needs you (piece B)
```

You do nothing day-to-day. You get a morning text only when there's news; if it says something
was **held for review**, that's your cue to open the site and take a look.
