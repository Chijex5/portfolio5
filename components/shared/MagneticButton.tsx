"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { DURATION, EASE_GSAP, HOVER_OK, MAGNET, VELOCITY } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import { getVelocity } from "@/lib/velocity";

/**
 * Binds the magnet to one element and returns its teardown.
 *
 * Pointer events only record where the cursor is; all writing happens in the
 * ticker callback. That matters because the cursor can decelerate *without*
 * moving — if the deformation were written from pointermove, the button would
 * stay stretched at whatever speed the last event carried.
 */
function attachMagnet(el: HTMLElement, strength: number) {
  // quickTo keeps one reusable tween per property instead of allocating a new
  // one every frame the cursor is inside.
  const to = (property: string, duration: number = DURATION.base) =>
    gsap.quickTo(el, property, { duration, ease: EASE_GSAP });

  const xTo = to("x");
  const yTo = to("y");
  // Deformation settles faster than position, so the stretch reads as a
  // reaction to the flick rather than a shape the button is stuck in.
  const skewTo = to("skewX", DURATION.base * 0.75);
  const scaleXTo = to("scaleX", DURATION.base * 0.75);
  const scaleYTo = to("scaleY", DURATION.base * 0.75);

  const clamp = gsap.utils.clamp(-1, 1);

  let inside = false;
  let cursorX = 0;
  let cursorY = 0;

  function frame() {
    if (!inside) return;

    const velocity = getVelocity();
    const rect = el.getBoundingClientRect();

    // Cursor distance from centre, normalised to -1..1 across the element.
    const px = clamp(
      (cursorX - (rect.left + rect.width / 2)) / (rect.width / 2),
    );
    const py = clamp(
      (cursorY - (rect.top + rect.height / 2)) / (rect.height / 2),
    );

    // Direction of travel, -1..1 per axis, from the shared velocity store — so
    // the pull is not just "where the cursor is" but "how hard it got there".
    const vx = clamp(velocity.pointerX / VELOCITY.norm.pointer);
    const vy = clamp(velocity.pointerY / VELOCITY.norm.pointer);

    // Position: the static pull, plus an overshoot along the velocity vector.
    xTo(px * strength + vx * MAGNET.overshoot);
    yTo(py * strength + vy * MAGNET.overshoot);

    // Deformation: stretch along the axis of travel and thin out across it. The
    // horizontal component drives the skew, because a lateral flick is the one
    // that reads as dragging something through a liquid.
    skewTo(-vx * MAGNET.skew);
    scaleXTo(1 + Math.abs(vx) * MAGNET.stretch);
    scaleYTo(1 - Math.abs(vx) * MAGNET.stretch * 0.45 + Math.abs(vy) * 0.04);

    // Exposed for CSS to react to — see `.magnet` in globals.css.
    el.style.setProperty("--magnet-speed", velocity.pointerSpeed.toFixed(3));
  }

  function handleMove(event: PointerEvent) {
    inside = true;
    cursorX = event.clientX;
    cursorY = event.clientY;
  }

  function handleLeave() {
    inside = false;
    xTo(0);
    yTo(0);
    skewTo(0);
    scaleXTo(1);
    scaleYTo(1);
    el.style.setProperty("--magnet-speed", "0");
  }

  el.addEventListener("pointermove", handleMove);
  el.addEventListener("pointerleave", handleLeave);
  gsap.ticker.add(frame);

  return () => {
    el.removeEventListener("pointermove", handleMove);
    el.removeEventListener("pointerleave", handleLeave);
    gsap.ticker.remove(frame);
    gsap.set(el, { x: 0, y: 0, skewX: 0, scaleX: 1, scaleY: 1 });
    el.style.removeProperty("--magnet-speed");
  };
}

type MagneticButtonProps = {
  children: React.ReactNode;
  className?: string;
  /** px cap on the positional pull. Defaults to MAGNET.max (12px). */
  strength?: number;
};

/**
 * Wraps a single interactive element and pulls it toward the cursor, capped at
 * `strength` px — then reacts to how *fast* the cursor is moving: it overshoots
 * along the direction of travel and stretches along that axis, so a flick past
 * the button drags it out of shape and lets it spring back.
 *
 * Velocity comes from the shared store (lib/velocity.ts), never from a local
 * sampler, so every magnetic element on the page agrees on how fast the cursor
 * is going.
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
      mm.add(HOVER_OK, () => attachMagnet(el, strength));
    },
    { dependencies: [strength], revertOnUpdate: true },
  );

  return (
    <div
      ref={ref}
      className={cn("magnet inline-block will-change-transform", className)}
    >
      {children}
    </div>
  );
}
