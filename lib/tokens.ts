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
} as const;

// Every non-essential animation is gated behind this query via gsap.matchMedia,
// which also tears the animation down (and reverts it) if the preference changes.
export const MOTION_OK = "(prefers-reduced-motion: no-preference)";

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
  damp: 0.06, // per-frame lerp toward 0 after scroll/drag release (carousel)
} as const;
