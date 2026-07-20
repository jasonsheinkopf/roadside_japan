/**
 * preview-adventure.mjs — instant single-frame render of one Adventures film scene,
 * for authoring iteration (docs/ADVENTURES.md). No astro build needed: the film SVG is
 * wrapped in a bare HTML page with the shared cast defs, the timeline is seeked to the
 * requested moment, and one PNG is written.
 *
 *   node scripts/preview-adventure.mjs src/data/adventures/foo.sonnet.svg out.png [scene#] [secsIntoScene]
 *
 * scene# is 1-based (default 1); secsIntoScene defaults to mid-scene. The scene is shown
 * in isolation (other scenes hidden) with all animations seeked to the absolute film time,
 * exactly like the real runtime would show it.
 */
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TITLE_S = 2.6; // must match AdventureFilm.astro

const [, , filmPath, outPath, sceneArg, atArg] = process.argv;
if (!filmPath || !outPath) {
  console.error("usage: node scripts/preview-adventure.mjs <film.svg> <out.png> [scene#] [secsIntoScene]");
  process.exit(1);
}

const raw = readFileSync(filmPath, "utf8");
const durs = [...raw.matchAll(/<g\b[^>]*class="scene"[^>]*>/g)].map(
  (m) => Number(m[0].match(/data-dur="([^"]*)"/)?.[1] ?? 3),
);
if (durs.length === 0) {
  console.error("no <g class=\"scene\"> groups found");
  process.exit(1);
}
const scene = Math.min(Math.max(Number(sceneArg ?? 1), 1), durs.length);
const start = TITLE_S + durs.slice(0, scene - 1).reduce((a, b) => a + b, 0);
const at = atArg !== undefined ? Number(atArg) : durs[scene - 1] / 2;
const tMs = Math.round((start + at) * 1000);

// Cast defs: the inner <svg> of the Astro component (strip frontmatter fences).
const defsSrc = readFileSync(join(ROOT, "src", "components", "AdventureCastDefs.astro"), "utf8");
const defs = defsSrc.slice(defsSrc.indexOf("<svg"));

const vars = durs
  .map((_, i) => `--t${i + 1}:${(TITLE_S + durs.slice(0, i).reduce((a, b) => a + b, 0)).toFixed(3)}s;`)
  .join("");
const html = `<!doctype html><html><head><style>
  body{margin:0;background:#111}
  #stage{width:720px;--x:0;${vars}}
  #stage>svg{display:block;width:100%;height:auto;background:#000}
  #stage>svg>g.scene{visibility:hidden}
  #stage>svg>g.scene:nth-of-type(${scene}){visibility:visible}
</style></head><body>${defs}<div id="stage">${raw}</div></body></html>`;

const require_ = createRequire(import.meta.url);
let chromium;
for (const spec of ["playwright", "/opt/node22/lib/node_modules/playwright"]) {
  try {
    ({ chromium } = require_(spec));
    break;
  } catch {}
}
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" }).catch(() => chromium.launch());
const page = await browser.newPage({ viewport: { width: 760, height: 560 }, deviceScaleFactor: 1.5 });
await page.setContent(html);
await page.evaluate((t) => {
  for (const a of document.getAnimations()) {
    a.pause();
    a.currentTime = t;
  }
  return new Promise((r) => requestAnimationFrame(() => r()));
}, tMs);
await page.locator("#stage").screenshot({ path: outPath });
await browser.close();
console.log(`${outPath}: scene ${scene}/${durs.length} at +${at.toFixed(2)}s (film t=${(tMs / 1000).toFixed(2)}s)`);
