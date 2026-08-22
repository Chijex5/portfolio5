"""
Turn a raw capture into the two WebP derivatives the site actually loads.

Usage:  python3 scripts/covers-derive.py <slug> [slug ...]
        (reads .scratch/caps/<slug>.png, writes public/images/work/)

Why two files per project, not one:

  <slug>.webp        2400x1650 — everything that goes through next/image: the
                     case-study cover (92vw), the work-row plate (58vw), the hero
                     ribbon (196px) and the OG card. next/image resizes down per
                     breakpoint, so one master covers all of them.

  <slug>-plate.webp  1240x850  — the WebGL carousel only, and this one is not an
                     optimisation, it is a correctness fix. CarouselScene loads
                     its textures with THREE.TextureLoader, which bypasses
                     next/image entirely: the raw file is fetched at full size and
                     the GPU holds it *uncompressed*. At 2400x1650 that is
                     2400*1650*4 = 15.8 MB per plate, and the ring renders six or
                     more, plus a third again for mipmaps — about 127 MB of VRAM.
                     At 1240x850 the same set is roughly 34 MB. Since measureTrack
                     caps a plate at 620 CSS px, 1240 is exactly 2x the largest
                     size it can ever be drawn at, so the big texture buys nothing
                     at all.

Both are 16:11, matching the aspect the capture is taken at and the aspect every
consumer declares — so nothing crops and nothing squashes.
"""

import os
import sys

from PIL import Image

RAW_DIR = ".scratch/caps"
OUT_DIR = "public/images/work"

# 16:11. The master, and the carousel's texture.
MASTER = (2400, 1650)
PLATE = (1240, 850)

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
        # carry an alpha channel the plates never use. The shader samples .rgb and
        # writes its own uOpacity, so a stray alpha would just cost bytes.
        if img.mode in ("RGBA", "LA", "P"):
            img = img.convert("RGBA")
            flat = Image.new("RGB", img.size, (255, 255, 255))
            flat.paste(img, mask=img.split()[-1])
            img = flat
        else:
            img = img.convert("RGB")

        img = cover_crop(img, ASPECT)

        for size, suffix in ((MASTER, ""), (PLATE, "-plate")):
            out = os.path.join(OUT_DIR, f"{slug}{suffix}.webp")
            resized = img.resize(size, Image.LANCZOS)
            resized.save(out, "WEBP", quality=QUALITY, method=6)
            kb = os.path.getsize(out) // 1024
            print(f"  {os.path.basename(out):34} {size[0]}x{size[1]}  {kb} KB")

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
