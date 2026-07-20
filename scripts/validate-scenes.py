#!/usr/bin/env python3
"""Contract checks for Scene Art illustrations (docs/SCENE_ART.md §4).

Usage: python3 scripts/validate-scenes.py [file.svg ...]
With no args, validates every scene in src/data/scenes/.
Exit 1 on any violation; errors name the file and the exact rule broken.
"""
import glob
import os
import re
import sys
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCENE_DIR = os.path.join(ROOT, "src", "data", "scenes")
CAST_IDS = {"advc-cinnamon", "advc-socks", "advc-mon"}
FORBIDDEN_TAGS = {"script", "image", "foreignObject"}
FORBIDDEN_CSS = ["@import", "url(http", "url('http", 'url("http', "display:none", "display: none"]
MAX_BYTES = 30 * 1024


def local(tag):
    return tag.split("}")[-1]


def check_file(path, prefixes):
    errs = []
    name = os.path.basename(path)

    m = re.match(r"^([a-z0-9-]+)\.(hero|snap[12])\.svg$", name)
    if not m:
        return [f"{name}: filename must be <slug>.<hero|snap1|snap2>.svg"]
    role = m.group(2)

    raw = open(path, encoding="utf-8").read()
    if len(raw.encode("utf-8")) > MAX_BYTES:
        errs.append(f"{name}: file is {len(raw.encode('utf-8'))} bytes (> {MAX_BYTES} cap)")

    try:
        root = ET.fromstring(raw)
    except ET.ParseError as e:
        return errs + [f"{name}: not well-formed XML: {e}"]

    if local(root.tag) != "svg":
        return errs + [f"{name}: root element must be <svg>"]
    if root.get("viewBox") != "0 0 480 300":
        errs.append(f'{name}: root viewBox must be exactly "0 0 480 300"')

    title = root.get("data-title") or ""
    if not (2 <= len(title) <= 70):
        errs.append(f"{name}: data-title required on root, 2-70 chars (got {title!r})")

    prefix = root.get("data-prefix") or ""
    if not re.match(r"^[a-z][a-z0-9]{2,11}$", prefix):
        errs.append(f"{name}: data-prefix required: 3-12 lowercase alphanumerics (got {prefix!r})")
    elif prefix in prefixes:
        errs.append(f"{name}: data-prefix {prefix!r} already used by {prefixes[prefix]}")
    else:
        prefixes[prefix] = name

    # --- forbidden content ---
    for el in root.iter():
        tag = local(el.tag)
        if tag in FORBIDDEN_TAGS:
            errs.append(f"{name}: <{tag}> is forbidden")
        for attr in ("href", "{http://www.w3.org/1999/xlink}href"):
            href = el.get(attr)
            if href and not href.startswith("#"):
                errs.append(f"{name}: external href {href!r} forbidden (only #fragment refs)")
            if href and tag == "use":
                frag = href[1:]
                if not (frag in CAST_IDS or (prefix and frag.startswith(f"{prefix}-"))):
                    errs.append(f"{name}: <use> target {href!r} is neither a cast symbol nor {prefix}-prefixed")
                if role == "hero" and frag in CAST_IDS:
                    errs.append(f"{name}: hero scene must not use the cast ({href!r}) — draw the place only")

    if re.search(r"<animate|<animateTransform|<animateMotion|<set\b", raw):
        errs.append(f"{name}: SMIL animation elements forbidden — static art (optional CSS only)")

    styles = [el for el in root.iter() if local(el.tag) == "style"]
    css = "".join("".join(s.itertext()) for s in styles)
    for bad in FORBIDDEN_CSS:
        if bad in css:
            errs.append(f"{name}: CSS may not contain {bad!r}")

    # --- prefix discipline: every id/class/keyframes must start with "<prefix>-" ---
    if prefix:
        pre = prefix + "-"
        for kf in re.findall(r"@keyframes\s+([\w-]+)", css):
            if not kf.startswith(pre):
                errs.append(f"{name}: @keyframes {kf!r} must start with {pre!r}")
        for sel_class in re.findall(r"\.([A-Za-z_][\w-]*)", css):
            if not sel_class.startswith(pre):
                errs.append(f"{name}: CSS class .{sel_class} must start with {pre!r}")
        for el in root.iter():
            eid = el.get("id")
            if eid and not eid.startswith(pre):
                errs.append(f"{name}: id {eid!r} must start with {pre!r}")
            for cls in (el.get("class") or "").split():
                if not cls.startswith(pre):
                    errs.append(f"{name}: class {cls!r} must start with {pre!r}")

    # --- encourage a real composition, not five shapes ---
    shape_count = sum(
        1
        for el in root.iter()
        if local(el.tag) in {"path", "rect", "circle", "ellipse", "polygon", "polyline", "line"}
    )
    if shape_count < 20:
        errs.append(f"{name}: only {shape_count} drawn shapes — compose an actual scene (>= 20; see §3)")

    return errs


def main():
    files = sys.argv[1:] or sorted(glob.glob(os.path.join(SCENE_DIR, "*.svg")))
    if not files:
        print("no scene art found — nothing to validate")
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
    print(f"✅ {len(files)} scene(s) pass the docs/SCENE_ART.md contract")


if __name__ == "__main__":
    main()
