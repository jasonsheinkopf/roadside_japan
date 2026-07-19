/**
 * capture-adventures.mjs — records every Adventures film into PNG frame sequences
 * (docs/ADVENTURES.md §7). Run after `SITE_BASE=/ astro build`; then
 * scripts/assemble-gifs.py turns the frames into public/adventures/*.gif.
 *
 * Capture is deterministic, not realtime: the player page (?noloop) is loaded, every
 * animation on it is paused, and the shared CSS timeline is seeked frame by frame via
 * anim.currentTime before each screenshot — so slow machines produce identical GIFs.
 *
 * Playwright is resolved from the global npm root (this repo doesn't depend on it).
 */
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFile, readdir, mkdir, rm } from "node:fs/promises";
import { extname, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const FRAMES = join(ROOT, "node_modules", ".cache", "adventures-frames");
const STEP_MS = 70; // ~14.3 fps — GIF delays are centisecond-quantized, so use a multiple of 10
const WIDTH = 720; // CSS px; captured at 1.5x and downsampled during assembly

const require_ = createRequire(import.meta.url);
let chromium;
for (const spec of ["playwright", "/opt/node22/lib/node_modules/playwright"]) {
  try {
    ({ chromium } = require_(spec));
    break;
  } catch {}
}
if (!chromium) {
  console.error("playwright not found (looked in local and global node_modules)");
  process.exit(1);
}

const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".woff2": "font/woff2",
  ".json": "application/json",
};

const server = createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (path.endsWith("/")) path += "index.html";
    const data = await readFile(join(DIST, path));
    res.writeHead(200, { "content-type": MIME[extname(path)] ?? "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;

const films = (await readdir(join(ROOT, "src", "data", "adventures")))
  .filter((f) => f.endsWith(".svg"))
  .map((f) => f.replace(/\.svg$/, ""))
  .filter((f) => process.argv.length < 3 || process.argv.slice(2).some((a) => f.includes(a)));
if (films.length === 0) {
  console.log("no films to capture");
  process.exit(0);
}

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" }).catch(() => chromium.launch());
const page = await browser.newPage({
  viewport: { width: WIDTH + 40, height: 900 },
  deviceScaleFactor: 1.5,
});

for (const film of films) {
  const [slug, model] = [film.replace(/\.[a-z]+$/, ""), film.split(".").pop()];
  const dir = join(FRAMES, film);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });

  await page.goto(`http://127.0.0.1:${port}/adventures/${slug}/${model}/?noloop`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const totalMs = await page.$eval(".adv-film", (el) => Number(el.dataset.totalMs));
  await page.evaluate(() => {
    window.__anims = document.getAnimations();
    for (const a of window.__anims) a.pause();
  });
  // Record the film itself (stage + subtitle bar) — not the label chrome above it,
  // which describes the *player* and would be wrong baked into a GIF.
  const box = await page.locator(".adv-film .adv-restart").boundingBox();
  const clip = { x: Math.floor(box.x), y: Math.floor(box.y), width: Math.ceil(box.width), height: Math.ceil(box.height) };

  const frames = Math.ceil(totalMs / STEP_MS);
  for (let k = 0; k < frames; k++) {
    await page.evaluate((t) => {
      for (const a of window.__anims) a.currentTime = t;
      return new Promise((r) => requestAnimationFrame(() => r()));
    }, k * STEP_MS);
    await page.screenshot({ clip, path: join(dir, `f${String(k).padStart(4, "0")}.png`) });
  }
  console.log(`${film}: ${frames} frames (${(totalMs / 1000).toFixed(1)}s) → ${dir}`);
}

await browser.close();
server.close();
console.log(`frame step ${STEP_MS}ms; assemble with: python3 scripts/assemble-gifs.py`);
