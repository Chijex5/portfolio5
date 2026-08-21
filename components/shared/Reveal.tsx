"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { DURATION, EASE_GSAP, MOTION_OK, REVEAL } from "@/lib/tokens";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Seconds. Use small offsets to stagger siblings. */
  delay?: number;
  /** px travelled on the way in. */
  y?: number;
};

/**
 * Rise-and-fade on first scroll into view — for anything that isn't type
 * (plates, columns, rows). Text uses SplitReveal instead.
 *
 * `once: true` because a section that re-animates every time you scroll back up
 * reads as broken rather than alive.
 */
export default function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const mm = gsap.matchMedia();

      mm.add(MOTION_OK, () => {
        gsap.from(el, {
          y,
          opacity: 0,
          duration: DURATION.slow,
          ease: EASE_GSAP,
          delay,
          scrollTrigger: { trigger: el, start: REVEAL.start, once: true },
        });
      });
    },
    { dependencies: [delay, y], revertOnUpdate: true },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
