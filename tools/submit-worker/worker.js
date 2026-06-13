/**
 * Roadside Japan — submission Worker (Cloudflare).
 *
 * A ~zero-friction write path for the static site: the browser POSTs a place here and this
 * Worker commits a SCHEMA-VALID, auto-published Markdown entry straight into the repo using a
 * stored GitHub token. The push triggers the normal Pages rebuild, so the place appears on the
 * map a minute or two later — no GitHub login, no copy-paste, no review step.
 *
 * WHY A WORKER AT ALL: GitHub Pages is static and ChatGPT (web) can't write anywhere on its
 * own. Something holding a secret token must do the write; this is that something. The token
 * lives only here (a Worker secret), never in the public site.
 *
 * SAFETY: auto-publish means a bad file would fail the site build, so this validates every
 * field the content schema (src/content.config.ts) requires — prefecture, category, and
 * Japan-bounded coordinates — and refuses anything that wouldn't pass. Keep these lists in
 * sync with src/data/vocab.ts + src/data/prefectures.ts if they change.
 *
 * SETUP: see tools/submit-worker/README.md.
 */

const OWNER = "jasonsheinkopf";
const REPO = "roadside_japan";
const BRANCH = "main";
const DIR = "src/content/attractions";
const PAGES_BASE = `https://${OWNER}.github.io/${REPO}`;

// Mirrors of the content vocabulary (kept small + inline so the Worker has no build step).
const PREFECTURES = new Set([
  "hokkaido", "aomori", "iwate", "miyagi", "akita", "yamagata", "fukushima",
  "ibaraki", "tochigi", "gunma", "saitama", "chiba", "tokyo", "kanagawa",
  "niigata", "toyama", "ishikawa", "fukui", "yamanashi", "nagano", "gifu", "shizuoka", "aichi",
  "mie", "shiga", "kyoto", "osaka", "hyogo", "nara", "wakayama",
  "tottori", "shimane", "okayama", "hiroshima", "yamaguchi",
  "tokushima", "kagawa", "ehime", "kochi",
  "fukuoka", "saga", "nagasaki", "kumamoto", "oita", "miyazaki", "kagoshima", "okinawa",
]);
const CATEGORIES = new Set([
  "nature", "scenic", "food", "museum", "roadside", "religious", "art", "history",
  "oddity", "abandoned", "viewpoint", "shop", "experience", "animal", "festival",
]);
const SEASONS = new Set(["spring", "summer", "autumn", "winter"]);

const CORS = {
  "Access-Control-Allow-Origin": "*", // tighten to your site origin once you're past testing
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (request.method !== "POST") return json({ ok: false, error: "POST only" }, 405);

    if (!env.GITHUB_TOKEN) return json({ ok: false, error: "Worker missing GITHUB_TOKEN secret" }, 500);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: "Invalid JSON body" }, 400);
    }

    // Honeypot: bots fill hidden fields. Pretend success so they don't retry.
    if (typeof body.hp === "string" && body.hp.length > 0) return json({ ok: true, slug: "ignored" });

    const v = validate(body);
    if (!v.ok) return json({ ok: false, error: v.error }, 400);

    try {
      const baseSlug = slugify(v.data.title);
      const slug = await uniqueSlug(env, baseSlug);
      const path = `${DIR}/${slug}.md`;
      const md = buildMarkdown(v.data);
      await commitFile(env, path, md, `Add discovery: ${v.data.title} (web submission)`);
      return json({ ok: true, slug, url: `${PAGES_BASE}/attractions/${slug}` });
    } catch (err) {
      return json({ ok: false, error: String(err?.message || err) }, 502);
    }
  },
};

// ---------------------------------------------------------------------------- validation

function validate(b) {
  const title = str(b.title);
  if (title.length < 2) return err("A name (title) is required.");

  let summary = str(b.summary) || str(b.description);
  summary = summary.replace(/\s+/g, " ").trim();
  if (summary.length < 10) return err("Tell us a bit more — the summary is too short (min 10 chars).");
  if (summary.length > 280) summary = summary.slice(0, 277).trimEnd() + "…";

  const prefecture = str(b.prefecture).toLowerCase();
  if (!PREFECTURES.has(prefecture)) return err(`Unknown prefecture "${b.prefecture}". Use a valid prefecture slug.`);

  const category = (str(b.category).toLowerCase() || "oddity");
  if (!CATEGORIES.has(category)) return err(`Unknown category "${b.category}".`);

  const lat = num(b.lat);
  const lng = num(b.lng);
  if (lat === null || lat < 20 || lat > 46) return err("Latitude must be within Japan (20–46).");
  if (lng === null || lng < 122 || lng > 154) return err("Longitude must be within Japan (122–154).");

  const seasons = arr(b.seasons).map((s) => String(s).toLowerCase()).filter((s) => SEASONS.has(s));
  const months = arr(b.months).map(num).filter((m) => m !== null && m >= 1 && m <= 12);

  let website = str(b.website);
  if (website && !/^https?:\/\/\S+$/i.test(website)) website = ""; // schema requires a real URL; drop if not

  const description = str(b.description) || summary;
  const city = str(b.city);
  const submittedBy = str(b.submittedBy) || "anonymous";

  return {
    ok: true,
    data: { title, summary, description, prefecture, category, lat, lng, seasons, months, website, city, submittedBy },
  };
}

// ---------------------------------------------------------------------------- markdown

function buildMarkdown(d) {
  const today = new Date().toISOString().slice(0, 10);
  const lines = [
    "---",
    `title: ${yamlStr(d.title)}`,
    `summary: ${yamlStr(d.summary)}`,
    `prefecture: ${d.prefecture}`,
  ];
  if (d.city) lines.push(`city: ${yamlStr(d.city)}`);
  lines.push(`lat: ${d.lat}`, `lng: ${d.lng}`, `category: ${d.category}`, `tags: [community-submission]`);
  if (d.seasons.length) lines.push(`seasons: [${d.seasons.join(", ")}]`);
  if (d.months.length) lines.push(`months: [${d.months.join(", ")}]`);
  if (d.website) lines.push(`website: ${yamlStr(d.website)}`);
  lines.push(
    `status: open`,
    `approval: published`,
    `source: community`,
    `submittedBy: ${yamlStr(d.submittedBy)}`,
    `featured: false`,
    `createdAt: ${today}`,
    `updatedAt: ${today}`,
    "---",
    "",
    d.description.trim(),
    "",
  );
  return lines.join("\n");
}

/** YAML-safe double-quoted scalar. JSON.stringify escapes quotes/backslashes/newlines, all of
 *  which a YAML double-quoted string accepts. */
function yamlStr(s) {
  return JSON.stringify(String(s));
}

// ---------------------------------------------------------------------------- GitHub API

async function gh(env, path, init = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "roadside-japan-submit-worker",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.headers || {}),
    },
  });
  return res;
}

async function pathExists(env, path) {
  const res = await gh(env, `/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`);
  return res.status === 200;
}

async function uniqueSlug(env, base) {
  let slug = base || `place-${Date.now().toString(36)}`;
  for (let i = 0; i < 6; i++) {
    const candidate = i === 0 ? slug : `${base}-${i + 1}`;
    if (!(await pathExists(env, `${DIR}/${candidate}.md`))) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

async function commitFile(env, path, content, message) {
  const res = await gh(env, `/repos/${OWNER}/${REPO}/contents/${path}`, {
    method: "PUT",
    body: JSON.stringify({ message, content: toBase64(content), branch: BRANCH }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`GitHub commit failed (${res.status}): ${detail.slice(0, 200)}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------- helpers

function slugify(s) {
  return String(s)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

function toBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

const str = (x) => (typeof x === "string" ? x.trim() : x == null ? "" : String(x).trim());
const num = (x) => {
  if (x === null || x === undefined || x === "") return null;
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
};
const arr = (x) => (Array.isArray(x) ? x : typeof x === "string" && x ? x.split(",").map((s) => s.trim()) : []);
const err = (error) => ({ ok: false, error });

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}
