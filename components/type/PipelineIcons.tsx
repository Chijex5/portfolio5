"use client";

/**
 * The five pipeline icons, as stroke-only inline SVG.
 *
 * Inline rather than an icon package, for one reason that decides everything
 * about how they are drawn: these have to *draw themselves on*. A stroke can be
 * animated by tweening `stroke-dashoffset` from the path's length down to zero,
 * which reads as a line being written — the same hairline language the rules and
 * seams elsewhere on the site use. Icon sets ship filled or fixed-stroke shapes
 * that can only fade or scale, and a fade would be exactly the "text just gets
 * darker" non-event this section is being rebuilt to fix.
 *
 * Every path carries `pathLength={1}`, which renormalises its geometry so the
 * total length is 1 no matter how long the real path is. That means one pair of
 * numbers — `strokeDasharray: 1`, `strokeDashoffset: 1 → 0` — draws any of these
 * correctly, with no per-icon measurement and no `getTotalLength()` call at
 * runtime. It is also why a caller can stagger the paths within an icon without
 * knowing anything about the shape.
 *
 * `currentColor` throughout, so the section controls colour and the icon inherits
 * the same accent transitions as the type beside it.
 */

type IconProps = { className?: string };

/** Shared across all five: hairline weight, round joins, no fill. */
const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.25,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  pathLength: 1,
} as const;

function Frame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      // Decorative: the step's word and copy already say what this is, so an
      // accessible name here would just be read twice.
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/** 01 — Idea. A bulb: glass, base, filament, and three rays. */
export function IconIdea({ className }: IconProps) {
  return (
    <Frame className={className}>
      {/* Glass */}
      <path
        {...STROKE}
        d="M24 8a11 11 0 0 0-6.5 19.9c1 .8 1.6 1.9 1.6 3.1v1h9.8v-1c0-1.2.6-2.3 1.6-3.1A11 11 0 0 0 24 8Z"
      />
      {/* Base */}
      <path {...STROKE} d="M20.1 36h7.8M21.4 40h5.2" />
      {/* Filament */}
      <path {...STROKE} d="M21.6 18.5 24 22.4l2.4-3.9" />
      {/* Rays — the last thing to arrive, so the bulb reads as switching on */}
      <path {...STROKE} d="M24 2.5v2.2M38.5 9.5l-1.6 1.6M9.5 9.5l1.6 1.6" />
    </Frame>
  );
}

/** 02 — Schema. Three records with the relations drawn between them. */
export function IconSchema({ className }: IconProps) {
  return (
    <Frame className={className}>
      <path {...STROKE} d="M6 7h15v9H6zM27 22h15v9H27zM6 37h15v9H6z" />
      {/* Field lines inside the first record */}
      <path {...STROKE} d="M9.5 11.5h8" />
      {/* Relations */}
      <path {...STROKE} d="M21 11.5h3a3 3 0 0 1 3 3v7" />
      <path {...STROKE} d="M27 31v7a3 3 0 0 1-3 3h-3" />
    </Frame>
  );
}

/** 03 — API. A contract between two brackets. */
export function IconApi({ className }: IconProps) {
  return (
    <Frame className={className}>
      {/* Brackets */}
      <path {...STROKE} d="M15 12c-6 0-6 5-6 12s0 12 6 12" />
      <path {...STROKE} d="M33 12c6 0 6 5 6 12s0 12-6 12" />
      {/* The payload passing between them */}
      <path {...STROKE} d="M18 24h12" />
      <path {...STROKE} d="M26.5 20.5 30 24l-3.5 3.5" />
    </Frame>
  );
}

/** 04 — Interface. A window with a cursor in it. */
export function IconInterface({ className }: IconProps) {
  return (
    <Frame className={className}>
      <path {...STROKE} d="M6 10h36v28H6z" />
      {/* Chrome */}
      <path {...STROKE} d="M6 18h36M10.5 14h3M16 14h3" />
      {/* Cursor */}
      <path {...STROKE} d="m22 24 9 9-3.6.9 2.3 4.4-2.1 1.1-2.3-4.4-2.6 2.7z" />
    </Frame>
  );
}

/** 05 — Shipped. An arrow leaving the frame it was built in. */
export function IconShipped({ className }: IconProps) {
  return (
    <Frame className={className}>
      {/* The frame, deliberately open on the side the arrow leaves through */}
      <path {...STROKE} d="M26 8H8v32h32V22" />
      {/* Out and away */}
      <path {...STROKE} d="M22 26 40 8" />
      <path {...STROKE} d="M29 8h11v11" />
    </Frame>
  );
}

/** In pipeline order, so the section can index straight into it. */
export const PIPELINE_ICONS = [
  IconIdea,
  IconSchema,
  IconApi,
  IconInterface,
  IconShipped,
] as const;
