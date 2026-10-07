"use client";

import { useEffect, useRef, useState } from "react";
import { ReactLenis, useLenis, type LenisRef } from "lenis/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { setLenis } from "@/lib/scroll";
import { stage } from "@/lib/stage/stage";

/**
 * Keeps ScrollTrigger in step with Lenis, and hands scroll speed to the particle
 * stage (fast scrolling stirs the particles up). Lives inside <ReactLenis> so it
 * can read the Lenis context.
 */
function Bridge() {
  const lenis = useLenis((l) => {
    ScrollTrigger.update();
    stage.setVelocity(l.velocity);
  });
  useEffect(() => {
    setLenis(lenis ?? null);
    return () => setLenis(null);
  }, [lenis]);
  return null;
}

/**
 * Root smooth scroll. One loop for the whole site: Lenis's RAF is driven by the
 * GSAP ticker, which also drives the particle stage, so scroll, ScrollTrigger and
 * the canvas all advance on the same frame.
 *
 * Under reduced motion Lenis stays mounted (so nothing below it remounts — the
 * stage canvas in particular must never be swapped out) but stops smoothing:
 * the wheel scrolls natively.
 */
export default function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const lenisRef = useRef<LenisRef | null>(null);
  const [smooth, setSmooth] = useState(true);

  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setSmooth(!mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    function raf(time: number) {
      // GSAP ticker time is in seconds; Lenis expects milliseconds.
      lenisRef.current?.lenis?.raf(time * 1000);
    }
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    return () => gsap.ticker.remove(raf);
  }, []);

  return (
    <ReactLenis
      root
      ref={lenisRef}
      options={{
        autoRaf: false,
        lerp: 0.085,
        wheelMultiplier: 0.9,
        anchors: true,
        smoothWheel: smooth,
      }}
    >
      {children}
      <Bridge />
    </ReactLenis>
  );
}
