"use client";

import { useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
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

function subscribe(onChange: () => void) {
  const query = window.matchMedia(MOTION_OK);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getSnapshot() {
  return supportsWebGL() && window.matchMedia(MOTION_OK).matches;
}

/**
 * Decides whether the liquid carousel gets to exist.
 *
 * It's an enhancement on top of the work list, never the only way to see the
 * work — so no WebGL, or a stated preference for reduced motion, and the band
 * simply isn't there. `useSyncExternalStore` rather than an effect + setState:
 * the media query is external state, and reading it through a snapshot means the
 * server renders nothing and the client decides during hydration instead of after
 * a second commit.
 */
export default function WorkShowreel({
  projects,
}: {
  projects: readonly Project[];
}) {
  const enabled = useSyncExternalStore(subscribe, getSnapshot, () => false);

  if (!enabled) return null;

  return (
    <div className="border-ink/10 -mx-6 mt-14 border-y md:-mx-10 md:mt-20">
      <LiquidCarousel projects={projects} />
    </div>
  );
}
