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
  /** 0 still · 1 spin · 2 drift · 3 swell. Mirrors `animate()` in the shader. */
  mode: number;
  /** How strongly the shader pulses along `flow` paths, 0–1. */
  pulse: number;
};

type RGBA = readonly [number, number, number, number];

export const BONE: RGBA = [237, 232, 223, 235];
export const SIGNAL: RGBA = [255, 74, 28, 255];
const DIM: RGBA = [237, 232, 223, 150];
const FAINT: RGBA = [237, 232, 223, 84];
const DUST: RGBA = [237, 232, 223, 34];

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
  | { k: "disc"; x: number; y: number; r: number; c: RGBA };

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
  }
}

/** Outline of a rect as four lines. */
function frame(x: number, y: number, w: number, h: number, c: RGBA): Prim[] {
  return [
    { k: "line", x1: x, y1: y, x2: x + w, y2: y, c },
    { k: "line", x1: x + w, y1: y, x2: x + w, y2: y - h, c },
    { k: "line", x1: x + w, y1: y - h, x2: x, y2: y - h, c },
    { k: "line", x1: x, y1: y - h, x2: x, y2: y, c },
  ];
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
      } else {
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
      }
    }
  });
  return i;
}

// ---------------------------------------------------------------------------
// The beats.
// ---------------------------------------------------------------------------

/**
 * Hero — the annoyance. A (2, 5) torus knot with a fuzzy tube: tangled, but
 * clearly *one* thing, so that untangling it is the rest of the page.
 */
export function knot(n: number, w: number, h: number): ShapeData {
  const r = rng(11);
  const s = alloc(n);
  const mobile = isMobile(w);
  const R = mobile ? w * 0.105 : Math.min(w, h) * 0.085;
  const tube = R * 0.2;
  const P = 2;
  const Q = 5;
  const halo = Math.floor(n * 0.12);
  for (let i = 0; i < n - halo; i++) {
    const t = r() * Math.PI * 2;
    const rad = Math.cos(Q * t) + 2.2;
    const cx = rad * Math.cos(P * t) * R;
    const cy = rad * Math.sin(P * t) * R;
    const cz = -Math.sin(Q * t) * R * 1.1;
    // A random point in a ball; the tube reads fuzzy rather than piped, which is
    // what keeps it looking like noise that has *gathered* rather than geometry.
    const u = Math.pow(r(), 0.7) * tube;
    const th = r() * Math.PI * 2;
    const ph = Math.acos(2 * r() - 1);
    const ox = u * Math.sin(ph) * Math.cos(th);
    const oy = u * Math.sin(ph) * Math.sin(th);
    const oz = u * Math.cos(ph);
    const accent = r() < 0.035;
    put(
      s,
      i,
      cx + ox,
      cy + oy,
      cz + oz,
      accent ? SIGNAL : BONE,
      t / (Math.PI * 2),
    );
  }
  // Loose particles orbiting the knot.
  for (let i = n - halo; i < n; i++) {
    const a = r() * Math.PI * 2;
    const rr = R * (2.2 + r() * 2.4);
    put(
      s,
      i,
      Math.cos(a) * rr,
      Math.sin(a) * rr * 0.9,
      (r() - 0.5) * R * 3,
      FAINT,
    );
  }
  const box = anchorBox(w, h);
  return {
    ...s,
    center: [box.cx, mobile ? h * 0.15 : h * 0.11, 0],
    size: mobile ? 1.6 : 1.9,
    mode: 1,
    pulse: 0.9,
  };
}

/** Chapter 1 — noise. The knot comes undone and fills the room. */
export function noise(n: number, w: number, h: number): ShapeData {
  const r = rng(23);
  const s = alloc(n);
  for (let i = 0; i < n; i++) {
    const accent = r() < 0.02;
    put(
      s,
      i,
      (r() - 0.5) * w * 1.15,
      (r() - 0.5) * h * 1.15,
      (r() - 0.5) * 500,
      accent ? SIGNAL : r() < 0.55 ? BONE : DIM,
    );
  }
  return {
    ...s,
    center: [0, 0, 0],
    size: isMobile(w) ? 1.8 : 2.1,
    mode: 2,
    pulse: 0,
  };
}

/**
 * Chapter 2 — shape. Three tables and the relations between them: the schema,
 * which is where every build of mine starts.
 */
export function schema(n: number, w: number, h: number): ShapeData {
  const r = rng(37);
  const s = alloc(n);
  const b = anchorBox(w, h);
  const W = b.w;
  const H = b.h;
  const prims: Prim[] = [];

  const table = (x: number, y: number, tw: number, rows: number) => {
    const head = Math.max(12, tw * 0.13);
    const rowH = Math.max(14, tw * 0.13);
    const th = head + rows * rowH + rowH * 0.4;
    prims.push(...frame(x, y, tw, th, DIM));
    prims.push({ k: "rect", x, y, w: tw, h: head, c: SIGNAL });
    for (let i = 0; i < rows; i++) {
      const ry = y - head - rowH * (i + 0.7);
      const key = i === 0;
      prims.push({
        k: "rect",
        x: x + tw * 0.08,
        y: ry,
        w: tw * 0.06,
        h: rowH * 0.36,
        c: key ? SIGNAL : FAINT,
      });
      prims.push({
        k: "rect",
        x: x + tw * 0.2,
        y: ry,
        w: tw * (0.28 + r() * 0.42),
        h: rowH * 0.36,
        c: BONE,
      });
    }
    return { x, y, w: tw, h: th, head, rowH };
  };

  const tw = W * 0.3;
  const A = table(-W * 0.5, H * 0.5, tw, 5);
  const B = table(W * 0.5 - tw, H * 0.5 - H * 0.06, tw, 4);
  const C = table(-tw / 2 + W * 0.04, -H * 0.02, tw, 4);

  // Relations — dashed elbows from a key row to a foreign key.
  const elbow = (x1: number, y1: number, x2: number, y2: number) => {
    const mx = (x1 + x2) / 2;
    prims.push({ k: "line", x1, y1, x2: mx, y2: y1, c: DIM, dash: 6 });
    prims.push({ k: "line", x1: mx, y1, x2: mx, y2, c: DIM, dash: 6 });
    prims.push({ k: "line", x1: mx, y1: y2, x2, y2, c: DIM, dash: 6 });
    prims.push({ k: "disc", x: x2, y: y2, r: 3.5, c: SIGNAL });
  };
  elbow(
    A.x + A.w,
    A.y - A.head - A.rowH * 0.9,
    B.x,
    B.y - B.head - B.rowH * 1.9,
  );
  elbow(A.x + A.w * 0.6, A.y - A.h, C.x, C.y - C.head - C.rowH * 2.9);
  elbow(B.x + B.w * 0.5, B.y - B.h, C.x + C.w, C.y - C.head - C.rowH * 0.9);

  const used = draw(s, prims, Math.floor(n * 0.8), isMobile(w) ? 3 : 4, r);
  dust(s, used, n, w, h, r, b.cx, b.cy);
  return { ...s, center: [b.cx, b.cy, 0], size: 1.6, mode: 0, pulse: 0 };
}

/**
 * Chapter 3 — flow. The same system as a graph: clients, an API, the services
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
      c: i === 3 ? SIGNAL : BONE,
    });
    prims.push({
      k: "disc",
      x: nd.x,
      y: nd.y,
      r: nd.r * W * 0.32,
      c: i === 3 ? SIGNAL : BONE,
    });
  });

  const used = draw(s, prims, Math.floor(n * 0.78), 3, r);
  dust(s, used, n, w, h, r, b.cx, b.cy);
  return { ...s, center: [b.cx, b.cy, 0], size: 1.6, mode: 0, pulse: 1 };
}

/** Chapter 4 — surface. A browser window and a phone: the part people touch. */
export function surface(n: number, w: number, h: number): ShapeData {
  const r = rng(71);
  const s = alloc(n);
  const b = anchorBox(w, h);
  const W = b.w;
  const H = b.h;
  const prims: Prim[] = [];

  // Browser.
  const bw = W * 0.82;
  const bh = H * 0.86;
  const bx = -W / 2;
  const by = H / 2;
  const bar = Math.max(16, bh * 0.08);
  prims.push(...frame(bx, by, bw, bh, DIM));
  prims.push({
    k: "line",
    x1: bx,
    y1: by - bar,
    x2: bx + bw,
    y2: by - bar,
    c: FAINT,
  });
  for (let i = 0; i < 3; i++) {
    prims.push({
      k: "disc",
      x: bx + bar * (0.6 + i * 0.55),
      y: by - bar / 2,
      r: bar * 0.14,
      c: i === 0 ? SIGNAL : DIM,
    });
  }
  prims.push({
    k: "rect",
    x: bx + bw * 0.3,
    y: by - bar * 0.3,
    w: bw * 0.4,
    h: bar * 0.4,
    c: FAINT,
  });
  // Hero copy, a paragraph, a button, a picture.
  const pad = bw * 0.07;
  const top = by - bar - bh * 0.1;
  prims.push({
    k: "rect",
    x: bx + pad,
    y: top,
    w: bw * 0.42,
    h: bh * 0.07,
    c: BONE,
  });
  prims.push({
    k: "rect",
    x: bx + pad,
    y: top - bh * 0.1,
    w: bw * 0.3,
    h: bh * 0.07,
    c: BONE,
  });
  for (let i = 0; i < 3; i++) {
    prims.push({
      k: "rect",
      x: bx + pad,
      y: top - bh * (0.24 + i * 0.05),
      w: bw * (0.36 - i * 0.06),
      h: bh * 0.018,
      c: FAINT,
    });
  }
  prims.push({
    k: "rect",
    x: bx + pad,
    y: top - bh * 0.46,
    w: bw * 0.16,
    h: bh * 0.07,
    c: SIGNAL,
  });
  const img = { x: bx + bw * 0.55, y: top, w: bw * 0.38, h: bh * 0.52 };
  prims.push({ k: "rect", ...img, c: DIM });
  // Cards row.
  for (let i = 0; i < 3; i++) {
    prims.push(
      ...frame(
        bx + pad + i * bw * 0.29,
        by - bh * 0.76,
        bw * 0.25,
        bh * 0.14,
        FAINT,
      ),
    );
  }

  // Phone, overlapping the browser's right edge.
  const pw = W * 0.2;
  const ph = pw * 2.05;
  const px = W / 2 - pw;
  const py = -H / 2 + ph;
  prims.push(...frame(px, py, pw, ph, BONE));
  prims.push({
    k: "rect",
    x: px + pw * 0.35,
    y: py - ph * 0.03,
    w: pw * 0.3,
    h: ph * 0.02,
    c: DIM,
  });
  prims.push({
    k: "rect",
    x: px + pw * 0.1,
    y: py - ph * 0.12,
    w: pw * 0.8,
    h: ph * 0.3,
    c: DIM,
  });
  prims.push({
    k: "rect",
    x: px + pw * 0.1,
    y: py - ph * 0.48,
    w: pw * 0.62,
    h: ph * 0.04,
    c: BONE,
  });
  prims.push({
    k: "rect",
    x: px + pw * 0.1,
    y: py - ph * 0.56,
    w: pw * 0.5,
    h: ph * 0.025,
    c: FAINT,
  });
  prims.push({
    k: "rect",
    x: px + pw * 0.1,
    y: py - ph * 0.84,
    w: pw * 0.8,
    h: ph * 0.07,
    c: SIGNAL,
  });

  const used = draw(s, prims, Math.floor(n * 0.8), isMobile(w) ? 3 : 4, r);
  dust(s, used, n, w, h, r, b.cx, b.cy);
  return { ...s, center: [b.cx, b.cy, 0], size: 1.6, mode: 0, pulse: 0 };
}

/**
 * Chapter 5 — proof. The projects act themselves out in the DOM, so the stage
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
      i < shown ? (r() < 0.04 ? [255, 74, 28, 70] : DUST) : [0, 0, 0, 0],
    );
  }
  return { ...s, center: [0, 0, 0], size: 1.6, mode: 2, pulse: 0 };
}

/**
 * Chapter 6 — me. Calm water under a low sun: a Lagos evening, and the one
 * shape on the page that is not a diagram.
 */
export function calm(n: number, w: number, h: number): ShapeData {
  const r = rng(97);
  const s = alloc(n);
  const mobile = isMobile(w);
  const sunShare = Math.floor(n * 0.2);
  const sea = n - sunShare;
  const cols = Math.floor(Math.sqrt(sea * 2.2));
  const rows = Math.floor(sea / cols);
  const depth = 3200;
  let i = 0;
  for (let zr = 0; zr < rows; zr++) {
    const f = zr / (rows - 1);
    // Rows bunch up toward the horizon, like they would in perspective anyway.
    const z = 260 - Math.pow(f, 0.8) * depth;
    const a = Math.round(40 + 190 * Math.pow(1 - f, 1.4));
    for (let xc = 0; xc < cols; xc++, i++) {
      const x = ((xc + (zr % 2) * 0.5) / cols - 0.5) * w * 2.6;
      put(s, i, x, -h * 0.26, z, [237, 232, 223, a], -1);
    }
  }
  // The sun: a disc with the lower half cut into bars.
  const R = Math.min(w, h) * (mobile ? 0.22 : 0.19);
  const sy = -h * 0.06;
  const sx = mobile ? 0 : w * 0.16;
  for (; i < n - (sea - rows * cols); i++) {
    let x = 0;
    let y = 0;
    for (let tries = 0; tries < 8; tries++) {
      const a = r() * Math.PI * 2;
      const rr = Math.sqrt(r()) * R;
      x = Math.cos(a) * rr;
      y = Math.sin(a) * rr;
      const band = Math.floor((-y / R) * 7);
      if (y > 0 || band % 2 === 0) break;
    }
    put(s, i, sx + x, sy + y, -600, [255, 74, 28, 200]);
  }
  for (; i < n; i++) put(s, i, 0, -h, -depth, [0, 0, 0, 0]);
  return { ...s, center: [0, 0, 0], size: mobile ? 1.7 : 2, mode: 3, pulse: 0 };
}

/**
 * The end — "Say hello." set in the display face and sampled into dots, the
 * period in signal. Leftovers drift as dust around it.
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
  const lines = mobile ? ["Say", "hello."] : ["Say hello."];
  const size = mobile ? w * 0.34 : Math.min(w * 0.15, h * 0.3);
  const c = document.createElement("canvas");
  const cw = Math.ceil(w);
  const ch = Math.ceil(size * lines.length * 1.05 + size * 0.4);
  c.width = cw;
  c.height = ch;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.font = `600 ${size}px ${family}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#fff";
  // Draw the period separately in red so sampling can tell them apart.
  lines.forEach((line, li) => {
    const y = size * (li + 1) * 0.98;
    const body = line.endsWith(".") ? line.slice(0, -1) : line;
    const full = ctx.measureText(line).width;
    const bodyW = ctx.measureText(body).width;
    const left = cw / 2 - full / 2;
    ctx.textAlign = "left";
    ctx.fillStyle = "#fff";
    ctx.fillText(body, left, y);
    if (body !== line) {
      ctx.fillStyle = "#f00";
      ctx.fillText(".", left + bodyW, y);
    }
  });
  const data = ctx.getImageData(0, 0, cw, ch).data;

  // Pick a sampling step that lands near the particle budget.
  const target = n * 0.82;
  let lit = 0;
  for (let k = 3; k < data.length; k += 4 * 2) if (data[k] > 128) lit++;
  const step = Math.max(2, Math.round(Math.sqrt((lit * 2) / target)));

  const pts: number[] = [];
  for (let y = 0; y < ch; y += step) {
    for (let x = 0; x < cw; x += step) {
      const k = (y * cw + x) * 4;
      if (data[k + 3] > 128) pts.push(x, y, data[k + 1] < 100 ? 1 : 0);
    }
  }
  const count = Math.min(pts.length / 3, Math.floor(n * 0.9));
  const offY = mobile ? h * 0.08 : h * 0.1;
  let i = 0;
  for (; i < count; i++) {
    const x = pts[i * 3] - cw / 2;
    const y = ch / 2 - pts[i * 3 + 1] - size * 0.15;
    put(s, i, x, y + offY, (r() - 0.5) * 6, pts[i * 3 + 2] ? SIGNAL : BONE);
  }
  // Extra particles double up on the letters, so the type gets brighter rather
  // than leaving a halo of strays.
  const extra = Math.floor((n - i) * 0.6);
  for (let j = 0; j < extra && count > 0; j++, i++) {
    const p = Math.floor(r() * count);
    put(
      s,
      i,
      pts[p * 3] - cw / 2 + (r() - 0.5) * step,
      ch / 2 - pts[p * 3 + 1] - size * 0.15 + offY + (r() - 0.5) * step,
      (r() - 0.5) * 30,
      pts[p * 3 + 2] ? SIGNAL : DIM,
    );
  }
  dust(s, i, n, w, h, r);
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
    put(s, i, (r() - 0.5) * 4, (r() - 0.5) * 4, 0, [237, 232, 223, 0]);
  }
  return { ...s, center: [0, 0, 0], size: 1, mode: 0, pulse: 0 };
}
