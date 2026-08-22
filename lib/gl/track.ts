/**
 * State the carousel's two layers share, one frame at a time.
 *
 * The physics live in exactly one place (the ticker callback in LiquidCarousel)
 * and both the WebGL plates and the DOM overlay read this object — never their
 * own copy. That's the same rule as lib/velocity.ts, for the same reason: two
 * integrators for one motion always drift, and the drift shows up as text
 * sliding off the picture it belongs to.
 */
export type TrackState = {
  /** px the ring has travelled. Grows without bound; wrapped for display. */
  offset: number;
  /** px/frame the ring is moving. Signed: positive moves plates left. */
  velocity: number;
  /** Index of the hovered/focused plate, or -1. */
  hover: number;
  /**
   * Eased 0..1 hover per plate, integrated once in the physics tick. Both layers
   * read it: the shader for contrast and lift, the overlay for the matching
   * perspective scale.
   */
  hoverEase: number[];
};

export function createTrackState(): TrackState {
  return { offset: 0, velocity: 0, hover: -1, hoverEase: [] };
}
