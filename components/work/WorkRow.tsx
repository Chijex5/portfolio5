"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/shared/Reveal";
import SplitReveal from "@/components/shared/SplitReveal";
import { gsap, useGSAP } from "@/lib/gsap";
import { attachKineticHover } from "@/lib/kinetic";
import {
  CAROUSEL,
  DURATION,
  EASE_GSAP,
  HOVER_OK,
  MOTION_OK,
  ROW,
  VELOCITY,
} from "@/lib/tokens";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getVelocity } from "@/lib/velocity";

/**
 * One project. Copy on one side, visual on the other, sides swapping down the
 * list to keep the editorial rhythm.
 *
 * The plate is layered rather than flat, and each layer moves at its own rate:
 *
 *   `[data-liquid]`  skews with page-scroll velocity — the DOM twin of the bend
 *                    the carousel's shader applies to the same artwork.
 *   `[data-plate]`   the link itself: cursor-tracked tilt plus the hover scale.
 *   `[data-window]`  a clip-path that opens from an inset margin to the frame
 *                    edge — the cover literally expands into view.
 *   `[data-layer]`   the cover and the background numeral, parallaxing against
 *                    each other as the row crosses the viewport.
 *
 * Exactly one of those owns `transform` on any given element. That's deliberate:
 * two tweens writing transform on one node is the bug that makes scroll-linked
 * layouts jitter, and it's invisible until it isn't.
 *
 * The whole row links to the case study: the frame is the primary target, and the
 * title repeats the link so keyboard users get a labelled stop without two tab
 * stops fighting for the same destination (the frame's anchor is aria-hidden and
 * removed from the tab order — the title anchor carries the name).
 *
 * `data-work-card` marks the frame as the Flip source rect for the click-to-expand
 * transition (M9), which measures this element and animates a full-screen image
 * from it.
 */
export default function WorkRow({
  project,
  flip,
}: {
  project: Project;
  flip: boolean;
}) {
  const href = `/work/${project.slug}`;
  const root = useRef<HTMLLIElement>(null);

  useGSAP(
    () => {
      const row = root.current;
      if (!row) return;

      const plate = row.querySelector<HTMLElement>("[data-plate]");
      const liquid = row.querySelector<HTMLElement>("[data-liquid]");
      const frame = row.querySelector<HTMLElement>("[data-window]");
      const chip = row.querySelector<HTMLElement>("[data-chip]");
      const title = row.querySelector<HTMLElement>("h3");
      if (!plate) return;

      const mm = gsap.matchMedia();

      // ---------------------------------------------------------------- //
      // Scroll: parallax layering + velocity skew. Touch gets this too.
      // ---------------------------------------------------------------- //
      mm.add(MOTION_OK, () => {
        gsap.utils
          .toArray<HTMLElement>("[data-layer]", row)
          .forEach((layer) => {
            const rate = Number(layer.dataset.layer ?? 0);
            gsap.fromTo(
              layer,
              { yPercent: -rate },
              {
                yPercent: rate,
                ease: "none",
                scrollTrigger: {
                  trigger: plate,
                  // The layer's whole pass through the viewport, so the offset is
                  // zero exactly when the plate is centred.
                  start: "top bottom",
                  end: "bottom top",
                  scrub: true,
                },
              },
            );
          });

        if (!liquid) return;

        // Skew from the shared store rather than a local sampler, so the row and
        // the carousel bend by the same amount at the same moment.
        const skewTo = gsap.quickTo(liquid, "skewY", {
          duration: DURATION.base,
          ease: EASE_GSAP,
        });
        // Braces, not a concise body: gsap.ticker callbacks must return void, and
        // quickTo hands back the tween it reused.
        const follow = () => {
          skewTo(getVelocity().scroll * -ROW.skew);
        };
        gsap.ticker.add(follow);
        return () => {
          gsap.ticker.remove(follow);
          gsap.set(liquid, { skewY: 0 });
        };
      });

      // ---------------------------------------------------------------- //
      // Hover: expand, scale, snap. Fine pointers only.
      // ---------------------------------------------------------------- //
      mm.add(HOVER_OK, () => {
        const xTo = gsap.quickTo(plate, "rotationY", {
          duration: 0.5,
          ease: EASE_GSAP,
        });
        const yTo = gsap.quickTo(plate, "rotationX", {
          duration: 0.5,
          ease: EASE_GSAP,
        });
        gsap.set(plate, { transformPerspective: 1100 });

        // The open state. Paused and reversible, so a fast in-and-out unwinds
        // from wherever it got to instead of jumping.
        const open = gsap.timeline({
          paused: true,
          defaults: { ease: EASE_GSAP },
        });

        open.to(plate, { scale: CAROUSEL.hoverScale, duration: 0.7 }, 0);
        if (frame) {
          // The literal expand: the cover's window opens from an inset margin out
          // to the frame's own edge.
          open.to(frame, { clipPath: "inset(0%)", duration: 0.7 }, 0);
        }
        if (chip) {
          // Snap, not glide — back.out overshoots and settles, which is what
          // makes the chip read as arriving rather than fading up.
          open.fromTo(
            chip,
            { yPercent: 130, opacity: 0 },
            { yPercent: 0, opacity: 1, duration: 0.55, ease: "back.out(2.2)" },
            0.05,
          );
        }

        const weight = title
          ? attachKineticHover(
              title,
              // Weight *and* optical size, so the title changes cut rather than
              // just getting bolder — high contrast, tight, more display.
              //
              // The tracking range tightens by more em than the weight gain adds,
              // which is the point: SplitText's line masks reflow if a line grows
              // wide enough to wrap, so the morph is built to make the line
              // narrower, never wider.
              {
                wght: [400, 620],
                opsz: [30, 144],
                soft: [0, 100],
                wonk: [0, 1],
                tracking: [-0.01, -0.035],
              },
              0.55,
            )
          : null;

        function enter() {
          open.play();
          weight?.play();
        }

        function leave() {
          open.reverse();
          weight?.reverse();
          xTo(0);
          yTo(0);
        }

        function move(event: PointerEvent) {
          const rect = plate!.getBoundingClientRect();
          const px =
            (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
          const py =
            (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);

          // Tilt toward the cursor, then lean a little further in the direction
          // it's travelling — the same velocity the magnetic buttons read.
          const drift = getVelocity().pointerX / VELOCITY.norm.pointer;
          xTo(px * ROW.tilt + drift * ROW.tilt * 0.5);
          yTo(-py * ROW.tilt);

          // Where the sheen sits. CSS owns the gradient; JS only says where.
          plate!.style.setProperty(
            "--mx",
            `${((event.clientX - rect.left) / rect.width) * 100}%`,
          );
          plate!.style.setProperty(
            "--my",
            `${((event.clientY - rect.top) / rect.height) * 100}%`,
          );
        }

        plate.addEventListener("pointerenter", enter);
        plate.addEventListener("pointerleave", leave);
        plate.addEventListener("pointermove", move);

        return () => {
          plate.removeEventListener("pointerenter", enter);
          plate.removeEventListener("pointerleave", leave);
          plate.removeEventListener("pointermove", move);
          open.kill();
          weight?.kill();
          gsap.set(plate, { clearProps: "transform" });
        };
      });
    },
    { scope: root },
  );

  return (
    <li
      ref={root}
      className="border-ink/10 border-b py-14 last:border-b-0 md:py-20"
    >
      <article className="group grid items-center gap-8 md:grid-cols-12 md:gap-14">
        <Reveal
          className={cn("md:col-span-7", flip ? "md:order-2" : "md:order-1")}
        >
          <div data-liquid className="will-change-transform">
            <Link
              href={href}
              tabIndex={-1}
              aria-hidden="true"
              data-work-card={project.slug}
              data-plate
              className="border-ink/10 bg-ink/[0.04] relative block aspect-[16/11] overflow-hidden border will-change-transform"
            >
              {project.cover ? (
                <span
                  data-window
                  // The resting inset is inline rather than a `from` value on the
                  // tween, so it is also what no-JS and reduced-motion visitors
                  // get: a framed picture with a margin, which is a finished
                  // state rather than a half-played animation.
                  className="absolute inset-0 block"
                  style={{ clipPath: `inset(${ROW.inset}%)` }}
                >
                  <span
                    data-layer={ROW.parallax}
                    className="absolute inset-[-11%] block will-change-transform"
                  >
                    <Image
                      src={project.cover.src}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 58vw, 100vw"
                      className="object-cover"
                    />
                  </span>
                </span>
              ) : null}

              {/* The numeral sits behind the cover's inset margin at rest and is
                  swallowed as the window opens. */}
              <span
                aria-hidden="true"
                data-layer={ROW.numeral}
                className="font-display text-ink/15 absolute -right-3 -bottom-12 text-[10rem] leading-none tracking-tight will-change-transform select-none md:text-[13rem]"
              >
                {project.index}
              </span>

              <span className="text-ink-muted absolute top-5 left-5 z-10 font-mono text-[0.6875rem] tracking-[0.2em] uppercase">
                {project.category}
              </span>

              <span className="absolute right-5 bottom-5 z-10 overflow-hidden">
                <span
                  data-chip
                  className="bg-ink text-paper block rounded-full px-4 py-2 font-mono text-[0.5625rem] tracking-[0.16em] whitespace-nowrap uppercase opacity-0"
                >
                  View case study
                </span>
              </span>

              {/* Sheen: a soft highlight that tracks the cursor. Pure CSS, fed
                  two custom properties by the pointermove handler. */}
              <span
                aria-hidden="true"
                className="plate-sheen pointer-events-none absolute inset-0 z-10"
              />
            </Link>
          </div>
        </Reveal>

        <div
          className={cn(
            "md:col-span-5",
            flip ? "md:order-1 md:pr-4" : "md:order-2 md:pl-4",
          )}
        >
          <p className="text-ink-muted flex items-center gap-3 font-mono text-[0.6875rem] tracking-[0.2em] uppercase">
            {project.index}
            <span aria-hidden="true" className="bg-ink/20 h-px w-8" />
            {project.year}
          </p>

          <SplitReveal
            as="h3"
            stagger={0.06}
            className="kinetic font-display mt-5 text-[clamp(1.875rem,4.5vw,3.25rem)] leading-[1.02] tracking-[-0.01em]"
          >
            <Link
              href={href}
              className="decoration-signal hover:text-signal underline-offset-[0.18em] transition-colors duration-300 hover:underline"
            >
              {project.title}
              {/* Not aria-hidden: this is the part that tells a screen-reader
                  user the title is a link to something, since "D'Footprint"
                  alone doesn't say where it goes. */}
              <span className="sr-only"> — read the case study</span>
            </Link>
          </SplitReveal>

          <Reveal delay={0.1}>
            <p className="text-ink-muted mt-5 text-base leading-relaxed text-pretty md:text-lg">
              {project.blurb}
            </p>

            <ul className="mt-7 flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <li
                  key={tag}
                  className="border-ink/15 text-ink-muted rounded-full border px-3 py-1 font-mono text-[0.625rem] tracking-[0.12em] uppercase"
                >
                  {tag}
                </li>
              ))}
            </ul>

            {/* Outbound links, alongside the case study rather than inside it.
                Someone scanning the list for "can I see the code" should not have
                to open a case study to find out.

                `stopPropagation` is not needed and deliberately absent — these are
                siblings of the title link, not nested inside it, so a click here
                was never going to reach it. */}
            {project.live || project.repo ? (
              <ul className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                {project.live ? (
                  <li>
                    <a
                      href={project.live}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="group text-ink-muted hover:text-ink inline-flex items-center gap-2 font-mono text-[0.625rem] tracking-[0.2em] uppercase transition-colors duration-300"
                    >
                      Live
                      <span className="sr-only"> site for {project.title}</span>
                      <span
                        aria-hidden="true"
                        className="inline-block transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5"
                      >
                        &#8599;
                      </span>
                    </a>
                  </li>
                ) : null}
                {project.repo ? (
                  <li>
                    <a
                      href={project.repo}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="group text-ink-muted hover:text-ink inline-flex items-center gap-2 font-mono text-[0.625rem] tracking-[0.2em] uppercase transition-colors duration-300"
                    >
                      Source
                      <span className="sr-only"> code for {project.title}</span>
                      <span
                        aria-hidden="true"
                        className="inline-block transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5"
                      >
                        &#8599;
                      </span>
                    </a>
                  </li>
                ) : null}
              </ul>
            ) : null}
          </Reveal>
        </div>
      </article>
    </li>
  );
}
