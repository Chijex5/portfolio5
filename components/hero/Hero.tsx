"use client";

import { useRef } from "react";
import Image from "next/image";
import LocalTime from "@/components/shared/LocalTime";
import MagneticButton from "@/components/shared/MagneticButton";
import SmoothLink from "@/components/shared/SmoothLink";
import SplitReveal from "@/components/shared/SplitReveal";
import { gsap, useGSAP } from "@/lib/gsap";
import { CAPABILITY_COUNT, CONTACT } from "@/lib/nav";
import { projects } from "@/lib/projects";
import { DURATION, EASE_GSAP, INTRO, MOTION_OK } from "@/lib/tokens";

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
  { value: String(CAPABILITY_COUNT).padStart(2, "0"), label: "In rotation" },
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

        // ── The intro ──────────────────────────────────────────────────────────
        //
        // One timeline for the whole opening: curtain and content on the same
        // clock. This replaced three independent `gsap.from`s, which is why the
        // load used to read as "nothing happens" — each started its own clock at
        // hydration, so on a warm cache they all fired within a few frames of one
        // another and the hero simply appeared.
        //
        // It is deliberately time-based rather than scroll-linked. This is the
        // first thing on screen the moment the page is ready, before the visitor
        // has scrolled a pixel, so there is nothing for a ScrollTrigger to read.
        // Every position below is a second on this timeline (see INTRO in
        // lib/tokens.ts, which holds the whole choreography in one readable list).
        //
        // `.to`, not `.from`, for content: the hidden state already exists in CSS
        // before paint (globals.css), so the timeline's job is to *undo* it. A
        // `.from` would first re-apply a state the element is already in, which is
        // the snap-back that made the previous version look broken.
        //
        // SplitReveal renders the statement and forwards no extra attributes, so
        // it is matched by type — there is exactly one h1 here, and it is the node
        // carrying `.kinetic`.
        const headline = section.querySelector<HTMLElement>("h1");
        const curtain = section.querySelector<HTMLElement>("[data-curtain]");

        // Once per tab. A curtain on every client-side return to the home route
        // would turn a 200ms navigation into a two-second wait, so a repeat visit
        // skips straight to the content and only the first load gets the full
        // opening. The matching flag is read before paint in app/layout.tsx.
        let seen = false;
        try {
          seen = sessionStorage.getItem("intro-played") === "1";
        } catch {
          // Private mode / storage disabled: fall through and play it. A curtain
          // shown twice is a much smaller problem than a thrown intro.
        }

        const intro = gsap.timeline({
          defaults: { ease: EASE_GSAP },
          onComplete: () => {
            // The section keeps its own styles from here on, so a later re-render
            // can never re-hide a hero that already played.
            section.classList.add("intro-done");
            try {
              sessionStorage.setItem("intro-played", "1");
            } catch {
              /* nothing to do — see above */
            }
          },
        });

        // Transforms are set here rather than in CSS: GSAP owns every transform in
        // this section, and a CSS transform on the same element would be a second
        // writer for it.
        gsap.set("[data-intro='eyebrow'], [data-intro='copy']", { y: 16 });
        gsap.set("[data-intro='cta'], [data-intro='stat']", { y: 20 });
        gsap.set("[data-intro='ribbon']", {
          yPercent: 26,
          skewY: 4,
          scale: 0.94,
        });

        if (curtain && !seen) {
          gsap.set("[data-curtain-mark]", { y: 14, opacity: 0 });
          intro
            .to(
              "[data-curtain-rule]",
              { scaleX: 1, duration: 0.75, ease: "expo.out" },
              INTRO.curtain.rule,
            )
            .to(
              "[data-curtain-mark]",
              { y: 0, opacity: 1, duration: DURATION.slow },
              INTRO.curtain.mark,
            )
            // expo.inOut, not expo.out: a panel this size covering the whole
            // viewport needs to gather speed before it leaves, or the first third
            // of the move looks like a stall.
            .to(
              curtain,
              {
                yPercent: -100,
                duration: INTRO.curtain.liftDuration,
                ease: "expo.inOut",
              },
              INTRO.curtain.lift,
            )
            // Out of the layer tree once it is off-screen: a full-viewport fixed
            // element left behind is a compositing layer the rest of the page pays
            // for on every frame.
            .set(curtain, { display: "none" });
        } else if (curtain) {
          gsap.set(curtain, { display: "none" });
        }

        // Content starts as the curtain clears on a first visit, and immediately on
        // a repeat one. The two overlap rather than queueing — the hero is already
        // assembling itself behind the panel as it lifts, so the reveal shows
        // motion in progress instead of a finished screen sliding into view.
        const at = seen ? 0 : INTRO.contentAt;
        const { beat } = INTRO;

        intro
          // The rules draw themselves across the frame, so the sequence starts
          // with the page being *built* rather than with copy arriving from
          // nowhere.
          .from(
            "[data-intro-rule] > div",
            {
              scaleX: 0,
              transformOrigin: "left center",
              duration: 1.2,
              stagger: 0.12,
            },
            at + beat.rules,
          )
          // Eyebrow: the smallest thing, so the eye starts at the top of the page.
          .to(
            "[data-intro='eyebrow']",
            { opacity: 1, y: 0, duration: DURATION.slow },
            at + beat.eyebrow,
          )
          .to(
            "[data-intro='copy']",
            { opacity: 1, y: 0, duration: DURATION.slow },
            at + beat.copy,
          )
          // The covers rise, un-skew and settle, staggered.
          .to(
            "[data-intro='ribbon']",
            {
              opacity: 1,
              yPercent: 0,
              skewY: 0,
              scale: 1,
              duration: DURATION.slow,
              stagger: 0.09,
            },
            at + beat.ribbon,
          )
          // The two things that ask for an action come last.
          .to(
            "[data-intro='cta']",
            { opacity: 1, y: 0, duration: DURATION.base },
            at + beat.cta,
          )
          .to(
            "[data-intro='stat']",
            { opacity: 1, y: 0, duration: DURATION.base, stagger: 0.07 },
            at + beat.stats,
          );

        // The signature beat: kinetic type on *arrival*, not only on exit. The
        // statement lands spindly at a small optical size and thickens into its
        // resting cut while its lines are still rising, so the type appears to be
        // setting itself.
        //
        // It ends on exactly the values the scroll morph starts from (wght 430,
        // opsz 72 — see the `kinetic` prop below), so the first scroll picks up
        // precisely where this left off instead of snapping.
        if (headline) {
          intro
            // Uncovered as its own lines begin to rise. Near-zero duration: this
            // only lifts the CSS pre-intro state, it is not the animation — the
            // SplitText line masks are, and they start on the same beat via the
            // `delay` passed to SplitReveal below.
            .to(headline, { opacity: 1, duration: 0.01 }, at + beat.statement)
            .fromTo(
              headline,
              { "--wght": 200, "--opsz": 18, "--soft": 0 },
              { "--wght": 430, "--opsz": 72, duration: 1.5 },
              at + beat.statement,
            );
        }

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
      data-hero-intro
      className="relative flex min-h-svh flex-col overflow-hidden px-6 pt-28 pb-10 md:px-10 md:pt-32"
    >
      {/* Depth planes — decorative, so hidden from the a11y tree entirely. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {/* Hairline rules, furthest back: they give the parallax something to be
            measured against. Without a straight edge in the scene the depth
            planes have nothing to slide past and the movement reads as drift.

            Deliberately low in the frame. At 38vh/56vh they ran straight through
            the middle of the headline, and a full-width rule crossing a line of
            type reads as a strike-through, not as depth — the same trap noted in
            WorkRow. Below the statement they cross the copy/ribbon band instead,
            where there is already horizontal structure for them to belong to. */}
        <div
          data-parallax="0.5"
          data-intro-rule
          className="absolute inset-x-0 top-[70vh] will-change-transform"
        >
          <div className="bg-ink/[0.05] h-px w-full" />
          <div className="bg-ink/[0.03] mt-[13vh] h-px w-full" />
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
        {/* The year, as a watermark. Pulled left of the ribbon rather than sharing
            its corner: at `-right-[2vw]` the numeral sat directly behind the cover
            plates, and two decorative things in one corner read as clutter.

            Desktop only. Bottom-left is also where the stats sit once the layout
            stacks, and at 26vw the numeral's strokes ran straight through
            "06 SHIPPED" — texture behind body copy is fine, texture behind a
            number someone is trying to read is not. */}
        <div
          data-parallax="0.18"
          className="font-display text-ink/5 absolute bottom-[3vw] -left-[1vw] hidden text-[20vw] leading-none tracking-tight will-change-transform select-none lg:block"
        >
          26
        </div>
      </div>

      {/* ── The curtain ───────────────────────────────────────────────────────
          A full-bleed panel that covers the whole document — `fixed`, above the
          header's z-40 — for the first second of a visit.

          It exists to solve a problem the hero cannot solve on its own: the
          moment the page becomes ready is also the moment React hydrates and the
          webfont swaps in, and neither is something a visitor should watch. With
          the panel in front, that whole settling period happens off-stage, and
          what the visitor actually sees is a deliberate opening.

          It lifts rather than fades, with a vermilion hairline on its bottom
          edge, so a bright line sweeps up the screen and leaves the hero behind
          it. That single moving line is the reveal.

          Removed from the a11y tree entirely and non-interactive: it is a
          transition, not content, and it must never eat the first click. */}
      <div
        aria-hidden="true"
        data-curtain
        className="bg-paper pointer-events-none fixed inset-0 z-[60] flex flex-col items-center justify-center"
      >
        <p
          data-curtain-mark
          className="font-display text-2xl tracking-tight md:text-3xl"
        >
          {CONTACT.shortName}
          <span className="text-signal">.</span>
        </p>
        <span
          data-curtain-rule
          className="bg-ink/20 mt-4 block h-px w-[min(38vw,320px)] origin-left scale-x-0"
        />
        {/* The leading edge. Sits on the panel's bottom border, so it only becomes
            visible as the panel travels up past the content. */}
        <span className="bg-signal absolute inset-x-0 bottom-0 h-px" />
      </div>

      {/* Eyebrow row */}
      <div className="text-ink-muted relative flex items-baseline justify-between gap-4 font-mono text-[0.625rem] tracking-[0.14em] uppercase sm:text-xs sm:tracking-[0.2em]">
        <p data-intro="eyebrow">{CONTACT.role}</p>
        <p
          data-intro="eyebrow"
          className="flex items-center gap-2 whitespace-nowrap"
        >
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
          // Same position as the intro timeline's statement beat, so the lines
          // rise while the axes thicken instead of reading as two separate events.
          // SplitReveal owns this tween (it has to survive autoSplit's re-splits),
          // so the sync is by matching delay rather than by being on the timeline.
          delay={INTRO.contentAt + INTRO.beat.statement}
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
          //
          // 8.6vw, not 11.5vw. At 11.5vw the three lines came to ~467px on a
          // 1440x900 display, which pushed the CTA and the stats off the bottom of
          // a section that is only `min-h-svh` tall — the first screen ended
          // mid-sentence with no call to action visible at all. 8.6vw brings the
          // statement to ~349px and the whole hero to ~790px, so everything the
          // section is composed of is actually on the first screen.
          className="font-display text-[clamp(2.25rem,8.6vw,7.5rem)] leading-[0.96] tracking-[-0.02em]"
        >
          <span className="block">I build web </span>
          <span className="block">products people </span>
          <span className="block">
            actually <em className="text-signal not-italic">use.</em>
          </span>
        </SplitReveal>

        {/* Copy left, ribbon right — but stacked below `lg`, not dropped. The
            ribbon used to be `hidden lg:flex`, which left a phone with ~180px of
            blank paper between the paragraph and the CTA: the emptiest part of the
            emptiest screen. Stacked, the three covers fill exactly that gap and
            the first screen shows actual work instead of a void. */}
        <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <p
            data-intro="copy"
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
            className="flex items-end gap-3 lg:shrink-0 lg:gap-4"
          >
            {RIBBON.map(({ project, depth, drop }) => (
              <figure
                key={project.slug}
                data-intro="ribbon"
                data-parallax={depth}
                // The diagonal stagger is a desktop composition: on three plates
                // sharing a phone's width a 34px drop is a third of their height
                // and reads as misalignment, so it only applies from `lg`.
                style={{ "--drop": `${drop}px` } as React.CSSProperties}
                className="group border-ink/10 relative flex-1 overflow-hidden border will-change-transform lg:mb-[var(--drop)] lg:w-[186px] lg:flex-none xl:w-[210px]"
              >
                <Image
                  src={project.cover!.src}
                  alt=""
                  width={project.cover!.width}
                  height={project.cover!.height}
                  sizes="(min-width: 1280px) 210px, (min-width: 1024px) 186px, 33vw"
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
      <div className="relative mt-auto flex flex-wrap items-end justify-between gap-x-6 gap-y-8 pt-10 md:pt-14">
        {/* MagneticButton owns its own transform, so the fade goes on a wrapper
            rather than fighting it for the same element. */}
        <div data-intro="cta">
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
          <dl className="flex items-end gap-8 sm:gap-12">
            {STATS.map((stat) => (
              <div key={stat.label} data-intro="stat">
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
            data-intro="stat"
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
