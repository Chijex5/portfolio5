#!/usr/bin/env python3
"""Generate the six project cover plates.

Each composition is the one described by that project's `cover.alt` string in
lib/projects.ts — abstract geometry in the site palette rather than a screenshot,
so the work list and the WebGL carousel have real artwork to show and the alt
text stays honest.

Shapes are drawn at 2x and downsampled with LANCZOS because PIL has no shape
antialiasing. Output is lossy WebP at 1600x1100 (the dimensions declared in the
data).

Run from the repo root:  python3 scripts/make-covers.py
"""

import math
import os

from PIL import Image, ImageChops, ImageDraw

W, H = 1600, 1100
SS = 2  # supersample factor

PAPER = (244, 241, 234, 255)
INK = (20, 17, 15, 255)
SIGNAL = (255, 74, 28, 255)

OUT_DIR = os.path.join("public", "images", "work")


def ink(alpha: float) -> tuple[int, int, int, int]:
    return (INK[0], INK[1], INK[2], int(alpha * 255))


def signal(alpha: float = 1.0) -> tuple[int, int, int, int]:
    return (SIGNAL[0], SIGNAL[1], SIGNAL[2], int(alpha * 255))


def canvas() -> tuple[Image.Image, ImageDraw.ImageDraw]:
    img = Image.new("RGBA", (W * SS, H * SS), PAPER)
    return img, ImageDraw.Draw(img)


def save(img: Image.Image, name: str) -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    out = img.resize((W, H), Image.LANCZOS).convert("RGB")
    path = os.path.join(OUT_DIR, f"{name}.webp")
    out.save(path, "WEBP", quality=88, method=6)
    print(f"  {path}  {os.path.getsize(path) // 1024} KB")


def s(v: float) -> float:
    """Scale a design-space value into supersampled space."""
    return v * SS


# --------------------------------------------------------------------------- #
# 01 — D'Footprint: concentric arcs traced by a single vermilion curve
# --------------------------------------------------------------------------- #
def dfootprint() -> Image.Image:
    img, d = canvas()
    cx, cy = s(W * 0.34), s(H * 1.02)
    for i in range(26):
        r = s(120 + i * 46)
        box = (cx - r, cy - r, cx + r, cy + r)
        width = s(1.4)
        colour = ink(0.10 + 0.05 * math.sin(i * 0.5))
        if i == 17:
            colour, width = signal(), s(5)
        d.arc(box, start=196, end=344, fill=colour, width=int(width))
    # A single long tangent to break the concentric rhythm.
    d.line(
        [(s(W * 0.62), s(H * 0.14)), (s(W * 0.98), s(H * 0.52))],
        fill=ink(0.16),
        width=int(s(1.4)),
    )
    return img


# --------------------------------------------------------------------------- #
# 02 — Jobless: a dot matrix thinning left to right, three dots in vermilion
# --------------------------------------------------------------------------- #
def jobless() -> Image.Image:
    img, d = canvas()
    cols, rows = 30, 20
    pad_x, pad_y = W * 0.07, H * 0.09
    step_x = (W - pad_x * 2) / (cols - 1)
    step_y = (H - pad_y * 2) / (rows - 1)
    # Picked in the dense half — out in the thin tail the dots are too small to
    # read as an accent.
    picked = {(7, 5), (11, 12), (15, 8)}
    for cx in range(cols):
        # Density and size fall away to the right: the funnel, as a texture.
        t = cx / (cols - 1)
        radius = 7.5 * (1 - t) ** 1.5 + 1.1
        alpha = 0.42 * (1 - t) ** 1.2 + 0.05
        for cy in range(rows):
            if (cx + cy) % 2 and t > 0.55:
                continue
            x = s(pad_x + cx * step_x)
            y = s(pad_y + cy * step_y)
            r = s(radius)
            hit = (cx, cy) in picked
            scale = 1.9 if hit else 1
            d.ellipse(
                (x - r * scale, y - r * scale, x + r * scale, y + r * scale),
                fill=signal() if hit else ink(alpha),
            )
    return img


# --------------------------------------------------------------------------- #
# 03 — Wayframe: six wireframe screens wired into a graph, one framed vermilion
# --------------------------------------------------------------------------- #
def wayframe() -> Image.Image:
    img, d = canvas()
    boxes = [
        (0.06, 0.14, 0.26, 0.46),
        (0.34, 0.06, 0.54, 0.38),
        (0.34, 0.52, 0.54, 0.86),
        (0.62, 0.20, 0.82, 0.54),
        (0.62, 0.66, 0.82, 0.94),
        (0.88, 0.34, 0.99, 0.62),
    ]
    edges = [(0, 1), (0, 2), (1, 3), (2, 3), (2, 4), (3, 5), (4, 5)]
    accent = 3

    def centre(b):
        return (s(W * (b[0] + b[2]) / 2), s(H * (b[1] + b[3]) / 2))

    for a, b in edges:
        d.line([centre(boxes[a]), centre(boxes[b])], fill=ink(0.14), width=int(s(1.4)))

    for i, b in enumerate(boxes):
        x0, y0, x1, y1 = s(W * b[0]), s(H * b[1]), s(W * b[2]), s(H * b[3])
        stroke = signal() if i == accent else ink(0.30)
        d.rounded_rectangle(
            (x0, y0, x1, y1),
            radius=s(8),
            fill=PAPER,
            outline=stroke,
            width=int(s(2.4 if i == accent else 1.6)),
        )
        # Header bar plus a couple of content lines: reads as a screen, not a box.
        d.rectangle((x0 + s(10), y0 + s(10), x1 - s(10), y0 + s(24)), fill=ink(0.16))
        for k in range(3):
            wy = y0 + s(38 + k * 16)
            if wy > y1 - s(14):
                break
            d.rectangle(
                (x0 + s(10), wy, x1 - s(10 + 26 * k), wy + s(6)), fill=ink(0.10)
            )
    return img


# --------------------------------------------------------------------------- #
# 04 — Blog: stacked blocks of text set as tone, under a vermilion rule
# --------------------------------------------------------------------------- #
def blog() -> Image.Image:
    img, d = canvas()
    x0 = W * 0.09
    right = W * 0.91
    d.rectangle(
        (s(x0), s(H * 0.13), s(x0 + 190), s(H * 0.13 + 7)), fill=signal()
    )
    y = H * 0.20
    widths = [0.98, 0.94, 0.99, 0.72, 0, 0.97, 0.91, 0.96, 0.62, 0, 0.95, 0.99, 0.55]
    for i, frac in enumerate(widths):
        if frac == 0:
            y += 34
            continue
        alpha = 0.30 if i < 4 else 0.17
        h = 14 if i < 4 else 10
        d.rectangle(
            (s(x0), s(y), s(x0 + (right - x0) * frac), s(y + h)), fill=ink(alpha)
        )
        y += h + 20
    return img


# --------------------------------------------------------------------------- #
# 05 — PicPress: nested frames collapsing inward onto a vermilion bar
# --------------------------------------------------------------------------- #
def picpress() -> Image.Image:
    img, d = canvas()
    cx, cy = W / 2, H / 2
    for i in range(11):
        t = i / 10
        half_w = (W * 0.44) * (1 - t) ** 1.35 + 30
        half_h = (H * 0.40) * (1 - t) ** 1.9 + 8
        d.rectangle(
            (s(cx - half_w), s(cy - half_h), s(cx + half_w), s(cy + half_h)),
            outline=ink(0.10 + t * 0.22),
            width=int(s(1.6)),
        )
    d.rectangle(
        (s(cx - 150), s(cy - 5), s(cx + 150), s(cy + 5)), fill=signal()
    )
    return img


# --------------------------------------------------------------------------- #
# 06 — Precious & Emmanuel: two interlocking rings, overlap in vermilion
# --------------------------------------------------------------------------- #
def precious_and_emmanuel() -> Image.Image:
    img, d = canvas()
    r = H * 0.31
    cy = H * 0.52
    c1 = (W * 0.40, cy)
    c2 = (W * 0.60, cy)
    width = int(s(3))

    for c in (c1, c2):
        d.ellipse(
            (s(c[0] - r), s(c[1] - r), s(c[0] + r), s(c[1] + r)),
            outline=ink(0.34),
            width=width,
        )

    # The overlap: redraw both rings in signal, then keep only the part that
    # falls inside the lens where the two discs intersect.
    def disc(c) -> Image.Image:
        m = Image.new("L", img.size, 0)
        ImageDraw.Draw(m).ellipse(
            (s(c[0] - r), s(c[1] - r), s(c[0] + r), s(c[1] + r)), fill=255
        )
        return m

    lens = ImageChops.multiply(disc(c1), disc(c2))

    rings = Image.new("RGBA", img.size, (0, 0, 0, 0))
    rd = ImageDraw.Draw(rings)
    for c in (c1, c2):
        rd.ellipse(
            (s(c[0] - r), s(c[1] - r), s(c[0] + r), s(c[1] + r)),
            outline=signal(),
            width=width,
        )
    img.paste(rings, (0, 0), ImageChops.multiply(lens, rings.split()[3]))

    # A hairline horizon so the rings sit in a composition rather than float.
    d.line([(s(W * 0.06), s(H * 0.86)), (s(W * 0.94), s(H * 0.86))], fill=ink(0.14), width=int(s(1.4)))
    return img


def main() -> None:
    print("Generating covers…")
    save(dfootprint(), "dfootprint")
    save(jobless(), "jobless")
    save(wayframe(), "wayframe")
    save(blog(), "blog")
    save(picpress(), "picpress")
    save(precious_and_emmanuel(), "precious-and-emmanuel")


if __name__ == "__main__":
    main()
