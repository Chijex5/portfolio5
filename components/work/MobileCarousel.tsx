"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap, useGSAP } from "@/lib/gsap";
import { DURATION, EASE_GSAP, MOTION_OK, REVEAL } from "@/lib/tokens";
import type { Project } from "@/lib/types";

/**
 * The touch carousel (plan §7 rule 2, M10).
 *
 * A *different* carousel, not the WebGL one with the shader switched off. The
 * distinction the plan insists on is real, because almost nothing about the
 * desktop band survives the move to a phone:
 *
 *   - Its physics are wrong. LiquidCarousel integrates its own offset from
 *     pointer deltas so it can feed one velocity to the shader. On touch that
 *     means reimplementing momentum, rubber-banding and fling in JS, and losing
 *     to the platform on all three. Here the browser scrolls, and CSS
 *     `scroll-snap` decides where it lands.
 *   - Its captions are wrong. Over there the title lives under `group-hover`.
 *     A finger has no hover state, so a hover-only caption is an unlabelled
 *     picture. Here every card is captioned all the time.
 *   - Its texture budget is wrong. Six uncompressed plates in VRAM is a
 *     desktop-GPU decision; `next/image` at `72vw` serves a phone a few tens of
 *     KB per card instead.
 *
 * What it keeps is the editorial language: same covers, same mono labels, same
 * expo curve, a rail that reports position instead of dots. And it stays useful
 * with reduced motion — native scrolling is not an animation, so the whole thing
 * still works when every tween below is skipped.
 */
export default function MobileCarousel({
  projects,
}: {
  projects: readonly Project[];
}) {
  const root = useRef<HTMLDivElement>(null);
  const slides = projects.filter((project) => project.cover);

  useGSAP(
    () => {
      const section = root.current;
      if (!section) return;

      const scroller = section.querySelector<HTMLElement>("[data-snap]");
      const rail = section.querySelector<HTMLElement>("[data-rail-fill]");
      if (!scroller) return;

      // The rail is not gated on motion preference: it reports where you are in
      // the strip, which is information, not decoration. Written straight to the
      // element on scroll — no state, no re-render per pixel.
      if (rail) {
        const update = () => {
          const travel = scroller.scrollWidth - scroller.clientWidth;
          // A strip that fits its container has no position to report; showing a
          // permanently full rail would imply the end of a list of one.
          const progress = travel > 1 ? scroller.scrollLeft / travel : 0;
          rail.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
        };
        update();
        scroller.addEventListener("scroll", update, { passive: true });
        // ResizeObserver as well as scroll: rotating the phone changes `travel`
        // without ever firing a scroll event, which would leave the rail lying.
        const observer = new ResizeObserver(update);
        observer.observe(scroller);
        return () => {
          scroller.removeEventListener("scroll", update);
          observer.disconnect();
        };
      }
    },
    { scope: root },
  );

  useGSAP(
    () => {
      const section = root.current;
      if (!section) return;

      const mm = gsap.matchMedia();

      mm.add(MOTION_OK, () => {
        // Cards rise as the band enters, staggered along the strip. Only the ones
        // on screen are worth animating, but staggering all of them is harmless:
        // the ones scrolled out horizontally simply arrive already finished.
        gsap.from("[data-snap-card]", {
          y: 28,
          opacity: 0,
          duration: DURATION.slow,
          ease: EASE_GSAP,
          stagger: 0.08,
          scrollTrigger: {
            trigger: section,
            start: REVEAL.start,
            once: true,
          },
        });
      });
    },
    { scope: root },
  );

  if (slides.length === 0) return null;

  return (
    <div
      ref={root}
      className="border-ink/10 -mx-6 mt-14 border-y py-8 md:-mx-10 md:mt-20"
    >
      <div className="flex items-baseline justify-between gap-4 px-6 md:px-10">
        <p className="text-ink-muted font-mono text-[0.625rem] tracking-[0.2em] uppercase">
          Swipe the work
        </p>
        <p
          aria-hidden="true"
          className="text-ink-muted font-mono text-[0.625rem] tracking-[0.2em] tabular-nums"
        >
          {String(slides.length).padStart(2, "0")}
        </p>
      </div>

      {/* `data-lenis-prevent` matters: without it Lenis intercepts the wheel and
          the horizontal strip cannot be scrolled with a trackpad at all. Touch is
          unaffected either way, but a narrow *laptop* window lands here too. */}
      <ul
        data-snap
        data-lenis-prevent
        className="mt-5 flex snap-x snap-mandatory [scrollbar-width:none] gap-4 overflow-x-auto scroll-smooth px-6 pb-2 md:px-10 [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((project) => (
          <li
            key={project.slug}
            data-snap-card
            className="w-[72vw] max-w-[380px] shrink-0 snap-center sm:w-[54vw]"
          >
            <Link href={`/work/${project.slug}`} className="group block">
              <div className="border-ink/10 bg-ink/5 relative aspect-[1.34] overflow-hidden border">
                <Image
                  src={project.cover!.src}
                  alt={project.cover!.alt}
                  fill
                  // 72vw is what the card actually occupies, so a phone is served
                  // a phone-sized file rather than the 2400px master.
                  sizes="(min-width: 640px) 54vw, 72vw"
                  className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-active:scale-[1.03]"
                />
              </div>

              {/* Always visible, never on hover — see the note above. */}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-ink-muted font-mono text-[0.625rem] tracking-[0.2em] tabular-nums">
                  {project.index}
                </span>
                <span className="min-w-0">
                  <span className="font-display block truncate text-xl leading-tight tracking-[-0.01em]">
                    {project.title}
                  </span>
                  <span className="text-ink-muted mt-1 block font-mono text-[0.5625rem] tracking-[0.2em] uppercase">
                    {project.category}
                  </span>
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {/* Position rail. `aria-hidden` because it duplicates the scroll position
          the scroller already exposes to assistive tech. */}
      <div aria-hidden="true" className="mt-5 px-6 md:px-10">
        <span className="bg-ink/10 block h-px w-full overflow-hidden">
          <span
            data-rail-fill
            className="bg-signal block h-full w-full origin-left scale-x-0"
          />
        </span>
      </div>
    </div>
  );
}
