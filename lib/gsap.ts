"use client";

// Centralized GSAP plugin registration. Import { gsap, ... } from here in client
// components so plugins are guaranteed registered exactly once. Add plugins to the
// registerPlugin call as later milestones need them (Flip → M9).
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);
}

export { gsap, ScrollTrigger, SplitText, useGSAP };
