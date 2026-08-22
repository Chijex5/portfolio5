"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { MARQUEE, MOTION_OK } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import { getVelocity } from "@/lib/velocity";

type MarqueeProps = {
  children: React.ReactNode;
  /** Seconds for one full loop at rest. Higher = slower. */
  speed?: number;
  reverse?: boolean;
  /** Multiple of the base rate added at full scroll velocity. */
  boost?: number;
  className?: string;
};

/**
 * Seamless marquee that reacts to how fast the page is scrolling.
 *
 * The track holds two identical copies of `children` and slides by exactly -50%,
 * which lands the second copy where the first started — so any position in 0..-50%
 * is a valid, seamless frame. The duplicate is aria-hidden so screen readers and
 * search engines see the text once.
 *
 * Two loops, in order of preference:
 *
 *   1. The CSS keyframes in `.marquee-track` run from first paint, before any JS.
 *      That's the no-JS and reduced-motion loop, and it's why this component still
 *      renders on the server.
 *   2. Once hydrated (and motion is welcome), the ticker takes over: same -50%
 *      cycle, but the rate is scaled by page-scroll velocity and *signed* by scroll
 *      direction, so the strip accelerates when you move and runs backwards when
 *      you scroll up. Velocity comes from the shared store, so this agrees with
 *      the carousel and the row skews rather than sampling scroll a second time.
 *
 * The handover reads the CSS animation's current position out of the computed
 * transform first. Without that, hydrating mid-cycle would snap the strip back to
 * zero — a jump of up to half its width.
 */
export default function Marquee({
  children,
  speed = 28,
  reverse = false,
  boost = MARQUEE.boost,
  className,
}: MarqueeProps) {
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = track.current;
      if (!el) return;

      const mm = gsap.matchMedia();

      mm.add(MOTION_OK, () => {
        // Where CSS got to. The keyframes translate by a percentage of the
        // element's own width, so the computed matrix gives px over a 0..-50%
        // range — halve the width and the ratio is the cycle position.
        let progress = 0;
        const current = getComputedStyle(el).transform;
        if (current && current !== "none" && el.offsetWidth > 0) {
          try {
            const matrix = new DOMMatrixReadOnly(current);
            progress = Math.abs(matrix.m41) / (el.offsetWidth * 0.5);
          } catch {
            progress = 0;
          }
        }

        // Inline, so it beats the class and is trivially undone if the
        // reduced-motion preference flips mid-session.
        el.style.animation = "none";

        const dir = reverse ? -1 : 1;

        // An arrow rather than a `function` declaration: TypeScript keeps the
        // `el` non-null narrowing inside closures created after the guard, but
        // resets it inside hoisted declarations, which it can't order.
        const frame = (_time: number, delta: number) => {
          const velocity = getVelocity();
          // Per-frame share of one cycle, scaled by speed and signed by the
          // direction the page is travelling. Clamped delta so a backgrounded tab
          // doesn't teleport the strip on return.
          const rate =
            (Math.min(delta, 50) / 1000 / speed) *
            dir *
            velocity.scrollDir *
            (1 + velocity.scrollAbs * boost);

          progress = (progress + rate) % 1;
          if (progress < 0) progress += 1;

          el.style.transform = `translate3d(${-50 * progress}%, 0, 0)`;
        };

        gsap.ticker.add(frame);

        return () => {
          gsap.ticker.remove(frame);
          el.style.removeProperty("transform");
          el.style.removeProperty("animation");
        };
      });
    },
    { dependencies: [speed, reverse, boost], revertOnUpdate: true },
  );

  return (
    <div className={cn("overflow-hidden", className)}>
      <div
        ref={track}
        className="marquee-track flex w-max will-change-transform"
        style={
          {
            "--marquee-duration": `${speed}s`,
            animationDirection: reverse ? "reverse" : "normal",
          } as React.CSSProperties
        }
      >
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
