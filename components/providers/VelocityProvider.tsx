"use client";

import { useEffect } from "react";
import { useLenis } from "lenis/react";
import { gsap } from "@/lib/gsap";
import { dampVelocity, writePointer, writeScroll } from "@/lib/velocity";

/**
 * Feeds the shared velocity store (lib/velocity.ts) and damps it once per frame.
 *
 * Mounted inside SmoothScrollProvider so it can read the Lenis context. It adds
 * *no* RAF of its own: damping rides the GSAP ticker that already drives Lenis,
 * so the whole site still has exactly one loop.
 */
export default function VelocityProvider() {
  useLenis((lenis) => writeScroll(lenis.velocity));

  useEffect(() => {
    let lastX = 0;
    let lastY = 0;
    let seen = false;

    function handleMove(event: PointerEvent) {
      // First move only establishes the origin — otherwise the cursor appears to
      // arrive from (0,0) at enormous speed.
      if (seen) writePointer(event.clientX - lastX, event.clientY - lastY);
      lastX = event.clientX;
      lastY = event.clientY;
      seen = true;
    }

    function handleLeave() {
      seen = false;
    }

    window.addEventListener("pointermove", handleMove, { passive: true });
    document.addEventListener("pointerleave", handleLeave);

    // deltaTime is the ms since the previous tick.
    const damp = (_time: number, deltaTime: number) => dampVelocity(deltaTime);
    gsap.ticker.add(damp);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerleave", handleLeave);
      gsap.ticker.remove(damp);
    };
  }, []);

  return null;
}
