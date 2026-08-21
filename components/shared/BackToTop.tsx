"use client";

import { useLenis } from "lenis/react";

/**
 * Scrolling back to the top is an action, not navigation, so this is a button
 * rather than a link to "#top" — and it works identically on the home page and
 * on a case-study route. Falls back to native scroll if Lenis isn't mounted.
 */
export default function BackToTop({ className }: { className?: string }) {
  const lenis = useLenis();

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (lenis) lenis.scrollTo(0);
        else window.scrollTo({ top: 0, behavior: "smooth" });
      }}
    >
      Back to top
      <span aria-hidden="true">&#8593;</span>
    </button>
  );
}
