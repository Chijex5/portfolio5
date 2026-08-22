"use client";

import { useEffect, useRef } from "react";
import { ReactLenis, useLenis, type LenisRef } from "lenis/react";
import ElasticProvider from "@/components/providers/ElasticProvider";
import VelocityProvider from "@/components/providers/VelocityProvider";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { LENIS } from "@/lib/tokens";

// Keeps GSAP's ScrollTrigger in sync with Lenis's scroll position. Lives as a child
// of <ReactLenis> so it can read the Lenis context.
function ScrollTriggerBridge() {
  useLenis(() => ScrollTrigger.update());
  return null;
}

/**
 * Root smooth-scroll provider. One source of truth for scroll:
 * Lenis's RAF is driven by GSAP's ticker (single loop), and ScrollTrigger updates
 * off Lenis's scroll event. Do not add a second RAF loop or scroll driver.
 *
 * TODO(M11): gate smoothness on prefers-reduced-motion.
 */
export default function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const lenisRef = useRef<LenisRef | null>(null);

  useEffect(() => {
    function raf(time: number) {
      // GSAP ticker time is in seconds; Lenis expects milliseconds.
      lenisRef.current?.lenis?.raf(time * 1000);
    }
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(raf);
    };
  }, []);

  return (
    <ReactLenis
      root
      ref={lenisRef}
      options={{ autoRaf: false, lerp: LENIS.lerp, duration: LENIS.duration }}
    >
      {children}
      <ScrollTriggerBridge />
      {/* VelocityProvider writes the shared store; ElasticProvider reads it.
          Order in the tree is irrelevant — both run off the same ticker, and the
          store is a module singleton, not context. */}
      <VelocityProvider />
      <ElasticProvider />
    </ReactLenis>
  );
}
