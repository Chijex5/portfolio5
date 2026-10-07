/**
 * Layout the particle stage shares with the DOM's breakpoints.
 *
 * The stage draws in CSS pixels with the origin at the viewport centre and y up
 * (the camera is placed so that 1 world unit at z = 0 is exactly 1 CSS pixel).
 */

/** Below this the layout is the stacked, phone one. Mirrors Tailwind's `md`. */
export const MOBILE_MAX = 767;

export function isMobile(w: number) {
  return w <= MOBILE_MAX;
}

/** Gutter the DOM uses at this width: 16px on phones, 40px above. */
export function gutter(w: number) {
  return isMobile(w) ? 16 : 40;
}

/**
 * The box structured shapes (schema, flow, surface) are drawn into, in stage
 * coordinates (centre origin, y up). Desktop puts it right of centre so chapter
 * copy can own the bottom-left; phones put it in the upper part of the screen.
 */
export function anchorBox(w: number, h: number) {
  if (isMobile(w)) {
    const bw = w * 0.88;
    return { cx: 0, cy: h * 0.14, w: bw, h: Math.min(bw / 1.05, h * 0.46) };
  }
  const bw = Math.min(w * 0.5, h * 0.78 * 1.45);
  return { cx: w * 0.14, cy: h * 0.04, w: bw, h: bw / 1.45 };
}
