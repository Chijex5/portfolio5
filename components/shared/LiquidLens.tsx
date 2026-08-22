"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { HOVER_OK, LENS, VELOCITY } from "@/lib/tokens";
import { getVelocity } from "@/lib/velocity";

/**
 * A soft warm highlight that trails the cursor and stretches along its direction
 * of travel — the "wet surface" pass over the whole page.
 *
 * It is a single blend-moded radial gradient, not a WebGL layer: at this size a
 * shader would buy nothing a gradient can't do, and staying in CSS means the lens
 * composites over live DOM text without the text ever leaving the DOM.
 *
 * Three separate quickTo tweens rather than one: position should feel heavy and
 * lag well behind the cursor, while the stretch has to snap back quickly or the
 * lens stays smeared after the cursor stops. Different masses, different springs.
 *
 * `pointer-events: none` and `aria-hidden` throughout — it can never take a click
 * from the page underneath it, and there is nothing here to announce.
 */
export default function LiquidLens() {
  const lens = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = lens.current;
    if (!el) return;

    const mm = gsap.matchMedia();

    // Fine-pointer only. On touch there is no cursor to trail, and a tap would
    // park the lens wherever the finger last landed.
    mm.add(HOVER_OK, () => {
      const xTo = gsap.quickTo(el, "x", {
        duration: LENS.follow,
        ease: "power3.out",
      });
      const yTo = gsap.quickTo(el, "y", {
        duration: LENS.follow,
        ease: "power3.out",
      });
      // Deformation settles in a third of the time the position does.
      const fast = { duration: LENS.follow / 3, ease: "power2.out" };
      const scaleXTo = gsap.quickTo(el, "scaleX", fast);
      const scaleYTo = gsap.quickTo(el, "scaleY", fast);
      const rotateTo = gsap.quickTo(el, "rotate", fast);
      const opacityTo = gsap.quickTo(el, "opacity", {
        duration: LENS.follow,
        ease: "power2.out",
      });

      let cursorX = 0;
      let cursorY = 0;
      let seen = false;

      const handleMove = (event: PointerEvent) => {
        cursorX = event.clientX;
        cursorY = event.clientY;
        if (!seen) {
          // Place it under the cursor before revealing it, or the lens flies in
          // from the top-left corner on the first movement.
          seen = true;
          gsap.set(el, { x: cursorX, y: cursorY });
        }
      };

      const handleLeave = () => {
        seen = false;
        opacityTo(0);
      };

      const tick = () => {
        if (!seen) return;

        const velocity = getVelocity();

        xTo(cursorX);
        yTo(cursorY);

        // Stretch along the axis of travel and thin across it, then rotate the
        // whole ellipse to point where the cursor is going — so a diagonal flick
        // draws a diagonal smear rather than a wider circle.
        const speed = velocity.pointerSpeed;
        scaleXTo(1 + speed * LENS.stretch);
        scaleYTo(1 - speed * LENS.stretch * 0.42);
        rotateTo(
          (Math.atan2(velocity.pointerY, velocity.pointerX) * 180) / Math.PI,
        );

        // Brightest while moving. A lens sitting at full strength under a
        // stationary cursor just looks like a smudge on the screen.
        opacityTo(LENS.opacity * (0.35 + 0.65 * speed));

        // Published for CSS to read — the same number the magnets use.
        el.style.setProperty(
          "--lens-speed",
          (velocity.pointerSpeed / VELOCITY.norm.pointer).toFixed(4),
        );
      };

      window.addEventListener("pointermove", handleMove, { passive: true });
      document.addEventListener("pointerleave", handleLeave);
      gsap.ticker.add(tick);

      return () => {
        window.removeEventListener("pointermove", handleMove);
        document.removeEventListener("pointerleave", handleLeave);
        gsap.ticker.remove(tick);
        gsap.set(el, { opacity: 0 });
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <div
      ref={lens}
      aria-hidden="true"
      className="liquid-lens pointer-events-none fixed top-0 left-0 z-30 opacity-0"
      style={{
        width: `${LENS.size}px`,
        height: `${LENS.size}px`,
        // Centred on its own origin so the GSAP x/y above are cursor coordinates
        // directly, with no offset arithmetic per frame.
        marginLeft: `-${LENS.size / 2}px`,
        marginTop: `-${LENS.size / 2}px`,
      }}
    />
  );
}
