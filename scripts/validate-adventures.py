#!/usr/bin/env python3
"""Contract checks for Adventures films (docs/ADVENTURES.md §3).

Usage: python3 scripts/validate-adventures.py [file.svg ...]
With no args, validates every film in src/content-adjacent src/data/adventures/.
Exit 1 on any violation; errors name the file and the exact rule broken.
"""
import glob
import os
import re
import sys
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ADV_DIR = os.path.join(ROOT, "src", "data", "adventures")
SVG_NS = "{http://www.w3.org/2000/svg}"
SPEAKER_RE = re.compile(r"^(CINNAMON|SOCKS|MON-CHAN): ")
CAST_IDS = {"advc-cinnamon", "advc-socks", "advc-mon"}

FORBIDDEN_TAGS = {"script", "image", "foreignObject"}
FORBIDDEN_CSS = ["@import", "url("]


def local(tag):
    return tag.split("}")[-1]


def check_file(path, prefixes):
    errs = []
    name = os.path.basename(path)

    m = re.match(r"^([a-z0-9-]+)\.(sonnet|opus)\.svg$", name)
    if not m:
        return [f"{name}: filename must be <slug>.<sonnet|opus>.svg"]

    raw = open(path, encoding="utf-8").read()
    try:
        root = ET.fromstring(raw)
    except ET.ParseError as e:
        return [f"{name}: not well-formed XML: {e}"]

    if local(root.tag) != "svg":
        return [f"{name}: root element must be <svg>"]
    if root.get("viewBox") != "0 0 480 270":
        errs.append(f'{name}: root viewBox must be exactly "0 0 480 270"')

    episode = root.get("data-episode") or ""
    if not (2 <= len(episode) <= 40):
        errs.append(f"{name}: data-episode required on root, 2-40 chars (got {episode!r})")

    prefix = root.get("data-prefix") or ""
    if not re.match(r"^[a-z][a-z0-9]{2,11}$", prefix):
        errs.append(f"{name}: data-prefix required: 3-12 lowercase alphanumerics (got {prefix!r})")
    elif prefix in prefixes:
        errs.append(f"{name}: data-prefix {prefix!r} already used by {prefixes[prefix]}")
    else:
        prefixes[prefix] = name

    # --- structure: one <style>, optional <defs>, then only g.scene at top level ---
    styles, scenes = [], []
    for child in root:
        tag = local(child.tag)
        if tag == "style":
            styles.append(child)
        elif tag == "defs":
            continue
        elif tag == "g":
            if child.get("class") != "scene":
                errs.append(f'{name}: every top-level <g> must have class="scene" exactly')
            scenes.append(child)
        else:
            errs.append(f"{name}: unexpected top-level <{tag}> (allowed: style, defs, g.scene)")
    if len(styles) != 1:
        errs.append(f"{name}: exactly one top-level <style> required (found {len(styles)})")
    if not (4 <= len(scenes) <= 6):
        errs.append(f"{name}: 4-6 scenes required (found {len(scenes)})")

    total = 0.0
    for i, sc in enumerate(scenes, 1):
        try:
            dur = float(sc.get("data-dur", ""))
        except ValueError:
            errs.append(f"{name}: scene {i} data-dur missing or not a number")
            continue
        if not (1.6 <= dur <= 5.0):
            errs.append(f"{name}: scene {i} data-dur {dur} outside 1.6-5.0s")
        total += dur
        cap = sc.get("data-caption") or ""
        if not (4 <= len(cap) <= 120):
            errs.append(f"{name}: scene {i} data-caption required, 4-120 chars (got {len(cap)})")
        if '"' in cap:
            errs.append(f"{name}: scene {i} caption contains straight quote — use curly “”")
        stray = SPEAKER_RE.sub("", cap)
        if re.match(r"^[A-Z][A-Z-]+:", stray):
            errs.append(f"{name}: scene {i} caption speaker must be CINNAMON, SOCKS or MON-CHAN")
    if scenes and not (9.0 <= total <= 18.0):
        errs.append(f"{name}: total scene duration {total:.1f}s outside 9-18s")

    # --- forbidden content ---
    for el in root.iter():
        tag = local(el.tag)
        if tag in FORBIDDEN_TAGS:
            errs.append(f"{name}: <{tag}> is forbidden")
        for attr in ("href", f"{{http://www.w3.org/1999/xlink}}href"):
            href = el.get(attr)
            if href and not href.startswith("#"):
                errs.append(f"{name}: external href {href!r} forbidden (only #fragment refs)")
            if href and tag == "use":
                frag = href[1:]
                if not (frag in CAST_IDS or frag.startswith(f"{prefix}-")):
                    errs.append(f"{name}: <use> target {href!r} is neither a cast symbol nor {prefix}-prefixed")

    css = "".join(styles[0].itertext()) if styles else ""
    for bad in FORBIDDEN_CSS:
        if bad in css:
            errs.append(f"{name}: CSS may not contain {bad!r}")
    if re.search(r"\bdisplay\s*:\s*none", css):
        errs.append(f"{name}: CSS may not use display:none (breaks the scene timeline)")

    # --- prefix discipline: every id/class/keyframes must start with "<prefix>-" ---
    if prefix:
        pre = prefix + "-"
        for kf in re.findall(r"@keyframes\s+([\w-]+)", css):
            if not kf.startswith(pre):
                errs.append(f"{name}: @keyframes {kf!r} must start with {pre!r}")
        for sel_class in re.findall(r"\.([A-Za-z_][\w-]*)", css):
            if sel_class != "scene" and not sel_class.startswith(pre):
                errs.append(f"{name}: CSS class .{sel_class} must start with {pre!r}")
        for el in root.iter():
            eid = el.get("id")
            if eid and not eid.startswith(pre):
                errs.append(f"{name}: id {eid!r} must start with {pre!r}")
            for cls in (el.get("class") or "").split():
                if cls != "scene" and not cls.startswith(pre):
                    errs.append(f"{name}: class {cls!r} must start with {pre!r}")

    # --- animation-vocabulary guards ---
    if re.search(r"<animate|<animateTransform|<animateMotion|<set\b", raw):
        errs.append(f"{name}: SMIL animation elements forbidden — CSS animations only")
    if scenes and "var(--t" not in css:
        errs.append(f"{name}: no var(--tN) delays found — scene actions must key off scene start times")

    return errs


def main():
    files = sys.argv[1:] or sorted(glob.glob(os.path.join(ADV_DIR, "*.svg")))
    if not files:
        print("no adventure films found — nothing to validate")
        return
    prefixes = {}
    all_errs = []
    for f in files:
        all_errs += check_file(f, prefixes)
    if all_errs:
        print(f"❌ {len(all_errs)} violation(s):")
        for e in all_errs:
            print("  -", e)
        sys.exit(1)
    print(f"✅ {len(files)} film(s) pass the docs/ADVENTURES.md contract")


if __name__ == "__main__":
    main()
