// Motion tokens — single source of truth for durations, easings, and interaction
// constants. Mirrors the design system in portfolio-build-plan.md §4.

export const DURATION = {
  fast: 0.2,
  base: 0.4,
  slow: 0.8,
} as const;

// expo-out — the decelerating "expensive" feel used across the site.
export const EASE = [0.16, 1, 0.3, 1] as const;
export const EASE_CSS = "cubic-bezier(0.16, 1, 0.3, 1)";
// GSAP core has no cubic-bezier() parser (that needs the CustomEase plugin), so
// tweens use the built-in whose curve matches EASE_CSS.
export const EASE_GSAP = "expo.out";

export const MAGNET = {
  max: 12, // px cap for magnetic pull (header + footer CTA)
  /** Extra px the element overshoots along the cursor's direction of travel. */
  overshoot: 10,
  /** Peak scaleX added at full cursor speed — the "liquid" stretch. */
  stretch: 0.14,
  /** Peak skewX in degrees at full cursor speed. */
  skew: 5,
} as const;

// Every non-essential animation is gated behind this query via gsap.matchMedia,
// which also tears the animation down (and reverts it) if the preference changes.
export const MOTION_OK = "(prefers-reduced-motion: no-preference)";

/**
 * Cursor-follow affordances (magnets, tilt, sheen) only exist where there *is* a
 * cursor: on touch, a tap fires pointermove once and leaves the element stuck
 * wherever that put it.
 */
export const HOVER_OK =
  "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

export const REVEAL = {
  // Fire when the element's top passes 85% of the viewport height: far enough in
  // to be deliberate, early enough that nothing is caught mid-reveal.
  start: "top 85%",
} as const;

export const HEADER = {
  // px of clearance the fixed header needs above an anchor target. Mirrored by
  // `scroll-padding-top` in globals.css so native hash jumps land in the same place.
  offset: 96,
} as const;

export const LENIS = {
  lerp: 0.1,
  duration: 1.2,
} as const;

export const VELOCITY = {
  /** Per-frame decay toward rest after scroll / pointer / drag release. */
  damp: {
    scroll: 0.06,
    pointer: 0.12,
    /** Carousel inertia: lower = longer glide. */
    carousel: 0.055,
  },
  /** Input value that counts as "flat out" — the divisor that normalises to 1. */
  norm: {
    scroll: 45, // px/frame of page scroll
    pointer: 26, // px/frame of cursor travel
    carousel: 34, // px/frame of track travel
  },
} as const;

/**
 * Variable-font axis ranges for kinetic type. Fraunces carries wght 100–900,
 * opsz 9–144, SOFT 0–100 and WONK 0–1 (see the `axes` array passed to
 * next/font in app/layout.tsx — extra axes are opt-in).
 */
export const AXES = {
  wght: { min: 100, max: 900 },
  opsz: { min: 9, max: 144 },
  soft: { min: 0, max: 100 },
  wonk: { min: 0, max: 1 },
} as const;

/**
 * The site-wide elastic layer — "liquid on top of the page as you scroll".
 *
 * A literal full-page fluid distortion would mean rasterising the DOM into a
 * WebGL texture every frame: text stops being text, selection and screen readers
 * die, and the framerate goes with them. What actually reads as liquid is the
 * page *deforming under its own momentum* — so each band shears, stretches and
 * lags by a share of the shared scroll velocity, and the differing shares are
 * what make it feel like depth rather than one sheet tilting.
 *
 * Every value is a peak reached only at full scroll velocity. At a normal reading
 * scroll they are nearly nothing, which is the point: the effect should be felt
 * on a fast flick and invisible on a slow read.
 */
export const ELASTIC = {
  /** Peak skewY in degrees — the shear that reads as the page catching up. */
  skew: 1.9,
  /** Peak scaleY stretch along the direction of travel. */
  stretch: 0.045,
  /** Fraction of the stretch taken back off the x axis, so volume looks kept. */
  pinch: 0.55,
  /** Peak px a band lags behind the scroll, before its own multiplier. */
  lag: 26,
  /** Ceiling on any single band's multiplier, so no `data-elastic` typo folds it. */
  maxIntensity: 3,
} as const;

/**
 * The cursor lens: a soft warm highlight that trails the pointer and stretches
 * along its direction of travel, so the page reads as having a wet surface the
 * cursor is dragging through. Blend-mode only — it never intercepts a pointer
 * event and never sits above text in the a11y tree.
 */
export const LENS = {
  /** Diameter in px at rest. */
  size: 460,
  /** Seconds for the lens to reach the cursor. Higher = more drag. */
  follow: 0.55,
  /** Peak scaleX stretch along travel at full cursor speed. */
  stretch: 0.5,
  /** Peak opacity. Deliberately low — texture, not a spotlight. */
  opacity: 0.5,
} as const;

export const CAROUSEL = {
  /** Slide aspect ratio (w / h). */
  aspect: 1.34,
  /** Gap between plates, px. */
  gap: 32,
  /** Idle drift in px/frame, so the track is never fully dead. */
  drift: 0.42,
  /** How much page-scroll velocity bleeds into the track. */
  scrollBleed: 0.55,
  /** Seconds for the track to settle back to its drift speed after a flick. */
  snap: 1.1,
  /** Peak z-displacement in px at full velocity — the liquid bend. */
  bend: 190,
  /** Peak RGB split in UV units at full velocity. */
  split: 0.028,
  /** Scale a plate reaches on hover / focus. */
  hoverScale: 1.075,
} as const;

/**
 * Work-row interaction. The list below the carousel is the same idea in DOM: the
 * cover parallaxes inside its frame, skews with page velocity, and expands out to
 * the frame edge when you point at it.
 */
export const ROW = {
  /** Peak skewY in degrees taken from page-scroll velocity. */
  skew: 2.6,
  /** Peak parallax travel for the cover, as % of its own height. */
  parallax: 8,
  /** Peak parallax travel for the background numeral, % of its own height. */
  numeral: -26,
  /** Degrees of cursor-tracked tilt on a plate. */
  tilt: 5,
  /** Inset % the cover rests at before hover expands it to the frame edge. */
  inset: 5.5,
} as const;

/**
 * The hero's opening sequence — the one animation that is not driven by scroll.
 *
 * It cannot be: this is what a visitor sees the instant the page is ready, before
 * they have scrolled a pixel, so every beat is a position on a timeline in
 * seconds. Scroll-linked motion has nothing to link to yet.
 *
 * Positions, not durations — each value is where that beat *starts* on the master
 * timeline, so the whole choreography can be read down this list in order. Total
 * runtime is about 2.6s on a first visit and 1.7s on a repeat one (the curtain is
 * once per tab).
 */
export const INTRO = {
  /** Full-bleed panel that covers hydration and the webfont swap. */
  curtain: {
    /** The rule under the wordmark drawing itself to full width. */
    rule: 0,
    /** Wordmark rising into place. */
    mark: 0.06,
    /** The panel lifting away, vermilion edge leading. */
    lift: 0.72,
    /** Seconds the lift takes. The longest single move in the sequence. */
    liftDuration: 1,
  },
  /**
   * Where hero content starts. On a first visit it begins as the curtain clears,
   * so the two overlap rather than queueing; on a repeat visit it starts at zero.
   */
  contentAt: 0.95,
  /** Offsets from `contentAt`, in the order they fire. */
  beat: {
    rules: 0,
    eyebrow: 0.05,
    /** Statement lines rise while the axes thicken — the signature beat. */
    statement: 0.18,
    copy: 0.72,
    ribbon: 0.84,
    cta: 1.14,
    stats: 1.22,
  },
} as const;

