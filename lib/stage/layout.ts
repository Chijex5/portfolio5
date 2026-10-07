/**
 * Geometry shared by the particle stage and the DOM.
 *
 * The stage draws in CSS pixels with the origin at the viewport centre and y up
 * (the camera is placed so that 1 world unit at z = 0 is exactly 1 CSS pixel).
 * The DOM works in CSS pixels from the top-left. Every rect that both sides need
 * to agree on — where a project's picture sits, where a case study's cover will
 * land — is computed here, once, so the hand-off between canvas and DOM is exact.
 */

export type Rect = { x: number; y: number; w: number; h: number };

/** Below this the layout is the stacked, phone one. Mirrors Tailwind's `md`. */
export const MOBILE_MAX = 767;

/** Cover pictures are 16:11 — see Project.cover. */
export const COVER_ASPECT = 16 / 11;

export function isMobile(w: number) {
  return w <= MOBILE_MAX;
}

/** Gutter the DOM uses at this width: 16px on phones, 40px above. */
export function gutter(w: number) {
  return isMobile(w) ? 16 : 40;
}

/**
 * Where a project's picture sits during the proof chapter, top-left origin.
 *
 * Desktop: right of centre, so the project title can sit bottom-left and overlap
 * its left edge. Phone: full width less gutters, high enough to leave the bottom
 * third for the copy.
 */
export function projectRect(w: number, h: number): Rect {
  if (isMobile(w)) {
    const rw = w - gutter(w) * 2;
    const rh = rw / COVER_ASPECT;
    return { x: (w - rw) / 2, y: h * 0.4 - rh / 2, w: rw, h: rh };
  }
  const rw = Math.min(w * 0.56, h * 0.66 * COVER_ASPECT);
  const rh = rw / COVER_ASPECT;
  const cx = Math.min(w * 0.6, w - gutter(w) - rw / 2);
  return { x: cx - rw / 2, y: h * 0.47 - rh / 2, w: rw, h: rh };
}

/** Space above a case study's cover — clears the fixed HUD. */
export function coverTop(w: number) {
  return isMobile(w) ? 72 : 96;
}

/**
 * Where a case study's cover sits at scroll 0. The case-study page lays its cover
 * out with the same numbers in CSS (see `.case-cover` in globals.css); this is
 * the copy the stage morphs the picture to before the route changes.
 */
export function coverRect(w: number): Rect {
  const g = gutter(w);
  const rw = w - g * 2;
  return { x: g, y: coverTop(w), w: rw, h: rw / COVER_ASPECT };
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

/** Top-left rect → stage centre and size. */
export function toStage(r: Rect, w: number, h: number) {
  return {
    cx: r.x + r.w / 2 - w / 2,
    cy: h / 2 - (r.y + r.h / 2),
    w: r.w,
    h: r.h,
  };
}
