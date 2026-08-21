"use client";

import { useRef } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { DURATION, EASE_GSAP, MOTION_OK, REVEAL } from "@/lib/tokens";

type SplitRevealProps = {
  children: React.ReactNode;
  /** Element to render. Keep the real heading level — this is page structure. */
  as?: "h1" | "h2" | "h3" | "p" | "div";
  className?: string;
  stagger?: number;
  delay?: number;
  /** Play on mount instead of on scroll. For above-the-fold copy. */
  immediate?: boolean;
};

/**
 * Line-by-line mask reveal for a block of text (plan §6).
 *
 * The text ships as real DOM text; SplitText only rearranges it on the client,
 * and sets an aria-label from the original string so the split lines stay
 * invisible to assistive tech. `autoSplit` re-measures when next/font swaps the
 * real face in and on resize — without it, lines split against the fallback
 * metrics and land in the wrong places.
 *
 * Everything is inside a matchMedia block, so reduced-motion users get plain
 * text with no split, no masks, and no hidden start state.
 */
export default function SplitReveal({
  children,
  as = "p",
  className,
  stagger = 0.08,
  delay = 0,
  immediate = false,
}: SplitRevealProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const mm = gsap.matchMedia();

      mm.add(MOTION_OK, () => {
        SplitText.create(el, {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          aria: "auto",
          linesClass: "split-line",
          // Returning the tween lets GSAP carry its playhead across re-splits
          // instead of replaying the reveal every time the fonts or size change.
          onSplit: (self) => {
            const vars: gsap.TweenVars = {
              yPercent: 110,
              duration: DURATION.slow,
              ease: EASE_GSAP,
              stagger,
              delay,
            };
            if (!immediate) {
              vars.scrollTrigger = {
                trigger: el,
                start: REVEAL.start,
                once: true,
              };
            }
            return gsap.from(self.lines, vars);
          },
        });
      });
    },
    { dependencies: [stagger, delay, immediate], revertOnUpdate: true },
  );

  const Tag = as as React.ElementType;
  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
