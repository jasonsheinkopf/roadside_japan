#!/usr/bin/env python3
"""assemble-gifs.py — PNG frame sequences → looping GIFs (docs/ADVENTURES.md §7).

Reads node_modules/.cache/adventures-frames/<slug>.<model>/f*.png (written by
scripts/capture-adventures.mjs at 1.5x), downsamples to the target width, quantizes
every frame against one shared adaptive palette (stable colors, no shimmer), and
writes public/adventures/<slug>.<model>.gif.
"""
import glob
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRAMES = os.path.join(ROOT, "node_modules", ".cache", "adventures-frames")
OUT = os.path.join(ROOT, "public", "adventures")
STEP_MS = 70  # must match capture-adventures.mjs
WIDTH = 720


def assemble(film_dir):
    film = os.path.basename(film_dir)
    paths = sorted(glob.glob(os.path.join(film_dir, "f*.png")))
    if not paths:
        return None
    first = Image.open(paths[0]).convert("RGB")
    h = round(first.height * WIDTH / first.width)

    def load(p):
        return Image.open(p).convert("RGB").resize((WIDTH, h), Image.LANCZOS)

    # Shared palette from a sample mosaic so colors don't flicker between frames.
    sample = [load(p) for p in paths[:: max(1, len(paths) // 12)]]
    strip = Image.new("RGB", (WIDTH, h * len(sample)))
    for i, im in enumerate(sample):
        strip.paste(im, (0, i * h))
    palette = strip.quantize(colors=255, method=Image.MEDIANCUT)

    frames = [load(p).quantize(palette=palette, dither=Image.FLOYDSTEINBERG) for p in paths]
    os.makedirs(OUT, exist_ok=True)
    out = os.path.join(OUT, f"{film}.gif")
    frames[0].save(
        out,
        save_all=True,
        append_images=frames[1:],
        duration=STEP_MS,
        loop=0,
        optimize=True,
    )
    return out


def main():
    dirs = sorted(d for d in glob.glob(os.path.join(FRAMES, "*")) if os.path.isdir(d))
    if sys.argv[1:]:
        dirs = [d for d in dirs if any(a in os.path.basename(d) for a in sys.argv[1:])]
    if not dirs:
        print("no frame directories found — run scripts/capture-adventures.mjs first")
        sys.exit(1)
    for d in dirs:
        out = assemble(d)
        if out:
            print(f"{os.path.basename(out)}: {os.path.getsize(out) / 1e6:.2f} MB")


if __name__ == "__main__":
    main()
