"use client";

import { useRef } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { onRevealStart } from "@/lib/intro";
import { applyKinetic, type KineticSpec } from "@/lib/kinetic";
import { DURATION, EASE_GSAP, MOTION_OK, REVEAL } from "@/lib/tokens";
import { cn } from "@/lib/utils";

type SplitRevealProps = {
  children: React.ReactNode;
  /** Element to render. Keep the real heading level — this is page structure. */
  as?: "h1" | "h2" | "h3" | "p" | "div";
  className?: string;
  stagger?: number;
  delay?: number;
  /** Play on mount instead of on scroll. For above-the-fold copy. */
  immediate?: boolean;
  /**
   * Wait for the site to open (lib/intro.ts) rather than playing on mount.
   *
   * Only meaningful with `immediate`: a scroll-triggered reveal already has a
   * trigger, and it is one nobody can reach while the preloader is up. Use it
   * for text that has to land on a beat of the hero's opening — the point is
   * that the two are then on the same clock, so neither has to know how long
   * the load took.
   */
  gate?: boolean;
  /**
   * Also morph the variable-font axes across this block's scroll pass.
   *
   * Applied to the root element, not the split lines: `font-variation-settings`
   * inherits, so one declaration reaches every line SplitText creates — and the
   * axis tween survives the re-splits `autoSplit` triggers, which a per-line
   * tween would not.
   */
  kinetic?: KineticSpec;
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
  gate = false,
  kinetic,
}: SplitRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const mm = gsap.matchMedia();

      mm.add(MOTION_OK, () => {
        const held = gate && immediate;
        /** Live only for the current split's tween — see below. */
        let offReveal: (() => void) | undefined;

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
            };
            // Gated, the delay moves off the tween and onto the play below.
            // GSAP does re-serve a delay across a pause, but only as far as it
            // had got: `pause()` records `max(-delay, rawTime())` and resume
            // feeds that back (gsap-core.js:1771). So the beat would come out
            // right only if the pause landed in the same tick as the creation —
            // true on the first split, not guaranteed on a re-split, which
            // `loadingdone` and the resize observer can fire at any moment.
            // Scheduling it on the play instead makes it the full interval from
            // the reveal every time, which is the thing being specified.
            if (!held) vars.delay = delay;
            if (!immediate) {
              vars.scrollTrigger = {
                trigger: el,
                start: REVEAL.start,
                once: true,
              };
            }

            const tween = gsap.from(self.lines, vars);

            if (held) {
              // Paused *after* creation, never with `immediateRender: false`:
              // rendering the start state is exactly what parks the lines under
              // their masks, and without it the finished text would sit there in
              // the open until the gate released it.
              //
              // Safe against the playhead carry above, in both directions:
              // SplitText only re-applies a stashed time when it is truthy
              // (SplitText.js:284), so a re-split before the reveal leaves this
              // at 0, and one after it renders straight to the end — a paused
              // tween still renders on `totalTime()`, it just doesn't advance.
              tween.pause();
              // Each re-split builds a new tween, so the subscription belongs to
              // this one; the previous tween's is dropped first.
              offReveal?.();
              offReveal = onRevealStart(() =>
                delay
                  ? gsap.delayedCall(delay, () => tween.play())
                  : tween.play(),
              );
            }

            return tween;
          },
        });

        if (kinetic) applyKinetic(el, kinetic);

        return () => offReveal?.();
      });
    },
    { dependencies: [stagger, delay, immediate, gate], revertOnUpdate: true },
  );

  // The tag is polymorphic at runtime, so the type system gets told about one
  // concrete element. Casting to `React.ElementType` instead collapses the props
  // of every intrinsic element down to their intersection, which is `never` —
  // hence no `className`, no `ref`, no children.
  const Tag = as as "div";

  return (
    <Tag ref={ref} className={cn(kinetic && "kinetic", className)}>
      {children}
    </Tag>
  );
}
