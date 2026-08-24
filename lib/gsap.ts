"use client";

// Centralized GSAP plugin registration. Import { gsap, ... } from here in client
// components so plugins are guaranteed registered exactly once.
//
// Flip is deliberately absent. The plan named it for the carousel's
// click-to-expand handoff, and it was registered here for exactly that — but the
// transition ended up animating an element between two rects it already knows
// (the plate's rect at click time, and the viewport), which is a plain `fromTo`.
// Flip's diffing added a failure mode instead of a capability: a Flip timeline
// that finds no delta completes instantly, and a callback appended to a completed
// timeline never fires, which silently broke the navigation. See the note in
// components/work/LiquidCarousel.tsx. Register it here if a future transition
// genuinely needs to discover its own start and end states.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);
}

export { gsap, ScrollTrigger, SplitText, useGSAP };
