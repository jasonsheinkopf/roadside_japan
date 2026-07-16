/**
 * Cinnamon Land submission drop box — a tiny Cloudflare Worker.
 *
 * WHY THIS EXISTS: the site is fully static (GitHub Pages / Cloudflare Pages), so it
 * cannot receive a POST from a visitor's browser on its own. This worker is the one
 * small piece of live infrastructure: it accepts an anonymous free-text submission
 * (no visitor account of any kind) and files it as a GitHub Issue labeled `inbox` in
 * the (private) content repo, where the maintainer's AI agent triages it on demand.
 * See docs/INBOX.md in the repo for the full pipeline.
 *
 * Deploy: paste this file into a new Worker at dash.cloudflare.com (or `wrangler deploy`),
 * then set two secrets and (optionally) one var — full steps in ./README.md:
 *   GITHUB_TOKEN     (secret) fine-grained PAT, Issues: Read & Write on the one repo
 *   GITHUB_REPO      (var)    e.g. "jasonsheinkopf/roadside_japan"
 *   ALLOWED_ORIGIN   (var, optional) e.g. "https://jasonsheinkopf.github.io" — if set,
 *                    cross-origin POSTs from other sites are refused.
 */

const MAX_LEN = 20000;

function corsHeaders(env, origin) {
  const allow = env.ALLOWED_ORIGIN && origin === env.ALLOWED_ORIGIN ? env.ALLOWED_ORIGIN : env.ALLOWED_ORIGIN ? "" : "*";
  return {
    "Access-Control-Allow-Origin": allow || "null",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function json(body, status, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extra },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(env, origin);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method === "GET") {
      return json({ ok: true, service: "cinnamon-land-inbox", hint: "POST { text } to submit" }, 200, cors);
    }
    if (request.method !== "POST") return json({ ok: false, error: "method not allowed" }, 405, cors);

    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ ok: false, error: "expected JSON" }, 400, cors);
    }

    // Honeypot: real visitors never fill this hidden field. Pretend success to bots.
    if (typeof payload.hp === "string" && payload.hp.length > 0) return json({ ok: true }, 200, cors);

    const text = typeof payload.text === "string" ? payload.text.trim() : "";
    if (text.length < 3) return json({ ok: false, error: "tell us at least a little" }, 400, cors);
    if (text.length > MAX_LEN) return json({ ok: false, error: `too long (max ${MAX_LEN} chars)` }, 400, cors);

    // First line of the text becomes a readable issue title.
    const firstLine = text.split("\n")[0].replace(/\s+/g, " ").trim();
    const title = `📮 ${firstLine.length > 70 ? firstLine.slice(0, 67) + "…" : firstLine}`;

    const body = [
      "**New drop-box submission** — raw visitor text, unreviewed. Triage per `docs/INBOX.md`.",
      "",
      "```text",
      // Prevent the visitor's text from closing our fence.
      text.replace(/```/g, "ʼʼʼ"),
      "```",
      "",
      `_Received ${new Date().toISOString()} via the Cinnamon Land submit page._`,
    ].join("\n");

    const gh = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "cinnamon-land-inbox-worker",
      },
      body: JSON.stringify({ title, body, labels: ["inbox"] }),
    });

    if (!gh.ok) {
      // Never leak GitHub error detail to the public.
      console.error("GitHub issue creation failed:", gh.status, await gh.text());
      return json({ ok: false, error: "could not save your note — please try again later" }, 502, cors);
    }

    return json({ ok: true }, 200, cors);
  },
};
