# Submission Worker — "Add a place" without GitHub

This tiny Cloudflare Worker is what lets the website (and the ChatGPT flow) add a place with
**no GitHub login and no copy-paste**. The browser POSTs a place to the Worker; the Worker
commits a schema-valid, auto-published Markdown file to the repo using a GitHub token it keeps
secret. The commit triggers your normal Pages build, so the place shows up on the map a minute
or two later.

```
Browser / ChatGPT  ──POST place JSON──▶  Worker (holds GitHub token)  ──commit .md──▶  repo  ──▶  Pages rebuild
```

Why this exists: GitHub Pages is static and web ChatGPT can't write anywhere itself, so
*something* with a secret token has to do the write. This is that something — and the token
never touches the public site.

---

## One-time setup (~5 minutes)

You'll do this once; after that, submitting is just tapping a button.

### 1. Create a GitHub token (so the Worker can commit)

1. Go to **GitHub → Settings → Developer settings → Fine-grained tokens → Generate new token**.
2. **Repository access:** Only select repositories → `roadside_japan`.
3. **Permissions → Repository permissions → Contents: Read and write.** (Nothing else is needed.)
4. Generate it and **copy the token** (starts with `github_pat_…`). You won't see it again.

### 2. Deploy the Worker

From this folder (`tools/submit-worker/`):

```bash
npm install -g wrangler        # or: npx wrangler ...
wrangler login                 # opens the browser, sign in / create a free Cloudflare account
wrangler secret put GITHUB_TOKEN   # paste the token from step 1 when prompted
wrangler deploy
```

`wrangler deploy` prints your Worker URL, e.g.:

```
https://roadside-submit.<your-subdomain>.workers.dev
```

### 3. Point the site at the Worker

Add the URL as a build variable so the website knows where to POST. Either:

- **Locally** (`.env`): `PUBLIC_SUBMIT_ENDPOINT=https://roadside-submit.<your-subdomain>.workers.dev`
- **In CI** (GitHub → Settings → Secrets and variables → Actions → **Variables**): add
  `PUBLIC_SUBMIT_ENDPOINT` with the same value. The deploy workflow passes it through to the build.

Rebuild/redeploy the site. Done — `/submit` and the ChatGPT link now publish directly.

> Until `PUBLIC_SUBMIT_ENDPOINT` is set, the site falls back to the old "open a GitHub issue"
> path, so nothing breaks in the meantime.

---

## Test it

```bash
curl -X POST https://roadside-submit.<your-subdomain>.workers.dev \
  -H 'Content-Type: application/json' \
  -d '{"title":"Test Spot","summary":"A quick test of the submission worker pipeline.","prefecture":"tokyo","category":"oddity","lat":35.68,"lng":139.76}'
# → {"ok":true,"slug":"test-spot","url":"https://jasonsheinkopf.github.io/roadside_japan/attractions/test-spot"}
```

(Delete the test file afterwards — it's a normal commit in `src/content/attractions/`.)

---

## What it accepts

POST JSON. Required: `title`, `summary` (or `description`), `prefecture` (slug), `lat`, `lng`
(inside Japan). Optional: `category` (defaults to `oddity`), `city`, `seasons[]`, `months[]`,
`website`, `submittedBy`, `description`. Anything that wouldn't pass the content schema is
rejected with a clear error **before** it's committed, so a bad submission can never break the
build.

## Notes & hardening (later)

- **Auto-publish, no review** — by design (it's your atlas). To switch to a review queue
  instead, change `approval: published` → `approval: pending` in `worker.js` (`buildMarkdown`).
- **Open endpoint** — `Access-Control-Allow-Origin: *` and no auth means anyone who finds the
  URL could submit. Damage is limited (valid, Japan-bounded entries only; every change is a
  revertable commit). When you want to lock it down: set CORS to your site origin, add a shared
  secret header, or put Cloudflare Turnstile in front. See the comments in `worker.js`.
