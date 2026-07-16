# tools/reports/ — machine-written run state

**Do not hand-edit `latest.json`.** It is overwritten by the automated inbox-triage job (see
[`docs/AUTONOMOUS_TRIAGE.md`](../../docs/AUTONOMOUS_TRIAGE.md) §4).

Processing is **event-driven**: a Claude Code Routine fires the instant a new GitHub issue
labeled `inbox` is opened (runs on the maintainer's subscription), processes it, and — as its
*primary* notification path — authors a LINE message and triggers `line-notify.yml` on demand so
the maintainer hears about the outcome right away. This file is no longer in that critical path;
it's written every run purely as:

- an **audit trail** of when automated triage ran and what it did, and
- the data source for a once-daily **backstop** (`line-notify.yml`'s schedule trigger, ~08:00
  JST) that checks whether anything's stuck (items waiting, no successful run recorded today)
  and warns the maintainer only if so. On a quiet, healthy day it stays silent.

The seed value (`date: 1970-01-01`, `completed: true`, `changed: false`) means "no run has
happened yet."
