/**
 * preview-scene.mjs — render one Scene Art SVG to a PNG for authoring review.
 *   node scripts/preview-scene.mjs src/data/scenes/foo.opus.svg out.png
 * Wraps the scene with the shared cast defs (AdventureCastDefs) exactly as the site does.
 */
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const [, , svgPath, outPath] = process.argv;
if (!svgPath || !outPath) {
  console.error("usage: node scripts/preview-scene.mjs <scene.svg> <out.png>");
  process.exit(1);
}
const raw = readFileSync(svgPath, "utf8");
const defsSrc = readFileSync(join(ROOT, "src", "components", "AdventureCastDefs.astro"), "utf8");
const defs = defsSrc.slice(defsSrc.indexOf("<svg"));

const html = `<!doctype html><html><head><style>
  body{margin:0;background:#0e0b1c}
  #stage{width:800px}
  #stage>svg{display:block;width:100%;height:auto}
</style></head><body>${defs}<div id="stage">${raw}</div></body></html>`;

const require_ = createRequire(import.meta.url);
let chromium;
for (const spec of ["playwright", "/opt/node22/lib/node_modules/playwright"]) {
  try {
    ({ chromium } = require_(spec));
    break;
  } catch {}
}
const browser = await chromium
  .launch({ executablePath: "/opt/pw-browsers/chromium" })
  .catch(() => chromium.launch());
const page = await browser.newPage({ viewport: { width: 800, height: 520 }, deviceScaleFactor: 2 });
await page.setContent(html);
await page.locator("#stage").screenshot({ path: outPath });
await browser.close();
console.log(`${outPath} written`);
