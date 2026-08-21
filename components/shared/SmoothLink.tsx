"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLenis } from "lenis/react";
import { HEADER } from "@/lib/tokens";

type SmoothLinkProps = Omit<React.ComponentProps<typeof Link>, "href"> & {
  href: string;
  /** px offset applied to the scroll target; negative stops short of it. */
  offset?: number;
};

/**
 * A `next/link` that hands same-page hash targets to Lenis instead of the
 * browser, so in-page nav uses the same smooth-scroll instance as everything
 * else (never a second scroll driver — see SmoothScrollProvider).
 *
 * Cross-route hrefs like "/#work" clicked from /work/[slug] fall through to the
 * normal Next navigation, and `scroll-padding-top` in globals.css keeps the
 * resulting native hash jump clear of the fixed header.
 */
export default function SmoothLink({
  href,
  offset = -HEADER.offset,
  onClick,
  ...rest
}: SmoothLinkProps) {
  const lenis = useLenis();
  const pathname = usePathname();

  const hashAt = href.indexOf("#");
  const hash = hashAt === -1 ? "" : href.slice(hashAt);
  const path = hashAt === -1 ? href : href.slice(0, hashAt) || "/";

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;
    // Let the browser own modified clicks (new tab/window) and non-primary buttons.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    if (event.button !== 0) return;
    // Only intercept an anchor that exists on the page we're already on.
    if (!hash || !lenis || path !== pathname) return;

    const target = document.querySelector(hash);
    if (!target) return;

    event.preventDefault();
    lenis.scrollTo(target as HTMLElement, { offset });
    // Keep the URL shareable without a router navigation — pushState is wired
    // into the Next router, so usePathname/useSearchParams stay in sync.
    window.history.pushState(null, "", href);
  }

  return <Link href={href} onClick={handleClick} {...rest} />;
}
