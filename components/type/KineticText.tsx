"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { applyKinetic, type KineticSpec } from "@/lib/kinetic";
import { MOTION_OK } from "@/lib/tokens";
import { cn } from "@/lib/utils";

type KineticTextProps = KineticSpec & {
  children: React.ReactNode;
  /** Keep the real heading level — this is page structure, not decoration. */
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";
  className?: string;
};

/**
 * Type whose variable-font axes morph as it scrolls through the viewport.
 *
 * The rendered element keeps whatever weight the CSS gives it until the morph
 * takes over, so reduced-motion and no-JS visitors get a normal, finished
 * heading — the axes are an enhancement, never the legible state.
 */
export default function KineticText({
  children,
  as = "span",
  className,
  ...spec
}: KineticTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { wght, opsz, soft, wonk, tracking, start, end, yoyo } = spec;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        applyKinetic(el, spec);
      });
    },
    // The spec is spread into primitives so a caller passing an inline object
    // literal doesn't re-bind this every render.
    {
      dependencies: [
        wght?.[0],
        wght?.[1],
        opsz?.[0],
        opsz?.[1],
        soft?.[0],
        soft?.[1],
        wonk?.[0],
        wonk?.[1],
        tracking?.[0],
        tracking?.[1],
        start,
        end,
        yoyo,
      ],
      revertOnUpdate: true,
    },
  );

  // One concrete element for the type system — see the note in SplitReveal.
  const Tag = as as "div";

  return (
    <Tag ref={ref} className={cn("kinetic", className)}>
      {children}
    </Tag>
  );
}
