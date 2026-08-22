/**
 * The single shared velocity source (plan §6, step 3 — "the #1 desync bug").
 *
 * Every system that reacts to speed reads from *this* object: the carousel
 * shader, the DOM skew, the velocity marquee, the magnetic buttons. Writers are
 * Lenis (page scroll), a window pointermove listener, and the carousel drag
 * handler. Nothing else may drive those visuals independently.
 *
 * Deliberately not React state — these values change every frame, so they are
 * read imperatively (inside a ticker callback or useFrame) and never trigger a
 * render. Deliberately not Zustand either: a module-level mutable record plus a
 * single damping pass is the whole requirement, and skipping the dependency
 * keeps one less thing between the input and the pixels.
 */

import { VELOCITY } from "@/lib/tokens";

export type VelocityState = {
  /** Page-scroll velocity, normalised to roughly -1..1 and clamped. */
  scroll: number;
  /** |scroll|, the value most shaders want. */
  scrollAbs: number;
  /** Last non-zero scroll direction: 1 = down, -1 = up. */
  scrollDir: 1 | -1;
  /** Cursor velocity in px/frame, smoothed. Signed. */
  pointerX: number;
  pointerY: number;
  /** Cursor speed normalised to 0..1 and clamped. */
  pointerSpeed: number;
  /** Carousel drag/inertia velocity in px/frame, written by the carousel. */
  carousel: number;
  /** |carousel| normalised to 0..1 — what the displacement shader reads. */
  carouselAbs: number;
};

const state: VelocityState = {
  scroll: 0,
  scrollAbs: 0,
  scrollDir: 1,
  pointerX: 0,
  pointerY: 0,
  pointerSpeed: 0,
  carousel: 0,
  carouselAbs: 0,
};

/** Read the live store. The returned object is mutable — never cache values off it. */
export function getVelocity(): Readonly<VelocityState> {
  return state;
}

function clamp(value: number, limit: number) {
  return value < -limit ? -limit : value > limit ? limit : value;
}

/** Lenis reports px/frame; NORM.scroll is the value that reads as "flat out". */
export function writeScroll(velocity: number) {
  state.scroll = clamp(velocity / VELOCITY.norm.scroll, 1);
  state.scrollAbs = Math.abs(state.scroll);
  if (velocity > 0.05) state.scrollDir = 1;
  else if (velocity < -0.05) state.scrollDir = -1;
}

export function writePointer(dx: number, dy: number) {
  // Lerp rather than assign: raw pointermove deltas are spiky, and a jittering
  // skew is worse than a slightly late one.
  state.pointerX += (dx - state.pointerX) * 0.35;
  state.pointerY += (dy - state.pointerY) * 0.35;
  const speed =
    Math.hypot(state.pointerX, state.pointerY) / VELOCITY.norm.pointer;
  state.pointerSpeed = speed > 1 ? 1 : speed;
}

export function writeCarousel(velocity: number) {
  state.carousel = velocity;
  const abs = Math.abs(velocity) / VELOCITY.norm.carousel;
  state.carouselAbs = abs > 1 ? 1 : abs;
}

/**
 * Ease everything back toward rest. Called once per frame from the site's single
 * ticker — inputs only ever push values up, so without this a flick would leave
 * the shader permanently deformed (plan §6, step 5).
 *
 * `deltaTime` is in ms; the damping constants are per-60fps-frame, so the decay
 * is scaled by how long the frame actually took.
 */
export function dampVelocity(deltaTime: number) {
  const frames = Math.min(deltaTime, 50) / (1000 / 60);
  const keep = (rate: number) => Math.pow(1 - rate, frames);

  state.pointerX *= keep(VELOCITY.damp.pointer);
  state.pointerY *= keep(VELOCITY.damp.pointer);
  state.pointerSpeed *= keep(VELOCITY.damp.pointer);

  // Lenis stops emitting events when the page stops, so scroll decays here too.
  state.scroll *= keep(VELOCITY.damp.scroll);
  state.scrollAbs = Math.abs(state.scroll);
}
