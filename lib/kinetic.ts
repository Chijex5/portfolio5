/**
 * Kinetic type: scroll-driven variable-font axis morphing.
 *
 * Fraunces carries four axes (wght, opsz, SOFT, WONK). Weight and optical size
 * are what read at display sizes — low weight + low opsz gives a fine, spindly
 * cut; high weight + high opsz gives a fat, high-contrast one. Scrubbing between
 * them as type crosses the viewport is the "shifts weights and sizes during
 * scroll transitions" effect.
 *
 * The axes are driven through registered CSS custom properties rather than
 * `font-variation-settings` strings, so:
 *   - GSAP tweens plain numbers (no string interpolation to get wrong),
 *   - `@property` gives the browser a typed value it can interpolate itself,
 *   - `font-variation-settings` is an *inherited* property, so declaring it once
 *     on the element covers every SplitText line inside it.
 * See the `@property` block and `.kinetic` in app/globals.css.
 */

import { gsap, ScrollTrigger } from "@/lib/gsap";
import { AXES } from "@/lib/tokens";

/** A [from, to] pair in axis units. */
export type AxisRange = readonly [number, number];

export type KineticSpec = {
  wght?: AxisRange;
  opsz?: AxisRange;
  soft?: AxisRange;
  wonk?: AxisRange;
  /** em of letter-spacing, [from, to]. Weight gain needs space to land in. */
  tracking?: AxisRange;
  /**
   * ScrollTrigger start/end. Defaults span the element's whole pass through the
   * viewport, so the morph is tied to the scroll transition rather than a moment.
   */
  start?: string;
  end?: string;
  /**
   * Play the range out and back (thin → heavy → thin) instead of one direction.
   * Reads as the type "breathing" through the section.
   */
  yoyo?: boolean;
};

const CLAMPS = {
  wght: AXES.wght,
  opsz: AXES.opsz,
  soft: AXES.soft,
  wonk: AXES.wonk,
} as const;

/** Axis order must match the font-variation-settings declaration in globals.css. */
const AXIS_VARS = {
  wght: "--wght",
  opsz: "--opsz",
  soft: "--soft",
  wonk: "--wonk",
} as const;

type AxisName = keyof typeof AXIS_VARS;

const DEFAULTS = {
  start: "top 92%",
  end: "bottom 18%",
} as const;

function clampAxis(axis: AxisName, value: number) {
  const { min, max } = CLAMPS[axis];
  return Math.min(max, Math.max(min, value));
}

/**
 * Wires one element's axes to its own scroll progress. Returns nothing — the
 * tweens register with the enclosing gsap context (useGSAP / matchMedia), which
 * owns their teardown.
 */
export function applyKinetic(el: HTMLElement, spec: KineticSpec) {
  const {
    tracking,
    start = DEFAULTS.start,
    end = DEFAULTS.end,
    yoyo = false,
  } = spec;

  // A proxy object, not the element: axis values are numbers here and only
  // become CSS on the way out, so nothing has to parse a string per frame.
  const axes: AxisName[] = (["wght", "opsz", "soft", "wonk"] as const).filter(
    (axis) => spec[axis] !== undefined,
  );
  if (axes.length === 0 && !tracking) return;

  const from: Record<string, number> = {};
  const to: Record<string, number> = {};

  for (const axis of axes) {
    const [a, b] = spec[axis] as AxisRange;
    from[axis] = clampAxis(axis, a);
    to[axis] = clampAxis(axis, b);
  }
  if (tracking) {
    from.tracking = tracking[0];
    to.tracking = tracking[1];
  }

  const proxy = { ...from };
  const style = el.style;

  function write() {
    for (const axis of axes) {
      style.setProperty(
        AXIS_VARS[axis],
        String(Math.round(proxy[axis] * 100) / 100),
      );
    }
    if (tracking) style.letterSpacing = `${proxy.tracking.toFixed(4)}em`;
  }

  write();

  // Two halves rather than one tween with yoyo: a scrubbed tween's playhead is
  // the scroll position, so `yoyo` (a repeat flag) would never fire. The
  // out-and-back has to exist in the timeline itself.
  const timeline = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: { trigger: el, start, end, scrub: true },
    onUpdate: write,
  });

  if (yoyo) {
    timeline
      .to(proxy, { ...to, duration: 0.5 })
      .to(proxy, { ...from, duration: 0.5 });
  } else {
    timeline.to(proxy, { ...to, duration: 1 });
  }

  return timeline;
}

/**
 * Same axis morph, driven by hover/focus instead of scroll. Used by the work
 * rows: the title thickens as the row opens. Returns its teardown.
 */
export function attachKineticHover(
  el: HTMLElement,
  spec: Pick<KineticSpec, "wght" | "opsz" | "soft" | "wonk" | "tracking">,
  duration: number,
) {
  const axes = (["wght", "opsz", "soft", "wonk"] as const).filter(
    (axis) => spec[axis] !== undefined,
  );

  const from: Record<string, number> = {};
  const to: Record<string, number> = {};
  for (const axis of axes) {
    const [a, b] = spec[axis] as AxisRange;
    from[axis] = clampAxis(axis, a);
    to[axis] = clampAxis(axis, b);
  }
  if (spec.tracking) {
    from.tracking = spec.tracking[0];
    to.tracking = spec.tracking[1];
  }

  const proxy = { ...from };

  function write() {
    for (const axis of axes) {
      el.style.setProperty(
        AXIS_VARS[axis],
        String(Math.round(proxy[axis] * 100) / 100),
      );
    }
    if (spec.tracking)
      el.style.letterSpacing = `${proxy.tracking.toFixed(4)}em`;
  }

  write();

  const tween = gsap.to(proxy, {
    ...to,
    duration,
    ease: "expo.out",
    paused: true,
    onUpdate: write,
  });

  return {
    play: () => tween.play(),
    reverse: () => tween.reverse(),
    kill: () => {
      tween.kill();
      for (const axis of axes) el.style.removeProperty(AXIS_VARS[axis]);
      if (spec.tracking) el.style.removeProperty("letter-spacing");
    },
  };
}

/** Re-export so callers don't need a second import to refresh triggers. */
export { ScrollTrigger };
