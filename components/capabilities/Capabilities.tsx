"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { applyKinetic, attachKineticHover } from "@/lib/kinetic";
import { CAPABILITIES } from "@/lib/nav";
import { DURATION, EASE_GSAP, HOVER_OK, MOTION_OK, REVEAL } from "@/lib/tokens";

/**
 * Capabilities — what replaced the scrolling stack marquee.
 *
 * The marquee had one animation and said one thing: here are some words, moving.
 * It could not group, could not rank, and the loop meant no item was ever the
 * subject. This is the same content as four named groups, front to back in build
 * order, where the motion is doing something the layout means:
 *
 *   - each group's tools rise out of their own mask on entry, staggered, so the
 *     row assembles left to right the way you'd read it;
 *   - the whole group morphs its variable-font axes as it crosses the viewport
 *     (thin and wide on the way in, heavier and tighter at centre), which is the
 *     same kinetic-type language as the hero and KineticStatement;
 *   - pointing at a single tool thickens just that one and pulls it up — the
 *     hover is per item, not per row, so the thing under the cursor is the thing
 *     that answers.
 *
 * The rule between rows draws itself on entry rather than being a static border,
 * so scrolling the section reads as it being written out.
 *
 * Everything is inside matchMedia: with reduced motion the section is a finished,
 * fully legible list at rest weight, with no hidden start state.
 */
export default function Capabilities() {
  const root = useRef<HTMLElement>(null);
  const count = String(CAPABILITIES.length).padStart(2, "0");

  useGSAP(
    () => {
      const section = root.current;
      if (!section) return;

      const mm = gsap.matchMedia();

      mm.add(MOTION_OK, () => {
        const rows = gsap.utils.toArray<HTMLElement>("[data-cap-row]", section);

        for (const row of rows) {
          const rule = row.querySelector<HTMLElement>("[data-cap-rule]");
          const label = row.querySelector<HTMLElement>("[data-cap-label]");
          const note = row.querySelector<HTMLElement>("[data-cap-note]");
          const items = gsap.utils.toArray<HTMLElement>(
            "[data-cap-item-inner]",
            row,
          );

          const timeline = gsap.timeline({
            scrollTrigger: { trigger: row, start: REVEAL.start, once: true },
          });

          if (rule) {
            timeline.from(rule, {
              scaleX: 0,
              duration: DURATION.slow,
              ease: EASE_GSAP,
            });
          }
          if (label) {
            timeline.from(
              label,
              { yPercent: 110, duration: DURATION.slow, ease: EASE_GSAP },
              0.08,
            );
          }
          // The tools carry the row, so they get the stagger and the note trails
          // them rather than competing for the same beat.
          timeline.from(
            items,
            {
              yPercent: 115,
              duration: DURATION.slow,
              ease: EASE_GSAP,
              stagger: 0.045,
            },
            0.14,
          );
          if (note) {
            timeline.from(
              note,
              { opacity: 0, y: 10, duration: DURATION.base, ease: EASE_GSAP },
              0.3,
            );
          }

          // Axis morph across the row's own pass through the viewport. Declared on
          // the list, which is inherited, so every tool inside moves together.
          const list = row.querySelector<HTMLElement>("[data-cap-list]");
          if (list) {
            applyKinetic(list, {
              wght: [340, 560],
              opsz: [24, 96],
              tracking: [0.006, -0.012],
              start: "top 88%",
              end: "bottom 42%",
            });
          }
        }
      });

      // Per-item hover is cursor-only: on touch there is no hover state to
      // return from, and a tap would leave one tool permanently bold.
      mm.add(HOVER_OK, () => {
        const items = gsap.utils.toArray<HTMLElement>(
          "[data-cap-item]",
          section,
        );
        const teardowns = items.map((item) => {
          const inner = item.querySelector<HTMLElement>(
            "[data-cap-item-inner]",
          );
          if (!inner) return () => {};

          const morph = attachKineticHover(
            inner,
            { wght: [520, 800], opsz: [96, 144], soft: [0, 45] },
            DURATION.base,
          );
          const lift = gsap.quickTo(inner, "y", {
            duration: DURATION.base,
            ease: EASE_GSAP,
          });

          const enter = () => {
            morph.play();
            lift(-4);
          };
          const leave = () => {
            morph.reverse();
            lift(0);
          };

          item.addEventListener("pointerenter", enter);
          item.addEventListener("pointerleave", leave);
          return () => {
            item.removeEventListener("pointerenter", enter);
            item.removeEventListener("pointerleave", leave);
            morph.kill();
            gsap.set(inner, { y: 0 });
          };
        });

        return () => teardowns.forEach((fn) => fn());
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="capabilities"
      aria-label="Capabilities"
      className="px-6 pt-24 md:px-10 md:pt-32"
    >
      <header className="border-ink/10 flex items-baseline justify-between gap-4 border-b pb-6">
        <h2 className="text-ink-muted font-mono text-xs tracking-[0.2em] uppercase">
          01 &mdash; Capabilities
        </h2>
        <p
          className="text-ink-muted font-mono text-xs tracking-[0.2em] uppercase"
          aria-label={`${CAPABILITIES.length} groups`}
        >
          ({count})
        </p>
      </header>

      <ul>
        {CAPABILITIES.map((group, i) => (
          <li key={group.label} data-cap-row className="relative">
            {/* Drawn, not bordered — see the note above. The first row sits under
                the header's own rule, so it doesn't get a second one. */}
            {i > 0 ? (
              <span
                aria-hidden="true"
                data-cap-rule
                className="bg-ink/10 absolute inset-x-0 top-0 h-px origin-left"
              />
            ) : null}

            <div className="grid gap-6 py-10 md:grid-cols-12 md:gap-14 md:py-14">
              <div className="md:col-span-4">
                {/* The mask has to be its own element: the label slides inside a
                    clipped box, and putting overflow on the grid cell would clip
                    the note's fade as well. */}
                <span className="block overflow-hidden pb-[0.12em]">
                  <span
                    data-cap-label
                    className="text-ink block font-mono text-xs tracking-[0.2em] uppercase"
                  >
                    {group.label}
                  </span>
                </span>
                <p
                  data-cap-note
                  className="text-ink-muted mt-4 max-w-xs text-sm leading-relaxed text-pretty md:text-base"
                >
                  {group.note}
                </p>
              </div>

              <div className="md:col-span-8">
                <ul
                  data-cap-list
                  className="kinetic font-display flex flex-wrap items-baseline gap-x-6 gap-y-2 text-[clamp(1.5rem,3.6vw,2.75rem)] leading-[1.12] md:gap-x-9"
                >
                  {group.items.map((item) => (
                    <li
                      key={item}
                      data-cap-item
                      className="overflow-hidden pb-[0.12em]"
                    >
                      <span
                        data-cap-item-inner
                        className="hover:text-signal block transition-colors duration-300 will-change-transform"
                      >
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
