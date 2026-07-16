# Submission drop-box worker — one-time setup (~15 minutes)

The `/submit` page posts a visitor's free text to this tiny Cloudflare Worker, which files
it as a GitHub Issue labeled **`inbox`** in this repo. No visitor account, no database —
the issue queue *is* the inbox. Triage happens per [`docs/INBOX.md`](../../docs/INBOX.md).

## 1. Create a GitHub token (2 min)

GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens →
Generate new token**:

- **Name:** `cinnamon-land-inbox`
- **Repository access:** *Only select repositories* → this repo
- **Permissions:** Repository permissions → **Issues: Read and write**. Nothing else.
- Expiration: your call (1 year is fine; you'll get a reminder email to rotate it).

Copy the token (starts with `github_pat_…`).

## 2. Create the Worker (5 min)

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages → Create → Worker**.
   Name it e.g. `cinnamon-inbox`. Deploy the hello-world it gives you.
2. **Edit code** → replace everything with the contents of [`worker.js`](./worker.js) → **Deploy**.
3. Worker → **Settings → Variables and Secrets**:
   - Add **secret** `GITHUB_TOKEN` = the token from step 1.
   - Add **variable** `GITHUB_REPO` = `jasonsheinkopf/roadside_japan`.
   - (Optional) **variable** `ALLOWED_ORIGIN` = your site origin, e.g.
     `https://jasonsheinkopf.github.io` — refuses posts from other websites.
4. Copy the worker URL, e.g. `https://cinnamon-inbox.<you>.workers.dev`.

## 3. Point the site at it (2 min)

Repo → **Settings → Secrets and variables → Actions → Variables → New repository variable**:

- `PUBLIC_SUBMIT_ENDPOINT` = the worker URL from step 2.

Re-run the deploy (push anything to `main`, or Actions → *Deploy to GitHub Pages* → *Run
workflow*). The submit page detects the variable at build time and switches from
"coming soon" to the live form.

## 4. (Optional) Email notifications (5 min)

To have `.github/workflows/notify-submitter.yml` email people whose submissions were
processed, add two **Actions secrets** (repo → Settings → Secrets and variables → Actions):

- `MAIL_USERNAME` — a Gmail address to send from (a dedicated one is fine)
- `MAIL_PASSWORD` — a Gmail **App Password**: Google Account → Security → 2-Step
  Verification → App passwords → create one for "Mail"

No secrets? The workflow just skips sending — everything else works.

## Verify it works

```bash
curl -X POST https://cinnamon-inbox.<you>.workers.dev \
  -H 'Content-Type: application/json' \
  -d '{"text":"Test: the udon place with silkworms in Gunma. — test@example.com"}'
# → {"ok":true}   and a new `inbox`-labeled issue appears in the repo
```

## Notes

- **Spam:** honeypot field + 20k char cap + (optionally) `ALLOWED_ORIGIN`. If spam ever
  becomes real, add [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)
  (free, invisible captcha) to the form and verify its token in the worker.
- **Privacy:** the repo is private, so submissions (including any email addresses in them)
  are visible only to repo collaborators.
- The Cloudflare free tier (100k requests/day) is far more than this will ever see.
