/**
 * gen-assets.ts — rasterize the SVG brand assets into the PNGs that browsers, social
 * scrapers, and the PWA installer need (which don't all accept SVG).
 *
 * Run with:  node --experimental-strip-types tools/build/gen-assets.ts
 * (or `npm run assets`). Commit the generated PNGs — they're brand assets, not build
 * output. Re-run only when public/icon.svg or public/og.svg change.
 */
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const pub = join(root, "public");
const icon = readFileSync(join(pub, "icon.svg"));
const og = readFileSync(join(pub, "og.svg"));

async function png(svg: Buffer, size: number, out: string) {
  await sharp(svg, { density: 512 }).resize(size, size).png().toFile(join(pub, out));
  console.log("  ✓", out, `(${size}×${size})`);
}

async function main() {
  console.log("Generating brand raster assets…");

  // Favicons & touch icons
  await png(icon, 32, "favicon-32.png");
  await png(icon, 180, "apple-touch-icon.png");

  // PWA icons ("any")
  await png(icon, 192, "pwa-192.png");
  await png(icon, 512, "pwa-512.png");

  // Maskable icon: scale the mark to ~80% on a solid safe-zone background.
  const inner = await sharp(icon, { density: 512 }).resize(410, 410).png().toBuffer();
  await sharp({
    create: { width: 512, height: 512, channels: 4, background: "#243049" },
  })
    .composite([{ input: inner, gravity: "center" }])
    .png()
    .toFile(join(pub, "pwa-maskable-512.png"));
  console.log("  ✓ pwa-maskable-512.png (512×512, maskable)");

  // Open Graph / social card
  await sharp(og, { density: 192 }).resize(1200, 630).png().toFile(join(pub, "og.png"));
  console.log("  ✓ og.png (1200×630)");

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
