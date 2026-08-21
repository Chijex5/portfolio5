"use client";

import { useCallback, useSyncExternalStore } from "react";
import { CONTACT } from "@/lib/nav";

/** Render-stable placeholder so the row doesn't reflow when the clock arrives. */
const PLACEHOLDER = "--:--";

/** The readout only carries minutes, so a coarse tick is plenty. */
const TICK_MS = 20_000;

/** Intl formatters are expensive to build and this one is read on every render. */
const formatters = new Map<string, Intl.DateTimeFormat>();

function format(timeZone: string) {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    formatters.set(timeZone, formatter);
  }
  return formatter.format(new Date());
}

/**
 * A `setInterval` rather than a rAF tick: this changes once a minute, and the page
 * already has exactly one rAF loop (Lenis, driven by the GSAP ticker).
 */
function subscribe(onStoreChange: () => void) {
  const id = setInterval(onStoreChange, TICK_MS);
  return () => clearInterval(id);
}

/**
 * My local time, live.
 *
 * The clock is an external, mutable source, so it's read through
 * useSyncExternalStore rather than mirrored into state from an effect. The server
 * snapshot is the placeholder — reading the real clock during render would
 * guarantee a hydration mismatch — and React swaps in the live value right after
 * hydration.
 */
export default function LocalTime({
  timeZone = CONTACT.timeZone,
  className,
}: {
  timeZone?: string;
  className?: string;
}) {
  const now = useSyncExternalStore(
    subscribe,
    useCallback(() => format(timeZone), [timeZone]),
    () => PLACEHOLDER,
  );

  return (
    <span
      className={className}
      aria-label={`Local time in ${CONTACT.location}`}
    >
      {now}
    </span>
  );
}
