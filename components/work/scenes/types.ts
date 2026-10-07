import type { gsap } from "@/lib/gsap";

/**
 * Every scene builds one paused GSAP timeline and hands it up. The contract:
 * one unit of timeline time per step, so step k plays across [k, k + 1) and the
 * whole timeline lasts exactly `steps.length`. Whoever owns the scene decides
 * how time moves — scroll on the home page, the clock on a case study.
 */
export type SceneProps = {
  register: (tl: gsap.core.Timeline) => void;
};
