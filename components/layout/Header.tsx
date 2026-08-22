"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useLenis } from "lenis/react";
import MagneticButton from "@/components/shared/MagneticButton";
import SmoothLink from "@/components/shared/SmoothLink";
import { CONTACT, NAV_LINKS } from "@/lib/nav";
import { cn } from "@/lib/utils";

/**
 * Fixed header: magnetic wordmark, magnetic pill nav, status indicator.
 *
 * Past the fold the header needs to stop competing with whatever has scrolled
 * under it, and the right answer differs by width:
 *
 *   - from `md` up the nav is an island in the middle of a wide, mostly empty
 *     bar, so the *pill* takes a surface and the rest of the header stays
 *     transparent. A full-width band there would be a heavy grey stripe across a
 *     page whose whole look is open warm paper.
 *   - below `md` there is no room for that. The wordmark sits directly over body
 *     copy and large cover images, so the header gets a blurred band instead and
 *     the pill drops its own surface — otherwise the pill reads as a second
 *     panel floating on the first.
 *
 * `pinned` is read off the shared Lenis instance (no extra scroll listener) and
 * only commits to React state when the boolean actually flips.
 */
export default function Header() {
  const [pinned, setPinned] = useState(false);
  const pinnedRef = useRef(false);

  useLenis((lenis) => {
    const next = lenis.scroll > 40;
    if (next === pinnedRef.current) return;
    pinnedRef.current = next;
    setPinned(next);
  });

  return (
    <header className="pointer-events-none fixed top-0 left-0 z-40 flex w-full items-center justify-between px-6 py-5 md:px-10">
      {/* Mobile-only blurred band. The mask fades the blur out at the bottom
          instead of ending on a hard horizontal line — backdrop-filter is clipped
          by the mask, so the falloff applies to the blur itself, not just to a
          tint over it. Sized past the header box (-bottom-4) so the fade has room
          to finish below the content it is protecting. */}
      <div
        aria-hidden="true"
        className={cn(
          "absolute -bottom-4 left-0 -z-10 w-full transition-opacity duration-300 md:hidden",
          "bg-paper/70 top-0 backdrop-blur-lg",
          "[mask-image:linear-gradient(to_bottom,black_58%,transparent_100%)]",
          pinned ? "opacity-100" : "opacity-0",
        )}
      />

      <a
        href="#main"
        className="bg-ink text-paper pointer-events-auto sr-only rounded-full px-4 py-2 text-sm focus:not-sr-only focus:absolute focus:top-5 focus:left-6"
      >
        Skip to content
      </a>

      {/* Wordmark */}
      <MagneticButton className="pointer-events-auto" strength={8}>
        <Link
          href="/"
          aria-label={`${CONTACT.name} — home`}
          className="font-display hover:text-signal text-xl tracking-tight transition-colors duration-200"
        >
          {CONTACT.shortName}
          <span className="text-signal">.</span>
        </Link>
      </MagneticButton>

      {/* Pill nav — the positioning wrapper is separate from the magnetic
          wrapper so GSAP's transform and Tailwind's centering don't collide.
          Centred only from md up: an absolutely centred pill would sit under the
          wordmark on a narrow screen, so on mobile it stays in flow (the status
          indicator is hidden there) and justify-between pushes it right. */}
      <div className="ml-auto md:absolute md:left-1/2 md:ml-0 md:-translate-x-1/2">
        <MagneticButton className="pointer-events-auto" strength={6}>
          <nav aria-label="Primary">
            <ul
              className={cn(
                "flex items-center gap-1 rounded-full border p-1 transition-colors duration-300",
                // Surface from `md` up only: on mobile the header band above is
                // already doing this job, and stacking both looks like two panels.
                pinned
                  ? "md:border-ink/10 md:bg-paper/80 border-transparent md:shadow-[0_1px_20px_rgba(20,17,15,0.06)] md:backdrop-blur-md"
                  : "border-transparent",
              )}
            >
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <SmoothLink
                    href={link.href}
                    className="hover:bg-ink hover:text-paper block rounded-full px-3 py-2 text-sm transition-colors duration-300 md:px-4"
                  >
                    {link.label}
                  </SmoothLink>
                </li>
              ))}
            </ul>
          </nav>
        </MagneticButton>
      </div>

      {/* Status */}
      {CONTACT.available ? (
        <p className="text-ink-muted pointer-events-auto hidden items-center gap-2 font-mono text-xs tracking-[0.16em] uppercase md:flex">
          <span
            className="status-dot bg-signal size-1.5 rounded-full"
            aria-hidden="true"
          />
          Available for work
        </p>
      ) : (
        <span aria-hidden="true" />
      )}
    </header>
  );
}
