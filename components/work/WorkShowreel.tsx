"use client";

import { useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import MobileCarousel from "@/components/work/MobileCarousel";
import { MOTION_OK } from "@/lib/tokens";
import type { Project } from "@/lib/types";

// `ssr: false` is only legal inside a Client Component, which is the whole
// reason this wrapper exists: the carousel touches WebGL and `window` on the
// first frame, and there is nothing about it worth rendering on the server.
const LiquidCarousel = dynamic(
  () => import("@/components/work/LiquidCarousel"),
  { ssr: false },
);

/** Cached: creating a probe canvas per render would be silly, and the answer
 *  can't change for the life of the document. */
let webgl: boolean | null = null;

function supportsWebGL() {
  if (webgl !== null) return webgl;
  try {
    const canvas = document.createElement("canvas");
    webgl = Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    webgl = false;
  }
  return webgl;
}

/**
 * The three conditions the WebGL band needs, as media queries.
 *
 * Width is not one of them on its own. A 1200px-wide touchscreen and a 1200px
 * browser window on a desktop want different carousels, and only the pointer
 * type tells them apart — which is exactly the "detection via pointer/matchMedia,
 * not just width" the plan calls for. Width is still in the list because the
 * desktop band needs room for a ring of 620px plates, but it is the last word,
 * not the first.
 */
const LIQUID_QUERIES = [
  MOTION_OK,
  "(hover: hover) and (pointer: fine)",
  "(min-width: 1024px)",
] as const;

type Mode = "liquid" | "snap";

function subscribe(onChange: () => void) {
  const queries = LIQUID_QUERIES.map((q) => window.matchMedia(q));
  for (const query of queries) query.addEventListener("change", onChange);
  return () => {
    for (const query of queries) query.removeEventListener("change", onChange);
  };
}

function getSnapshot(): Mode {
  const liquid =
    supportsWebGL() &&
    LIQUID_QUERIES.every((q) => window.matchMedia(q).matches);
  return liquid ? "liquid" : "snap";
}

/**
 * Chooses which carousel exists.
 *
 * This used to return `null` for anything that wasn't a motion-OK WebGL desktop,
 * which made the shader a toggle rather than a decision — and left a phone with no
 * carousel at all, only the numbered rows. The plan is explicit that mobile gets a
 * different carousel rather than a degraded one, so the fallback is now a real
 * scroll-snap strip (MobileCarousel) and this component's job is picking between
 * two implementations.
 *
 * Reduced motion resolves to the snap strip rather than to nothing, because
 * native scrolling is not an animation: someone who has asked for less motion
 * still gets to browse the covers.
 *
 * `useSyncExternalStore` rather than an effect + setState: the media queries are
 * external state, so the server renders the neutral value and the client decides
 * during hydration instead of after a second commit. The server snapshot is
 * `"snap"` — it is the one that is correct without WebGL, and it is plain DOM, so
 * a no-JS visitor who never reaches `subscribe` still gets a usable strip.
 */
export default function WorkShowreel({
  projects,
}: {
  projects: readonly Project[];
}) {
  const mode = useSyncExternalStore(subscribe, getSnapshot, () => "snap");

  if (mode === "snap") return <MobileCarousel projects={projects} />;

  return (
    <div className="border-ink/10 -mx-6 mt-14 border-y md:-mx-10 md:mt-20">
      <LiquidCarousel projects={projects} />
    </div>
  );
}
