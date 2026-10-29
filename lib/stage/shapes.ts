import { anchorBox, isMobile } from "./layout";

/**
 * The shapes the particles move between — one per beat of the story.
 *
 * Every shape is the same N particles, so a morph is "particle i goes from where
 * it is in shape A to where it is in shape B". Each shape is two arrays:
 *
 *   pos  N × (x, y, z, flow)   CSS px around the shape's centre, y up.
 *                              `flow` < 0: plain particle. `flow` ≥ 0: the
 *                              particle sits on a path; the integer part is the
 *                              path id, the fraction how far along it is. The
 *                              shader runs a vermilion pulse down those paths.
 *   col  N × (r, g, b, a)      0–255.
 *
 * Shapes are rebuilt on resize (they are laid out in CSS px), so everything here
 * is seeded: the same viewport always produces the same picture.
 */

export type ShapeData = {
  pos: Float32Array;
  col: Uint8Array;
  /** Stage-space centre the shape is drawn around. */
  center: [number, number, number];
  /** Point size in CSS px. */
  size: number;
  /** 0 still · 1 turn · 2 drift · 3 sway · 4 table. Mirrors `animate()` in the shader. */
  mode: number;
  /** How strongly the shader pulses along `flow` paths, 0–1. */
  pulse: number;
};

type RGBA = readonly [number, number, number, number];

// Printed on paper: ink, jollof, plantain, and the browns in between. Alpha is
// how heavily a dot is inked, not how brightly it glows.
export const INK: RGBA = [26, 18, 13, 235];
export const JOLLOF: RGBA = [184, 50, 26, 245];
const DIM: RGBA = [26, 18, 13, 140];
const FAINT: RGBA = [26, 18, 13, 70];
const DUST: RGBA = [26, 18, 13, 30];
const PLANTAIN: RGBA = [233, 169, 59, 250];
const RICE: readonly RGBA[] = [
  [184, 50, 26, 240],
  [205, 82, 34, 235],
  [214, 108, 44, 225],
  [150, 38, 20, 240],
];
const CHICKEN: readonly RGBA[] = [
  [86, 40, 16, 250],
  [112, 56, 22, 245],
  [60, 28, 12, 250],
];

/** mulberry32 — small, fast, good enough to scatter dots. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function alloc(n: number) {
  return { pos: new Float32Array(n * 4), col: new Uint8Array(n * 4) };
}

function put(
  s: { pos: Float32Array; col: Uint8Array },
  i: number,
  x: number,
  y: number,
  z: number,
  c: RGBA,
  flow = -1,
) {
  const k = i * 4;
  s.pos[k] = x;
  s.pos[k + 1] = y;
  s.pos[k + 2] = z;
  s.pos[k + 3] = flow;
  s.col[k] = c[0];
  s.col[k + 1] = c[1];
  s.col[k + 2] = c[2];
  s.col[k + 3] = c[3];
}

/**
 * Fill [from, n) with a faint full-screen haze. Structured shapes keep a share of
 * their particles here so the noise never fully leaves — the "signal" is always
 * drawn against what it came out of.
 */
function dust(
  s: { pos: Float32Array; col: Uint8Array },
  from: number,
  n: number,
  w: number,
  h: number,
  r: () => number,
  cx = 0,
  cy = 0,
) {
  for (let i = from; i < n; i++) {
    put(
      s,
      i,
      (r() - 0.5) * w * 1.3 - cx,
      (r() - 0.5) * h * 1.3 - cy,
      (r() - 0.5) * 600,
      DUST,
    );
  }
}

// ---------------------------------------------------------------------------
// Primitives — the vocabulary the diagram shapes are written in.
// ---------------------------------------------------------------------------

type Prim =
  | { k: "rect"; x: number; y: number; w: number; h: number; c: RGBA }
  | {
      k: "line";
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      c: RGBA;
      /** Path id for the pulse; omit for a plain line. */
      path?: number;
      /** Leave gaps: draw `dash` px, skip `dash` px. */
      dash?: number;
    }
  | { k: "ring"; x: number; y: number; r: number; c: RGBA }
  | { k: "disc"; x: number; y: number; r: number; c: RGBA }
  /** Part of a ring, from angle `a0` to `a1` (radians, counter-clockwise). */
  | {
      k: "arc";
      x: number;
      y: number;
      r: number;
      a0: number;
      a1: number;
      c: RGBA;
      path?: number;
    }
  /** A filled ellipse turned by `rot`; `z` lifts it off the page. */
  | {
      k: "blob";
      x: number;
      y: number;
      rx: number;
      ry: number;
      rot: number;
      z?: number;
      /** How high the middle rises, as a share of the smaller radius. */
      dome?: number;
      c: RGBA | readonly RGBA[];
    };

/** Stroke weight lines and rings are budgeted at, in px. */
const STROKE = 2.2;

function weight(p: Prim) {
  switch (p.k) {
    case "rect":
      return p.w * p.h;
    case "line":
      return Math.hypot(p.x2 - p.x1, p.y2 - p.y1) * STROKE;
    case "ring":
      return Math.PI * 2 * p.r * STROKE;
    case "disc":
      return Math.PI * p.r * p.r;
    case "arc":
      return Math.abs(p.a1 - p.a0) * p.r * STROKE;
    case "blob":
      return Math.PI * p.rx * p.ry;
  }
}

/**
 * Spread `count` particles over the primitives in proportion to their area, so
 * density is even across the drawing. Positions snap to a `grid`-px lattice —
 * the dot-matrix look every "signal" shape shares with the project pictures.
 */
function draw(
  s: { pos: Float32Array; col: Uint8Array },
  prims: Prim[],
  count: number,
  grid: number,
  r: () => number,
) {
  const weights = prims.map(weight);
  const total = weights.reduce((a, b) => a + b, 0);
  const snap = (v: number) => Math.round(v / grid) * grid;
  let i = 0;
  prims.forEach((p, pi) => {
    const share =
      pi === prims.length - 1
        ? count - i
        : Math.round((weights[pi] / total) * count);
    for (let j = 0; j < share && i < count; j++, i++) {
      const z = (r() - 0.5) * 8;
      if (p.k === "rect") {
        put(s, i, snap(p.x + r() * p.w), snap(p.y - r() * p.h), z, p.c);
      } else if (p.k === "line") {
        let t = r();
        const len = Math.hypot(p.x2 - p.x1, p.y2 - p.y1);
        if (p.dash) {
          // Fold t onto the "on" half of each dash period.
          const period = p.dash * 2;
          const d = t * len;
          t = (Math.floor(d / period) * period + (d % p.dash)) / len;
        }
        const jx = (r() - 0.5) * STROKE;
        const jy = (r() - 0.5) * STROKE;
        put(
          s,
          i,
          p.x1 + (p.x2 - p.x1) * t + jx,
          p.y1 + (p.y2 - p.y1) * t + jy,
          z,
          p.c,
          p.path === undefined ? -1 : p.path + Math.min(t, 0.999),
        );
      } else if (p.k === "ring") {
        const a = r() * Math.PI * 2;
        const rr = p.r + (r() - 0.5) * STROKE;
        put(s, i, p.x + Math.cos(a) * rr, p.y + Math.sin(a) * rr, z, p.c);
      } else if (p.k === "disc") {
        const a = r() * Math.PI * 2;
        const rr = Math.sqrt(r()) * p.r;
        put(
          s,
          i,
          snap(p.x + Math.cos(a) * rr),
          snap(p.y + Math.sin(a) * rr),
          z,
          p.c,
        );
      } else if (p.k === "arc") {
        const t = r();
        const a = p.a0 + (p.a1 - p.a0) * t;
        const rr = p.r + (r() - 0.5) * STROKE;
        put(
          s,
          i,
          p.x + Math.cos(a) * rr,
          p.y + Math.sin(a) * rr,
          z,
          p.c,
          p.path === undefined ? -1 : p.path + Math.min(t, 0.999),
        );
      } else {
        // Unsnapped and domed: food is not a dot matrix.
        const a = r() * Math.PI * 2;
        const u = Math.sqrt(r());
        const lx = Math.cos(a) * u * p.rx;
        const ly = Math.sin(a) * u * p.ry;
        const cr = Math.cos(p.rot);
        const sr = Math.sin(p.rot);
        const c = Array.isArray(p.c[0])
          ? (p.c as readonly RGBA[])[Math.floor(r() * p.c.length)]
          : (p.c as RGBA);
        put(
          s,
          i,
          p.x + lx * cr - ly * sr,
          p.y + lx * sr + ly * cr,
          (p.z ?? 0) +
            Math.sqrt(1 - u * u) * Math.min(p.rx, p.ry) * (p.dome ?? 0.6),
          c,
        );
      }
    }
  });
  return i;
}

// ---------------------------------------------------------------------------
// Type, sampled into dots.
// ---------------------------------------------------------------------------

type Run = {
  text: string;
  /** A CSS font shorthand, family included. */
  font: string;
  /** Baseline, in canvas px from the top. */
  y: number;
  /** Left edge; omit to centre the run. */
  x?: number;
  /** Index into the palette `typeset` is given. */
  ink: number;
};

/**
 * Set `runs` on a canvas and sample the lit pixels at a step chosen so the
 * particles land near `budget`. Each run is painted in its own red level, so a
 * sampled pixel knows which palette entry it belongs to.
 */
function typeset(runs: Run[], cw: number, ch: number, budget: number) {
  const c = document.createElement("canvas");
  c.width = Math.ceil(cw);
  c.height = Math.ceil(ch);
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.textBaseline = "alphabetic";
  for (const run of runs) {
    ctx.font = run.font;
    ctx.fillStyle = `rgb(${255 - run.ink * 50},0,0)`;
    ctx.textAlign = run.x === undefined ? "center" : "left";
    ctx.fillText(run.text, run.x ?? c.width / 2, run.y);
  }
  const data = ctx.getImageData(0, 0, c.width, c.height).data;

  let lit = 0;
  for (let k = 3; k < data.length; k += 4 * 2) if (data[k] > 128) lit++;
  const step = Math.max(2, Math.ceil(Math.sqrt((lit * 2) / budget)));

  const pts: { x: number; y: number; ink: number }[] = [];
  for (let y = 0; y < c.height; y += step) {
    for (let x = 0; x < c.width; x += step) {
      const k = (y * c.width + x) * 4;
      if (data[k + 3] > 128) {
        const ink = Math.round((255 - data[k] / (data[k + 3] / 255)) / 50);
        // Canvas y runs down; the stage's runs up.
        pts.push({ x: x - c.width / 2, y: c.height / 2 - y, ink });
      }
    }
  }
  return { pts, step };
}

/**
 * Lay sampled type into the particle arrays. Spare particles double up on the
 * letters (so the type gets darker rather than leaving strays), then the rest
 * become dust.
 */
function inkType(
  s: { pos: Float32Array; col: Uint8Array },
  n: number,
  pts: { x: number; y: number; ink: number }[],
  palette: readonly RGBA[],
  step: number,
  r: () => number,
  w: number,
  h: number,
  /** Thickness: particles spread back through this many px of z. */
  depth = 6,
) {
  // Over budget: thin evenly, never by cutting off the bottom rows.
  const count = Math.min(pts.length, Math.floor(n * 0.9));
  const stride = pts.length / count;
  const kept = Array.from(
    { length: count },
    (_, k) => pts[Math.floor(k * stride)],
  );
  let i = 0;
  for (; i < count; i++) {
    const p = kept[i];
    put(s, i, p.x, p.y, -r() * depth, palette[p.ink] ?? INK);
  }
  const extra = Math.floor((n - i) * 0.6);
  for (let j = 0; j < extra && count > 0; j++, i++) {
    const p = kept[Math.floor(r() * count)];
    put(
      s,
      i,
      p.x + (r() - 0.5) * step,
      p.y + (r() - 0.5) * step,
      -r() * depth,
      palette[p.ink] ?? INK,
    );
  }
  dust(s, i, n, w, h, r);
}

// ---------------------------------------------------------------------------
// The beats — CJ's story, in the order it happened.
// ---------------------------------------------------------------------------

/**
 * Hero — "CJ." set huge in the display face and pressed into a slab of
 * particles, so it shows its thickness as it turns. The period is jollof.
 */
export function cj(n: number, w: number, h: number, family: string): ShapeData {
  const r = rng(11);
  const s = alloc(n);
  const mobile = isMobile(w);
  const size = mobile ? w * 0.4 : Math.min(w * 0.36, h * 0.82);
  const font = `italic 900 ${size}px ${family}`;
  const cw = size * 1.6;
  const ch = size * 1.05;
  const probe = document.createElement("canvas").getContext("2d")!;
  probe.font = font;
  const body = probe.measureText("CJ").width;
  const dot = probe.measureText(".").width;
  const left = cw / 2 - (body + dot) / 2;
  const { pts, step } = typeset(
    [
      { text: "CJ", font, x: left, y: size * 0.86, ink: 0 },
      {
        text: ".",
        font,
        x: left + body,
        y: size * 0.86,
        ink: 1,
      },
    ],
    cw,
    ch,
    n * 0.55,
  );
  inkType(s, n, pts, [INK, JOLLOF], step, r, w, h, size * 0.14);
  const box = anchorBox(w, h);
  return {
    ...s,
    center: [mobile ? 0 : box.cx + w * 0.04, mobile ? h * 0.16 : h * 0.06, 0],
    size: Math.max(1.6, step * 0.8),
    mode: 1,
    pulse: 0,
  };
}

/**
 * Chapter 1 — the Navy. An anchor with its rope, swaying over a few strokes of
 * water: the primary-school plan.
 */
export function anchor(n: number, w: number, h: number): ShapeData {
  const r = rng(23);
  const s = alloc(n);
  const b = anchorBox(w, h);
  const A = Math.min(b.h * 0.92, b.w * 0.9);
  const top = A * 0.5;
  const ringR = A * 0.07;
  const shankTop = top - ringR * 2;
  const crownY = -A * 0.28;
  const crownR = A * 0.3;
  const prims: Prim[] = [];

  prims.push({ k: "ring", x: 0, y: top - ringR, r: ringR, c: INK });
  prims.push({ k: "ring", x: 0, y: top - ringR, r: ringR * 0.55, c: DIM });
  // Shank: drawn as three close lines, so it reads heavier than the rope.
  for (const dx of [-4, 0, 4]) {
    prims.push({
      k: "line",
      x1: dx,
      y1: shankTop,
      x2: dx,
      y2: crownY - crownR + 4,
      c: INK,
    });
  }
  // Stock, with knobs.
  const stockY = shankTop - A * 0.08;
  for (const dy of [-3, 3]) {
    prims.push({
      k: "line",
      x1: -A * 0.2,
      y1: stockY + dy,
      x2: A * 0.2,
      y2: stockY + dy,
      c: INK,
    });
  }
  prims.push({ k: "disc", x: -A * 0.21, y: stockY, r: A * 0.018, c: INK });
  prims.push({ k: "disc", x: A * 0.21, y: stockY, r: A * 0.018, c: INK });
  // Crown: the lower arc, three strokes thick, ending in flukes.
  for (const dr of [-4, 0, 4]) {
    prims.push({
      k: "arc",
      x: 0,
      y: crownY,
      r: crownR + dr,
      a0: Math.PI * 1.08,
      a1: Math.PI * 1.92,
      c: INK,
    });
  }
  for (const side of [-1, 1]) {
    const a = side < 0 ? Math.PI * 1.08 : Math.PI * 1.92;
    const fx = Math.cos(a) * crownR;
    const fy = crownY + Math.sin(a) * crownR;
    prims.push({
      k: "blob",
      x: fx - side * A * 0.01,
      y: fy + A * 0.035,
      rx: A * 0.03,
      ry: A * 0.065,
      rot: side * 0.5,
      c: INK,
    });
  }
  prims.push({ k: "disc", x: 0, y: crownY - crownR, r: A * 0.025, c: INK });
  // The rope: off the ring, loose around the shank, trailing off.
  const rope: [number, number][] = [];
  for (let t = 0; t <= 1; t += 0.02) {
    const y = top - ringR * 2 - t * A * 0.7;
    const x = Math.sin(t * Math.PI * 3.2) * A * 0.07 * (1 - t * 0.3);
    rope.push([x, y]);
  }
  for (let k = 1; k < rope.length; k++) {
    prims.push({
      k: "line",
      x1: rope[k - 1][0],
      y1: rope[k - 1][1],
      x2: rope[k][0],
      y2: rope[k][1],
      c: JOLLOF,
      dash: 3,
    });
  }
  const used = draw(s, prims, Math.floor(n * 0.6), 2, r);

  // Water: long dashed strokes below, fading with distance.
  const water = Math.floor(n * 0.22);
  let i = used;
  for (let k = 0; k < water; k++, i++) {
    const row = Math.floor(r() * 7);
    const y = crownY - crownR - A * 0.1 - row * A * 0.045;
    const x = (r() - 0.5) * b.w * (1.1 + row * 0.12);
    const wave = Math.sin(x * 0.03 + row) * 3;
    if (Math.floor((x + row * 17) / 14) % 3 === 0) {
      k--;
      i--;
      continue;
    }
    put(s, i, x, y + wave, -row * 30, row < 2 ? DIM : FAINT);
  }
  dust(s, i, n, w, h, r, b.cx, b.cy);
  return { ...s, center: [b.cx, b.cy, 0], size: 1.9, mode: 3, pulse: 0 };
}

/**
 * Chapter 2 — JSS2. A jollof `<h1>`, and under it the same heading at every
 * size from h1 to h6 in Times New Roman: the first page, exactly as the
 * textbook drew it.
 */
export function tag(n: number, w: number, h: number, mono: string): ShapeData {
  const r = rng(37);
  const s = alloc(n);
  const b = anchorBox(w, h);
  const cw = b.w;
  const ch = b.h * 1.05;
  const big = Math.min(cw * 0.2, ch * 0.24);
  const runs: Run[] = [
    { text: "<h1>", font: `500 ${big}px ${mono}`, x: 0, y: big * 0.9, ink: 1 },
  ];
  const sizes = [1, 0.8, 0.64, 0.52, 0.42, 0.34];
  let y = big * 1.15;
  const base = Math.min(cw * 0.11, ch * 0.12);
  sizes.forEach((k) => {
    y += base * k * 1.08;
    runs.push({
      text: "My website",
      font: `bold ${base * k}px "Times New Roman", Times, serif`,
      x: 0,
      y,
      ink: 0,
    });
  });
  const { pts, step } = typeset(runs, cw, ch, n * 0.62);
  inkType(s, n, pts, [INK, JOLLOF], step, r, w, h);
  return {
    ...s,
    center: [b.cx, b.cy, 0],
    size: Math.max(1.6, step * 0.75),
    mode: 1,
    pulse: 0,
  };
}

/**
 * Chapter 3 — the bribe. Mum's jollof on a plate, six big pieces of chicken on
 * top, fried plantain round the edge, turning slowly on the table.
 */
export function plate(n: number, w: number, h: number): ShapeData {
  const r = rng(53);
  const s = alloc(n);
  const b = anchorBox(w, h);
  const mobile = isMobile(w);
  const R = mobile ? w * 0.42 : Math.min(b.w * 0.44, h * 0.42);
  const prims: Prim[] = [];

  // The plate: rim, well, and a faint glaze between.
  prims.push({ k: "ring", x: 0, y: 0, r: R, c: INK });
  prims.push({ k: "ring", x: 0, y: 0, r: R * 0.985, c: INK });
  prims.push({ k: "ring", x: 0, y: 0, r: R * 0.96, c: DIM });
  prims.push({ k: "ring", x: 0, y: 0, r: R * 0.8, c: FAINT });

  // Rice: one mound, and loose grains spilling out of it.
  prims.push({
    k: "blob",
    x: 0,
    y: 0,
    rx: R * 0.62,
    ry: R * 0.62,
    rot: 0,
    dome: 0.3,
    c: RICE,
  });
  for (let k = 0; k < 40; k++) {
    const a = r() * Math.PI * 2;
    const d = R * (0.55 + r() * 0.12);
    prims.push({
      k: "blob",
      x: Math.cos(a) * d,
      y: Math.sin(a) * d,
      rx: R * 0.012,
      ry: R * 0.005,
      rot: r() * Math.PI,
      c: RICE,
    });
  }

  // Six pieces of chicken, drumsticks pointing out.
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + 0.3;
    const d = R * 0.3;
    const cx = Math.cos(a) * d;
    const cy = Math.sin(a) * d;
    prims.push({
      k: "blob",
      x: cx,
      y: cy,
      rx: R * 0.17,
      ry: R * 0.11,
      rot: a,
      // Sitting on the mound, not sunk into it.
      z: R * 0.17,
      dome: 0.9,
      c: CHICKEN,
    });
    // The bone and its knuckle.
    const bx = cx + Math.cos(a) * R * 0.13;
    const by = cy + Math.sin(a) * R * 0.13;
    prims.push({
      k: "blob",
      x: bx + Math.cos(a) * R * 0.05,
      y: by + Math.sin(a) * R * 0.05,
      rx: R * 0.06,
      ry: R * 0.02,
      rot: a,
      z: R * 0.2,
      c: INK,
    });
    prims.push({
      k: "blob",
      x: bx + Math.cos(a) * R * 0.11,
      y: by + Math.sin(a) * R * 0.11,
      rx: R * 0.028,
      ry: R * 0.034,
      rot: a,
      z: R * 0.2,
      c: INK,
    });
  }

  // Plantain: diagonal slices round the well, browned at the edges.
  const slices = 13;
  for (let k = 0; k < slices; k++) {
    const a = (k / slices) * Math.PI * 2 + r() * 0.15;
    const d = R * 0.7;
    const x = Math.cos(a) * d;
    const y = Math.sin(a) * d;
    const rot = a + Math.PI / 2 + (r() - 0.5) * 0.6;
    prims.push({
      k: "blob",
      x,
      y,
      rx: R * 0.1,
      ry: R * 0.05,
      rot,
      z: R * 0.02,
      c: [PLANTAIN, PLANTAIN, PLANTAIN, [196, 112, 34, 250]],
    });
  }

  const used = draw(s, prims, Math.floor(n * 0.82), 2, r);
  dust(s, used, n, w, h, r, b.cx, b.cy);
  return {
    ...s,
    center: [mobile ? 0 : b.cx, mobile ? h * 0.12 : b.cy - h * 0.02, 0],
    size: mobile ? 1.8 : 2.1,
    mode: 4,
    pulse: 0,
  };
}

/**
 * Chapter 4 — Statistics. A Galton board: pegs above, and below them the dots
 * already settled into a binomial, with the bell drawn over it in jollof.
 */
export function bell(n: number, w: number, h: number): ShapeData {
  const r = rng(71);
  const s = alloc(n);
  const b = anchorBox(w, h);
  const W = b.w;
  const H = b.h;
  const prims: Prim[] = [];
  const bins = 13;
  const binW = W / bins;
  const floor = -H * 0.5;
  const pegTop = H * 0.48;
  const pegRows = 8;
  const pegGap = H * 0.042;

  // Funnel.
  prims.push({
    k: "line",
    x1: -W * 0.16,
    y1: H * 0.56,
    x2: -binW * 0.6,
    y2: pegTop + pegGap,
    c: DIM,
  });
  prims.push({
    k: "line",
    x1: W * 0.16,
    y1: H * 0.56,
    x2: binW * 0.6,
    y2: pegTop + pegGap,
    c: DIM,
  });
  // Pegs.
  for (let row = 0; row < pegRows; row++) {
    for (let k = 0; k <= row; k++) {
      prims.push({
        k: "disc",
        x: (k - row / 2) * binW * 0.9,
        y: pegTop - row * pegGap,
        r: 2.6,
        c: INK,
      });
    }
  }
  // Bin walls and the floor.
  const binTop = pegTop - pegRows * pegGap - H * 0.02;
  for (let k = 0; k <= bins; k++) {
    const x = -W / 2 + k * binW;
    prims.push({ k: "line", x1: x, y1: floor, x2: x, y2: binTop, c: FAINT });
  }
  prims.push({
    k: "line",
    x1: -W / 2,
    y1: floor,
    x2: W / 2,
    y2: floor,
    c: INK,
  });

  // Settled dots: each bin filled to its binomial height.
  const maxH = (binTop - floor) * 0.92;
  const choose = (m: number, k: number) => {
    let c = 1;
    for (let j = 1; j <= k; j++) c = (c * (m - j + 1)) / j;
    return c;
  };
  const peak = choose(bins - 1, (bins - 1) >> 1);
  const tops: [number, number][] = [];
  for (let k = 0; k < bins; k++) {
    const hk = (choose(bins - 1, k) / peak) * maxH;
    const x = -W / 2 + k * binW + binW * 0.14;
    prims.push({ k: "rect", x, y: floor + hk, w: binW * 0.72, h: hk, c: INK });
    tops.push([-W / 2 + (k + 0.5) * binW, floor + hk]);
  }
  // The bell, through the tops — a path the pulse runs along.
  const sd = (bins - 1) / 4;
  const curve: [number, number][] = [];
  for (let t = 0; t <= 1.0001; t += 0.01) {
    const x = -W / 2 + t * W;
    const z = (t * bins - bins / 2) / Math.sqrt(sd * 2);
    curve.push([x, floor + maxH * Math.exp(-z * z) + 10]);
  }
  for (let k = 1; k < curve.length; k++) {
    prims.push({
      k: "line",
      x1: curve[k - 1][0],
      y1: curve[k - 1][1],
      x2: curve[k][0],
      y2: curve[k][1],
      c: JOLLOF,
      path: 0,
    });
  }
  // A few still falling through the pegs.
  for (let k = 0; k < 18; k++) {
    prims.push({
      k: "disc",
      x: (r() - 0.5) * binW * 6,
      y: pegTop - r() * pegRows * pegGap,
      r: 2.2,
      c: JOLLOF,
    });
  }

  const used = draw(s, prims, Math.floor(n * 0.78), isMobile(w) ? 3 : 4, r);
  dust(s, used, n, w, h, r, b.cx, b.cy);
  return { ...s, center: [b.cx, b.cy, 0], size: 1.7, mode: 0, pulse: 0.8 };
}

/**
 * Chapter 5 — still building. The system as a graph: clients, an API, the services
 * behind it, and data moving through. The pulses are the point of the chapter.
 */
export function flow(n: number, w: number, h: number): ShapeData {
  const r = rng(53);
  const s = alloc(n);
  const b = anchorBox(w, h);
  const W = b.w;
  const H = b.h;
  const col = (f: number) => -W / 2 + W * f;
  const row = (f: number) => H / 2 - H * f;

  // Three layers: who asks, what answers, what remembers.
  const nodes = [
    { x: col(0.06), y: row(0.18), r: 0.05 }, // web
    { x: col(0.06), y: row(0.5), r: 0.05 }, // mobile
    { x: col(0.06), y: row(0.82), r: 0.05 }, // admin
    { x: col(0.45), y: row(0.5), r: 0.09 }, // api
    { x: col(0.82), y: row(0.12), r: 0.05 }, // payments
    { x: col(0.94), y: row(0.42), r: 0.045 }, // email
    { x: col(0.82), y: row(0.72), r: 0.065 }, // postgres
    { x: col(0.6), y: row(0.94), r: 0.04 }, // queue
  ];
  const edges: [number, number][] = [
    [0, 3],
    [1, 3],
    [2, 3],
    [3, 4],
    [3, 5],
    [3, 6],
    [3, 7],
    [7, 6],
  ];
  const prims: Prim[] = [];
  edges.forEach(([a, z], i) => {
    const A = nodes[a];
    const Z = nodes[z];
    const ang = Math.atan2(Z.y - A.y, Z.x - A.x);
    const ra = A.r * W + 6;
    const rz = Z.r * W + 6;
    prims.push({
      k: "line",
      x1: A.x + Math.cos(ang) * ra,
      y1: A.y + Math.sin(ang) * ra,
      x2: Z.x - Math.cos(ang) * rz,
      y2: Z.y - Math.sin(ang) * rz,
      c: DIM,
      path: i,
    });
  });
  nodes.forEach((nd, i) => {
    prims.push({
      k: "ring",
      x: nd.x,
      y: nd.y,
      r: nd.r * W,
      c: i === 3 ? JOLLOF : INK,
    });
    prims.push({
      k: "disc",
      x: nd.x,
      y: nd.y,
      r: nd.r * W * 0.32,
      c: i === 3 ? JOLLOF : INK,
    });
  });

  const used = draw(s, prims, Math.floor(n * 0.78), 3, r);
  dust(s, used, n, w, h, r, b.cx, b.cy);
  return { ...s, center: [b.cx, b.cy, 0], size: 1.6, mode: 0, pulse: 1 };
}

/**
 * Chapter 6 — proof. The projects act themselves out in the DOM, so the stage
 * steps back: a sparse, dim field that keeps drifting behind the scenes.
 */
export function field(n: number, w: number, h: number): ShapeData {
  const r = rng(89);
  const s = alloc(n);
  const shown = Math.floor(n * 0.35);
  for (let i = 0; i < n; i++) {
    put(
      s,
      i,
      (r() - 0.5) * w * 1.3,
      (r() - 0.5) * h * 1.3,
      (r() - 0.5) * 700,
      i < shown ? (r() < 0.04 ? [184, 50, 26, 70] : DUST) : [0, 0, 0, 0],
    );
  }
  return { ...s, center: [0, 0, 0], size: 1.6, mode: 2, pulse: 0 };
}

/**
 * The end — "Say hello." set in the display face and sampled into dots, the
 * period in jollof. Leftovers drift as dust around it.
 */
export function hello(
  n: number,
  w: number,
  h: number,
  family: string,
): ShapeData {
  const r = rng(131);
  const s = alloc(n);
  const mobile = isMobile(w);
  const lines = mobile ? ["Say", "hello"] : ["Say hello"];
  const size = mobile ? w * 0.3 : Math.min(w * 0.2, h * 0.36);
  const font = `900 ${size}px ${family}`;
  const cw = w;
  const ch = size * lines.length * 0.95 + size * 0.4;
  const probe = document.createElement("canvas").getContext("2d")!;
  probe.font = font;
  const runs: Run[] = [];
  lines.forEach((line, li) => {
    const y = size * (li + 1) * 0.92;
    const full = probe.measureText(line + ".").width;
    const left = cw / 2 - full / 2;
    runs.push({ text: line, font, x: left, y, ink: 0 });
    if (li === lines.length - 1) {
      runs.push({
        text: ".",
        font,
        x: left + probe.measureText(line).width,
        y,
        ink: 1,
      });
    }
  });
  const { pts, step } = typeset(runs, cw, ch, n * 0.82);
  const offY = mobile ? h * 0.08 : h * 0.1;
  pts.forEach((p) => (p.y += offY));
  inkType(s, n, pts, [INK, JOLLOF], step, r, w, h);
  return {
    ...s,
    center: [0, 0, 0],
    size: Math.max(1.4, step * 0.75),
    mode: 0,
    pulse: 0,
  };
}

/** Everything sits on one point — the state before the intro. */
export function seed(n: number): ShapeData {
  const r = rng(3);
  const s = alloc(n);
  for (let i = 0; i < n; i++) {
    put(s, i, (r() - 0.5) * 4, (r() - 0.5) * 4, 0, [26, 18, 13, 0]);
  }
  return { ...s, center: [0, 0, 0], size: 1, mode: 0, pulse: 0 };
}
