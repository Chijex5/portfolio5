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
  /**
   * Smoothing intensity, 0–1: how much of the remaining distance the page covers
   * each frame. Higher is more responsive, lower is floatier.
   *
   * 0.16, not 0.1. At 0.1 the page covers a tenth of the gap per frame, which is
   * ~40 frames to visually settle — long enough that the page reads as sliding on
   * ice and as lagging behind the wheel. 0.16 still smooths (nothing snaps) but
   * the page starts moving with your hand rather than after it.
   *
   * There is deliberately no `duration` here. Lenis treats `lerp` and `duration`
   * as mutually exclusive — `duration` is ignored whenever `lerp` is set — so the
   * `duration: 1.2` that used to sit alongside this was dead config that read as a
   * second, contradictory setting for the same behaviour.
   */
  lerp: 0.16,
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
  /** Peak px a band lags behind the scroll, before its own multiplier. */
  lag: 26,
  /** Ceiling on any single band's multiplier, so no `data-elastic` typo folds it. */
  maxIntensity: 3,
} as const;

/**
 * `stretch` and `pinch` used to live in ELASTIC: a ~4.5% scaleY along the
 * direction of travel with a counter-scale on x, to suggest volume.
 *
 * They are gone because they were the single most expensive thing on the page.
 * `translate` and `skew` are composited — the GPU moves an already-rasterised
 * layer. `scale` is not: changing it forces the browser to re-rasterise the
 * band's entire contents at the new size, and these bands are full-height
 * sections of large text. Six of them, re-rastering every frame of every scroll,
 * is what made scrolling feel laggy.
 *
 * The lean and the lag do all the visible work anyway; the squash was under 5%
 * and only ever reached at peak velocity, so removing it costs almost nothing to
 * look at and buys back the frame budget.
 */

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
  /**
   * Click-to-expand (plan §6.7). The plate's picture grows from its own on-screen
   * rect to full bleed, then the route changes underneath it.
   *
   * `expand` is the growth; `hold` is how long the full-bleed frame sits there
   * before `router.push`. The hold is not padding — it is what kills the seam. The
   * case study renders its own cover at the same aspect, so landing while the
   * overlay is still opaque means the swap happens behind a still image and there
   * is no frame in which neither is drawn.
   */
  expand: 0.72,
  hold: 0.12,
} as const;

/**
 * Capabilities: "the type is composed".
 *
 * The 16 tool names arrive as loose letterpress sorts and get set into their four
 * rows as the section scrolls. Every number here is a *starting* displacement —
 * the destination is always the element's own laid-out position, which is why the
 * reduced-motion and no-JS state is the finished layout with nothing to undo.
 *
 * Displacements are derived from each item's index within its group and each
 * group's index within the section — never from a measured rect. That is
 * deliberate: a measured convergence point goes stale the moment Fraunces swaps
 * in or the viewport resizes, and re-measuring means reading layout inside an
 * animation. Index-derived offsets are correct at any width, need no refresh
 * hook, and still converge in the right direction, because an item's index
 * already tells you which side of its row it sits on.
 */
export const COMPOSE = {
  /** px an item at the end of a row starts displaced toward that row's centre. */
  gatherX: 190,
  /** px of deterministic per-item horizontal jitter. */
  jitterX: 44,
  /**
   * Vertical displacement, as a percentage of the item's own height rather than
   * px — and that unit is load-bearing, not a preference.
   *
   * The hover lift writes `y` on this same element. GSAP keeps `y` and `yPercent`
   * as separate components of one transform, so the compose can own `yPercent`
   * while the hover owns `y` and neither ever clobbers the other. Both in px
   * would be two writers on one property: hovering mid-compose would fight, and
   * scrolling back up would erase the lift.
   *
   * Being relative to the text's own size is a bonus — the scatter keeps its
   * proportions as the type scales with the viewport.
   */
  gatherYPercent: 260,
  /** Per-item vertical jitter, same units as `gatherYPercent`. */
  jitterYPercent: 90,
  /** Peak rotation in degrees, plus or minus. Small: these are sorts, not confetti. */
  rotate: 6,
  /**
   * Opacity floor at full scatter. Deliberately not near zero — items stay
   * readable in flight, so stopping mid-scroll shows a loose arrangement of words
   * rather than a smear of grey.
   */
  minOpacity: 0.45,
  /** Peak px of extra lag taken from scroll velocity while composing. */
  smearLag: 30,
  /** Peak skewY in degrees taken from scroll velocity while composing. */
  smearSkew: 2.2,
} as const;

/**
 * Capabilities: the proximity field.
 *
 * The compose (COMPOSE, above) is an entrance — it plays once and stops. This is
 * what makes the section stay alive afterwards, and it is the part that was
 * missing: every reference for a section like this (paco.me, toyfight.net) responds
 * *whenever the cursor is near*, rather than performing once on scroll and going
 * inert.
 *
 * Two things make it feel physical rather than eased:
 *
 *   - **Proximity, not hover.** One document-level pointer listener and a distance
 *     falloff, so a tool reacts before the cursor reaches it and the nearest one
 *     always reacts hardest. An element-scoped `mouseenter` cannot do this — it
 *     only fires once you are already on top of the thing, which is why hover
 *     magnetism feels like a state change and this feels like a field.
 *   - **A real spring.** Each item integrates its own position and velocity
 *     against a target, so it overshoots and settles. A tween cannot: an easing
 *     curve is a fixed path to a known endpoint, and the endpoint here changes
 *     every frame the cursor moves.
 *
 * Cheap on purpose: sixteen springs is a few multiplications each, inside the one
 * GSAP ticker the whole site already runs, and the loop stops writing entirely once
 * everything has settled and the cursor has left.
 */
export const FIELD = {
  /**
   * px of influence around the cursor.
   *
   * 360, not 200. Measured at 200 exactly one item of sixteen ever responded,
   * which makes this a hover effect wearing a field's clothes — these are display
   * type at up to 2.75rem, so neighbouring tools sit 200–300px apart centre to
   * centre and every one of them fell outside the radius. At 360 three or four
   * react at once with a visible gradient between them, which is the whole point
   * of "nearest strongest".
   */
  radius: 360,
  /** px an item at the centre of the field leans toward the cursor. */
  pull: 22,
  /** px of additional upward lift at full influence — the field reads as a rise. */
  lift: 9,
  /** Extra scale at full influence. Small: this is type, and type distorts badly. */
  scale: 0.055,
  /** Weight the nearest item reaches. The list's own morph is the resting base. */
  peakWght: 760,
  /** Optical size at full influence, matching the weight gain. */
  peakOpsz: 132,
  /**
   * Spring constants, per frame at 60fps and delta-scaled at runtime.
   * `stiffness` is the pull toward target; `damping` is retained velocity, so
   * lower damps harder. These two are the entire feel — 0.16/0.74 overshoots just
   * enough to read as mass without wobbling like jelly.
   */
  stiffness: 0.16,
  damping: 0.74,
  /** px/frame kick given to nearby items by a tap, so touch is not a dead surface. */
  impulse: 40,
  /**
   * Below this, in px and px/frame, an item counts as settled.
   *
   * 0.15 rather than 0.05: a spring approaches zero asymptotically, so too tight a
   * threshold is never met and the item keeps a transform, a raster layer and a
   * weight override forever. Measured at 0.05, one item stayed displaced and kept
   * its `--wght` after the cursor had left the section entirely. On settling, state
   * is snapped to exactly zero rather than left near it.
   */
  rest: 0.15,
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
 * The opening sequence — the one animation that is not driven by scroll.
 *
 * It cannot be: this is what a visitor sees the instant the page is ready, before
 * they have scrolled a pixel, so every beat is a position on a timeline in
 * seconds. Scroll-linked motion has nothing to link to yet.
 *
 * Two clocks, and keeping them separate is the point:
 *   `load` / `exit` run on the preloader's clock, which starts at navigation.
 *   `beat` runs on the *reveal's* clock, which starts when the gate opens.
 * So the hero's choreography is written once and reads identically whether the
 * gate took 0.9s or the full 2s — or, on a repeat visit, no time at all. The
 * previous version had the hero's start offset baked into two files as a
 * constant, and the two drifted the moment either clock changed.
 *
 * Positions, not durations — each value is where that beat *starts*, so the whole
 * choreography can be read down this list in order.
 */
export const INTRO = {
  /**
   * Last-resort recovery, in seconds from navigation. Armed by the blocking
   * inline script in app/layout.tsx and cleared by the reveal (lib/intro.ts).
   *
   * If it ever fires, JavaScript did not arrive — so it has to sit far enough
   * past the real worst case (~2.4s) that a slow-but-working load never trips
   * it, and close enough that a broken one is not a blank screen for long.
   */
  failsafe: 12,
  /**
   * The load gate.
   *
   * Both of these are measured from the preloader's **first frame**, not from
   * navigation, and that distinction is the whole fix. They used to be compared
   * against `performance.now()` — time since navigation — while the ticker that
   * reads them cannot start until React has hydrated. Hydration takes ~2.8s in
   * dev, so the very first tick already exceeded a 2s ceiling: the gate resolved
   * instantly with the bar still on 0, and the counter then sprinted 0→100% in
   * `settle` while the panels were already parting. The counter was not slow, it
   * never ran at all.
   *
   * Timed from the first frame, the bar gets the full `minHold` of visible travel
   * no matter how long hydration took.
   */
  load: {
    /** Floor — how long the counter is visibly climbing before the gate may open. */
    minHold: 2.2,
    /** Ceiling — a stalled font or cover can never hold the site hostage. */
    maxWait: 3.0,
    /** The run-out to exactly 100% once the gate has resolved. */
    settle: 0.45,
  },
  /**
   * The exit, on the preloader's own timeline.
   *
   * `mark` deliberately equals `load.settle`, so the counter reaches 100% on the
   * exact frame the group starts leaving — the number is never abandoned
   * mid-count.
   */
  exit: {
    /** Wordmark, rule and counter leaving upward; the seams lighting up. */
    mark: 0.45,
    /** The panels begin to part — this is where the reveal is published. */
    part: 0.72,
    /** Seconds the part takes. The longest single move in the sequence. */
    partDuration: 1.15,
  },
  /** Hero content beats, as offsets from the reveal, in the order they fire. */
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
