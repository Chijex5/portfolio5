"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import LocalTime from "@/components/shared/LocalTime";
import { chapter } from "@/lib/chapter";
import { CONTACT, NAV_LINKS } from "@/lib/nav";
import ThemeControls from "./ThemeControls";

/**
 * The four corners. Wordmark and nav up top; the running chapter and Lagos time
 * along the bottom. Each bar fades the paper in behind itself, so copy that
 * scrolls under it (the about section) stays out of the way.
 */
export default function Hud() {
  const current = useSyncExternalStore(
    chapter.subscribe,
    chapter.get,
    chapter.get,
  );

  return (
    <>
      <header className="text-ink from-paper via-paper/85 pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between bg-gradient-to-b to-transparent p-4 md:p-10">
        <Link
          href="/"
          data-cursor="Home"
          className="pointer-events-auto text-[0.95rem] font-medium tracking-[-0.02em]"
        >
          Chijioke<span className="text-accent">.</span>
        </Link>

        <p className="label text-ink-muted hidden lg:block">
          {CONTACT.role} — {CONTACT.location}
        </p>

        <div className="pointer-events-auto flex items-center gap-4 md:gap-8">
          <nav aria-label="Primary">
            <ul className="flex gap-4 text-[0.9rem] tracking-[-0.01em] md:gap-8 md:text-[0.95rem]">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="group relative inline-block">
                    {l.label}
                    <span className="bg-ink absolute -bottom-0.5 left-0 h-px w-full origin-right scale-x-0 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:origin-left group-hover:scale-x-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <ThemeControls />
        </div>
      </header>

      <div
        aria-hidden="true"
        className="label text-ink-muted from-paper via-paper/85 pointer-events-none fixed inset-x-0 bottom-0 z-40 flex items-end justify-between bg-gradient-to-t to-transparent p-4 md:p-10"
      >
        <p className="flex items-center gap-3">
          <span className="text-ink tabular-nums">{current.index}</span>
          <span className="bg-ink-faint h-px w-6" />
          <span key={current.label} className="hud-swap inline-block">
            {current.label}
          </span>
        </p>
        <p className="tabular-nums">
          {CONTACT.location} <LocalTime className="text-ink" />
        </p>
      </div>
    </>
  );
}
