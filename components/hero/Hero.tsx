"use client";

import { useRef } from "react";
import Image from "next/image";
import LocalTime from "@/components/shared/LocalTime";
import MagneticButton from "@/components/shared/MagneticButton";
import SmoothLink from "@/components/shared/SmoothLink";
import SplitReveal from "@/components/shared/SplitReveal";
import { gsap, useGSAP } from "@/lib/gsap";
import { CONTACT, STACK } from "@/lib/nav";
import { projects } from "@/lib/projects";
import { DURATION, EASE_GSAP, MOTION_OK } from "@/lib/tokens";

/**
 * The three covers that make up the hero ribbon, with the depth each sits at.
 *
 * Depth is the `data-parallax` multiplier: the nearest plate barely moves, the
 * furthest lags most, so the row separates into layers as the hero leaves. The
 * `drop` values stagger them into a diagonal rather than a row of equals.
 */
const RIBBON = projects
  .filter((project) => project.cover)
  .slice(0, 3)
  .map((project, i) => ({
    project,
    depth: [0.1, 0.24, 0.15][i],
    drop: [0, 34, 14][i],
  }));

/** Three honest numbers. Derived, so they can never drift from the content. */
const STATS = [
  { value: String(projects.length).padStart(2, "0"), label: "Shipped" },
  { value: String(STACK.length).padStart(2, "0"), label: "In rotation" },
  { value: CONTACT.available ? "Open" : "Booked", label: "For work" },
] as const;

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
 *
 * One rule holds this section together: **one writer per element's transform.**
 * The cover plates and the depth planes are driven by GSAP (`data-parallax`); the
 * band around the whole section is driven by ElasticProvider (`data-elastic`, set
 * in app/page.tsx). Nothing carries both — that is the desync bug the plan calls
 * out, and here it would show up as plates that stutter only during fast scroll.
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

        // The ribbon builds itself after the copy has landed: each plate rises,
        // un-skews and settles. Same expo curve as everything else, so it reads
        // as one entrance rather than a second animation starting.
        gsap.from("[data-ribbon]", {
          yPercent: 26,
          opacity: 0,
          skewY: 4,
          scale: 0.94,
          duration: DURATION.slow,
          ease: EASE_GSAP,
          stagger: 0.09,
          delay: 0.72,
        });

        // Depth: each plane lags the scroll by its own fraction of its own height,
        // so the further back it should read, the larger the multiplier. The cover
        // plates opt into the same pass, which is what layers them against the
        // blobs behind and the headline in front.
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
        {/* Hairline rules, furthest back: they give the parallax something to be
            measured against. Without a straight edge in the scene the depth
            planes have nothing to slide past and the movement reads as drift. */}
        <div
          data-parallax="0.5"
          className="absolute inset-x-0 top-[38vh] will-change-transform"
        >
          <div className="bg-ink/[0.055] h-px w-full" />
          <div className="bg-ink/[0.035] mt-[18vh] h-px w-full" />
        </div>
        <div
          data-parallax="0.36"
          className="bg-signal/10 absolute -top-[10vw] -right-[8vw] size-[46vw] rounded-full blur-3xl will-change-transform"
        />
        {/* Counterweight, bottom-left and cooler, so the warm blob top-right
            isn't the only mass in the frame. */}
        <div
          data-parallax="0.28"
          className="bg-ink/[0.045] absolute -bottom-[14vw] -left-[10vw] size-[38vw] rounded-full blur-3xl will-change-transform"
        />
        <div
          data-parallax="0.18"
          className="font-display text-ink/5 absolute -right-[2vw] bottom-[4vw] text-[30vw] leading-none tracking-tight will-change-transform select-none"
        >
          26
        </div>
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
          // The kinetic pass: the headline thickens and softens as the hero
          // leaves, in step with the drift and fade already on this wrapper — so
          // it reads as the type condensing on its way out rather than a separate
          // effect happening nearby.
          //
          // start/end are the section's own exit rather than the default "pass
          // through the viewport", because at scroll 0 the h1 is already past the
          // default start and would load halfway through its own morph.
          //
          // Tracking tightens by more em than the weight gain adds width, which
          // keeps the line monotonically narrower: SplitText masks are sized to
          // the lines they were built from, so a line that *grew* enough to rewrap
          // would shift the layout.
          //
          // The resting end is deliberately not the extreme: Fraunces at opsz 144
          // and a light weight draws the bar of an 'e' so fine that at this size it
          // reads as a 'c'. The thin, high-contrast cut is the *destination*, where
          // the headline is also drifting away and dropping to 20% opacity — never
          // the state a first-time visitor has to read.
          kinetic={{
            wght: [430, 820],
            opsz: [72, 144],
            soft: [0, 70],
            tracking: [-0.02, -0.055],
            start: "top top",
            end: "bottom top",
          }}
          // The tracking class stays: the kinetic tween writes letter-spacing
          // inline (which wins), so this is what reduced-motion and no-JS get, and
          // it matches the tween's starting value exactly.
          className="font-display text-[clamp(2.5rem,11.5vw,10rem)] leading-[0.94] tracking-[-0.02em]"
        >
          <span className="block">I build web </span>
          <span className="block">products people </span>
          <span className="block">
            actually <em className="text-signal not-italic">use.</em>
          </span>
        </SplitReveal>

        {/* Copy left, ribbon right. On anything narrower than lg the ribbon would
            be competing with the headline for the same 300px, so it goes away
            rather than shrinking into thumbnails. */}
        <div className="mt-8 flex items-end justify-between gap-12">
          <p
            data-hero-fade
            className="text-ink-muted max-w-xl text-lg leading-relaxed text-pretty md:text-xl"
          >
            I&rsquo;m {CONTACT.shortName} — a {CONTACT.role.toLowerCase()} who
            designs the data model, builds the API, and sweats the interface.
            Below are products I took from idea to shipped.
          </p>

          {/* The work, glimpsed. Decorative twin of the list below — same covers,
              and the list is the accessible path — so it stays out of the a11y
              tree entirely and the images carry no alt text. */}
          <div
            aria-hidden="true"
            className="hidden shrink-0 items-end gap-4 lg:flex"
          >
            {RIBBON.map(({ project, depth, drop }) => (
              <figure
                key={project.slug}
                data-ribbon
                data-parallax={depth}
                style={{ marginBottom: `${drop}px` }}
                className="group border-ink/10 relative w-[172px] overflow-hidden border will-change-transform xl:w-[196px]"
              >
                <Image
                  src={project.cover!.src}
                  alt=""
                  width={project.cover!.width}
                  height={project.cover!.height}
                  sizes="196px"
                  className="aspect-[4/3] w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
                />
                <figcaption className="text-paper absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-10 font-mono text-[0.5625rem] tracking-[0.16em] uppercase opacity-0 transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-100">
                  {project.index} &mdash; {project.title}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="relative mt-auto flex flex-wrap items-end justify-between gap-x-6 gap-y-8 pt-16">
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

        <div className="flex items-end gap-8 sm:gap-12">
          {/* A real <dl>: these are term/value pairs, and a screen reader should
              get "Shipped, 06" rather than two loose strings. */}
          <dl data-hero-fade className="flex items-end gap-8 sm:gap-12">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <dd className="font-display text-3xl leading-none tracking-[-0.01em] md:text-4xl">
                  {stat.value}
                </dd>
                <dt className="text-ink-muted mt-2 font-mono text-[0.5625rem] tracking-[0.2em] uppercase">
                  {stat.label}
                </dt>
              </div>
            ))}
          </dl>

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
      </div>
    </section>
  );
}
