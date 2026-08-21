"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/**
 * Fixed top progress bar that fills as the page scrolls. Doubles as a live proof
 * that ScrollTrigger is driven by Lenis (scrub tracks smoothed scroll, not native).
 */
export default function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.to(bar.current, {
      scaleX: 1,
      ease: "none",
      scrollTrigger: {
        trigger: document.documentElement,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
      },
    });
  }, []);

  return (
    <div
      ref={bar}
      aria-hidden
      className="bg-signal fixed top-0 left-0 z-50 h-0.5 w-full origin-left scale-x-0"
    />
  );
}
