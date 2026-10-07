"""
Turn a raw capture into the WebP the site loads.

Usage:  python3 scripts/covers-derive.py <slug> [slug ...]
        (reads .scratch/caps/<slug>.png, writes public/images/work/<slug>.webp)

One 2400x1650 (16:11) master per project. Everything that shows it goes
through next/image — the case-study screenshot and the OG card — which resizes
per breakpoint, so the master covers all of them.
"""

import os
import sys

from PIL import Image

RAW_DIR = ".scratch/caps"
OUT_DIR = "public/images/work"

# 16:11.
MASTER = (2400, 1650)

# 82 sits just below where banding starts showing in the large flat gradients
# these hero sections tend to have, and well under the 456 KB the hand-dropped
# PNG cost.
QUALITY = 82
ASPECT = MASTER[0] / MASTER[1]


def cover_crop(img: Image.Image, aspect: float) -> Image.Image:
    """Centre-crop to `aspect` without ever scaling up."""
    w, h = img.size
    if abs(w / h - aspect) < 1e-3:
        return img
    if w / h > aspect:
        # Too wide: take a full-height slice from the middle.
        new_w = round(h * aspect)
        left = (w - new_w) // 2
        return img.crop((left, 0, left + new_w, h))
    # Too tall: keep the top rather than the middle — a page's identity lives in
    # its hero, and centre-cropping a long screenshot lands on body copy.
    new_h = round(w / aspect)
    return img.crop((0, 0, w, new_h))


def derive(slug: str) -> bool:
    raw = os.path.join(RAW_DIR, f"{slug}.png")
    if not os.path.isfile(raw):
        print(f"  {slug:24} SKIP  no capture at {raw}")
        return False

    with Image.open(raw) as img:
        # Flatten onto white: captures come back RGBA, and WebP would otherwise
        # carry an alpha channel nothing uses.
        if img.mode in ("RGBA", "LA", "P"):
            img = img.convert("RGBA")
            flat = Image.new("RGB", img.size, (255, 255, 255))
            flat.paste(img, mask=img.split()[-1])
            img = flat
        else:
            img = img.convert("RGB")

        img = cover_crop(img, ASPECT)

        out = os.path.join(OUT_DIR, f"{slug}.webp")
        img.resize(MASTER, Image.LANCZOS).save(out, "WEBP", quality=QUALITY, method=6)
        kb = os.path.getsize(out) // 1024
        print(f"  {os.path.basename(out):34} {MASTER[0]}x{MASTER[1]}  {kb} KB")

    return True


def main() -> int:
    slugs = sys.argv[1:]
    if not slugs:
        print(__doc__)
        return 1

    os.makedirs(OUT_DIR, exist_ok=True)
    ok = sum(derive(slug) for slug in slugs)
    print(f"\n{ok}/{len(slugs)} derived")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
