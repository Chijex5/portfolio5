"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { DURATION, EASE_GSAP, MAGNET } from "@/lib/tokens";
import { cn } from "@/lib/utils";

/**
 * Binds the cursor-follow listeners to one element and returns their teardown.
 * Kept out of the component so it takes a non-null element and stays readable.
 */
function attachMagnet(el: HTMLElement, strength: number) {
  const xTo = gsap.quickTo(el, "x", {
    duration: DURATION.base,
    ease: EASE_GSAP,
  });
  const yTo = gsap.quickTo(el, "y", {
    duration: DURATION.base,
    ease: EASE_GSAP,
  });
  const clamp = gsap.utils.clamp(-1, 1);

  function handleMove(event: PointerEvent) {
    const rect = el.getBoundingClientRect();
    // Cursor distance from centre, normalised to -1..1 across the element, then
    // scaled to the cap — so the pull stays proportional at any element size.
    const x = clamp(
      (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2),
    );
    const y = clamp(
      (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2),
    );
    xTo(x * strength);
    yTo(y * strength);
  }

  function handleLeave() {
    xTo(0);
    yTo(0);
  }

  el.addEventListener("pointermove", handleMove);
  el.addEventListener("pointerleave", handleLeave);

  return () => {
    el.removeEventListener("pointermove", handleMove);
    el.removeEventListener("pointerleave", handleLeave);
    gsap.set(el, { x: 0, y: 0 });
  };
}

type MagneticButtonProps = {
  children: React.ReactNode;
  className?: string;
  /** px cap on the pull. Defaults to the design-system MAGNET.max (12px). */
  strength?: number;
};

/**
 * Wraps a single interactive element and pulls it toward the cursor on hover,
 * capped at `strength` px. The wrapper owns the transform so the child keeps its
 * own layout classes; nesting also lets a caller position this element without
 * GSAP and Tailwind fighting over `transform` on the same node.
 *
 * A `div` (inline-block) rather than a `span`, so it can legally wrap flow
 * content like the header's <nav> as well as a link.
 */
export default function MagneticButton({
  children,
  className,
  strength = MAGNET.max,
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      // Cursor-follow is a fine-pointer, motion-OK affordance only: on touch a
      // tap would fire pointermove and leave the element offset. gsap.matchMedia
      // tears the listeners down (and resets the transform) when the query stops
      // matching, and the surrounding useGSAP context reverts it on unmount.
      const mm = gsap.matchMedia();
      mm.add(
        "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
        () => attachMagnet(el, strength),
      );
    },
    { dependencies: [strength], revertOnUpdate: true },
  );

  return (
    <div
      ref={ref}
      className={cn("inline-block will-change-transform", className)}
    >
      {children}
    </div>
  );
}
