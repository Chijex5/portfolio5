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
  /** 0 still · 1 turn · 2 drift. Mirrors `animate()` in the shader. */
  mode: number;
  /** How strongly the shader pulses along `flow` paths, 0–1. */
  pulse: number;
};

type RGBA = readonly [number, number, number, number];

// Printed on paper: ink, jollof, plantain, and the browns in between. Alpha is
// how heavily a dot is inked, not how brightly it glows.
export const INK: RGBA = [26, 18, 13, 235];
export const JOLLOF: RGBA = [184, 50, 26, 245];
const DUST: RGBA = [26, 18, 13, 30];

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
// The beats.
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
 * Work and about. The projects act themselves out in the DOM, so the stage
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
