"use client";

import { useRef } from "react";
import LocalTime from "@/components/shared/LocalTime";
import MagneticButton from "@/components/shared/MagneticButton";
import SmoothLink from "@/components/shared/SmoothLink";
import SplitReveal from "@/components/shared/SplitReveal";
import { gsap, useGSAP } from "@/lib/gsap";
import { CONTACT } from "@/lib/nav";
import { DURATION, EASE_GSAP, MOTION_OK } from "@/lib/tokens";

/**
 * Hero: kinetic type over parallax depth planes (plan §6, M3).
 *
 * The headline is three block spans rather than one wrapped string, so the line
 * breaks are the ones the copy was written for — and SplitText, which measures
 * rendered lines, masks exactly those. (A `<br>` would work too, but it leaves the
 * words unspaced in `textContent`, which is what the aria-label is built from.)
 *
 * Height is svh rather than dvh: a mobile URL bar collapsing mid-scroll would
 * otherwise resize the section out from under its ScrollTriggers.
 */
export default function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = root.current;
      if (!section) return;

      const mm = gsap.matchMedia();

      mm.add(MOTION_OK, () => {
        // One scrub config, spread per tween so each ScrollTrigger gets its own
        // vars object. Scroll position comes from Lenis via the GSAP ticker — one
        // driver for the whole page (plan §11).
        const scrubbed = {
          trigger: section,
          start: "top top",
          end: "bottom top",
          scrub: true,
        };

        // Supporting copy trails the headline in.
        gsap.from("[data-hero-fade]", {
          y: 14,
          opacity: 0,
          duration: DURATION.base,
          ease: EASE_GSAP,
          stagger: 0.07,
          delay: 0.45,
        });

        // Depth: each plane lags the scroll by its own fraction of its own height,
        // so the further back it should read, the larger the multiplier.
        gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((plane) => {
          gsap.to(plane, {
            yPercent: Number(plane.dataset.parallax ?? 0) * 100,
            ease: "none",
            scrollTrigger: { ...scrubbed },
          });
        });

        // Foreground drifts up and dims as the section leaves.
        gsap.to("[data-hero-drift]", {
          yPercent: -12,
          opacity: 0.2,
          ease: "none",
          scrollTrigger: { ...scrubbed },
        });
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="index"
      className="relative flex min-h-svh flex-col overflow-hidden px-6 pt-32 pb-10 md:px-10"
    >
      {/* Depth planes — decorative, so hidden from the a11y tree entirely. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          data-parallax="0.36"
          className="bg-signal/10 absolute -top-[10vw] -right-[8vw] size-[46vw] rounded-full blur-3xl will-change-transform"
        />
        <div
          data-parallax="0.18"
          className="font-display text-ink/5 absolute -right-[2vw] bottom-[4vw] text-[30vw] leading-none tracking-tight will-change-transform select-none"
        >
          26
        </div>
        {/* Two planes plus the foreground drift below give three depth speeds.
            A full-width rule was the obvious third, but at any viewport it
            eventually lands mid-sentence and reads as a strike-through. */}
      </div>

      {/* Eyebrow row */}
      <div className="text-ink-muted relative flex items-baseline justify-between gap-4 font-mono text-xs tracking-[0.2em] uppercase">
        <p data-hero-fade>{CONTACT.role}</p>
        <p data-hero-fade className="flex items-center gap-2 whitespace-nowrap">
          {CONTACT.location} <LocalTime className="tabular-nums" />
          <span className="text-ink/25" aria-hidden="true">
            /
          </span>
          Remote
        </p>
      </div>

      {/* Statement. Content packs from the top and the bottom row takes the slack
          (mt-auto), rather than justify-between spreading the leftover height —
          which on a phone, where the type can only get so big, left the eyebrow
          stranded above a void. */}
      <div
        data-hero-drift
        className="relative mt-12 max-w-[var(--content-max)] md:mt-10"
      >
        <SplitReveal
          as="h1"
          immediate
          stagger={0.09}
          className="font-display text-[clamp(2.5rem,11.5vw,10rem)] leading-[0.94] tracking-[-0.02em]"
        >
          <span className="block">I build web </span>
          <span className="block">products people </span>
          <span className="block">
            actually <em className="text-signal not-italic">use.</em>
          </span>
        </SplitReveal>

        <p
          data-hero-fade
          className="text-ink-muted mt-8 max-w-xl text-lg leading-relaxed text-pretty md:text-xl"
        >
          I&rsquo;m {CONTACT.shortName} — a {CONTACT.role.toLowerCase()} who
          designs the data model, builds the API, and sweats the interface.
          Below are products I took from idea to shipped.
        </p>
      </div>

      {/* Bottom row */}
      <div className="relative mt-auto flex items-end justify-between gap-6 pt-16">
        {/* MagneticButton owns its own transform, so the fade goes on a wrapper
            rather than fighting it for the same element. */}
        <div data-hero-fade>
          <MagneticButton strength={10}>
            <SmoothLink
              href="/#work"
              className="group bg-ink text-paper hover:bg-signal inline-flex items-center gap-3 rounded-full px-6 py-3.5 text-base transition-colors duration-300 md:px-7 md:py-4 md:text-lg"
            >
              See the work
              <span
                aria-hidden="true"
                className="inline-block transition-transform duration-300 group-hover:translate-y-0.5"
              >
                &#8595;
              </span>
            </SmoothLink>
          </MagneticButton>
        </div>

        <div
          data-hero-fade
          aria-hidden="true"
          className="text-ink-muted hidden flex-col items-center gap-3 font-mono text-[0.625rem] tracking-[0.2em] uppercase sm:flex"
        >
          Scroll
          <span className="bg-ink/20 block h-10 w-px overflow-hidden">
            <span className="scroll-cue bg-ink block h-full w-full" />
          </span>
        </div>
      </div>
    </section>
  );
}
