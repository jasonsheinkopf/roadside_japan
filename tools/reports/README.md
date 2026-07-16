# tools/reports/ — machine-written run state

**Do not hand-edit `latest.json`.** It is overwritten by the automated daily triage job
(see [`docs/AUTONOMOUS_TRIAGE.md`](../../docs/AUTONOMOUS_TRIAGE.md) §4).

It is the handoff between two schedules:

- **~04:00 JST** — a Claude Code Routine (runs on the maintainer's subscription) processes the
  community inbox and *writes* this file, including the human-readable `sms_body` it authored.
- **~07:00 JST** — the `daily-status-sms.yml` GitHub Action *reads* this file (plus the live
  open-`inbox` issue count) and texts the maintainer via Twilio — but only if something changed
  or something needs attention. On a quiet day it stays silent.

The seed value (`date: 1970-01-01`, `changed: false`) means "no run has happened yet," so the
07:00 job won't send anything until the first real run overwrites it.

The git history of this one file doubles as an audit trail of when the automated job ran and
what it did.
