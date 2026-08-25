"use client";

import { useRef } from "react";
import Image from "next/image";
import LocalTime from "@/components/shared/LocalTime";
import MagneticButton from "@/components/shared/MagneticButton";
import SmoothLink from "@/components/shared/SmoothLink";
import SplitReveal from "@/components/shared/SplitReveal";
import { gsap, useGSAP } from "@/lib/gsap";
import { onRevealStart, revealStarted } from "@/lib/intro";
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
 * The headline is two block spans rather than one wrapped string, so the line
 * break is the one the copy was written for — and SplitText, which measures
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
        // One timeline for the whole opening, and it deliberately does not start
        // on mount. Mount means "React hydrated", which is not the same moment as
        // "this page is worth looking at" — the webfont has not swapped and the
        // covers have not decoded — so the preloader measures the real wait and
        // this plays on its signal instead (lib/intro.ts).
        //
        // Every position below is therefore an offset from *the reveal*, not from
        // mount, and it is the same list on a first visit as on a repeat one.
        // That is what keeps it in step with the statement's own tween, which
        // SplitReveal has to own (see the `gate` and `delay` props below): the
        // two are synchronised by sharing one clock rather than by two files
        // agreeing about a constant.
        //
        // Time-based rather than scroll-linked, because this is the first thing
        // on screen the moment the page opens, before the visitor has scrolled a
        // pixel — there is nothing for a ScrollTrigger to read yet. See INTRO in
        // lib/tokens.ts, which holds the whole choreography in one readable list.
        //
        // `.to`, not `.from`, for content: the hidden state already exists in CSS
        // before paint (globals.css), so the timeline's job is to *undo* it. A
        // `.from` would first re-apply a state the element is already in, which is
        // the snap-back that made the previous version look broken.

        // The one-shot guard. `.intro-done` is a raw class on the section, so it
        // is invisible to GSAP's context and outlives the revert that a dev
        // StrictMode remount (or a change of motion preference) performs — at
        // which point this setup would otherwise run a second time and animate a
        // hero that has already played back in from hidden.
        const played =
          revealStarted() && section.classList.contains("intro-done");

        /** Unsubscribes the reveal listener if the context is torn down first. */
        let offReveal: (() => void) | undefined;

        if (!played) {
          // SplitReveal renders the statement and forwards no extra attributes,
          // so it is matched by type — there is exactly one h1 here, and it is
          // the node carrying `.kinetic`.
          const headline = section.querySelector<HTMLElement>("h1");

          const intro = gsap.timeline({
            paused: true,
            defaults: { ease: EASE_GSAP },
            onComplete: () => {
              // The section keeps its own styles from here on, so a later
              // re-render can never re-hide a hero that already played.
              section.classList.add("intro-done");
            },
          });

          // Transforms are set here rather than in CSS: GSAP owns every transform
          // in this section, and a CSS transform on the same element would be a
          // second writer for it.
          gsap.set("[data-intro='eyebrow'], [data-intro='copy']", { y: 16 });
          gsap.set("[data-intro='cta'], [data-intro='stat']", { y: 20 });
          gsap.set("[data-intro='ribbon']", {
            yPercent: 26,
            skewY: 4,
            scale: 0.94,
          });

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
              beat.rules,
            )
            // Eyebrow: the smallest thing, so the eye starts at the top of the
            // page.
            .to(
              "[data-intro='eyebrow']",
              { opacity: 1, y: 0, duration: DURATION.slow },
              beat.eyebrow,
            )
            .to(
              "[data-intro='copy']",
              { opacity: 1, y: 0, duration: DURATION.slow },
              beat.copy,
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
              beat.ribbon,
            )
            // The two things that ask for an action come last.
            .to(
              "[data-intro='cta']",
              { opacity: 1, y: 0, duration: DURATION.base },
              beat.cta,
            )
            .to(
              "[data-intro='stat']",
              { opacity: 1, y: 0, duration: DURATION.base, stagger: 0.07 },
              beat.stats,
            );

          // The signature beat: kinetic type on *arrival*, not only on exit. The
          // statement lands spindly at a small optical size and thickens into its
          // resting cut while its lines are still rising, so the type appears to
          // be setting itself.
          //
          // It ends on exactly the values the scroll morph starts from (wght 430,
          // opsz 72 — see the `kinetic` prop below), so the first scroll picks up
          // precisely where this left off instead of snapping.
          if (headline) {
            intro
              // Uncovered as its own lines begin to rise. Near-zero duration:
              // this only lifts the CSS pre-intro state, it is not the animation
              // — the SplitText line masks are, and they start on the same beat
              // via the `delay` passed to SplitReveal below.
              .to(headline, { opacity: 1, duration: 0.01 }, beat.statement)
              .fromTo(
                headline,
                { "--wght": 200, "--opsz": 18, "--soft": 0 },
                { "--wght": 430, "--opsz": 72, duration: 1.5 },
                beat.statement,
              );
          }

          // Held until the preloader reports the page ready. Fires immediately
          // if the reveal has already happened — a repeat visit, where the gate
          // opens at once and the hero simply assembles.
          offReveal = onRevealStart(() => intro.play());
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

        // The tweens above are the context's to revert; the subscription is not,
        // so it is handed back here. Without this a torn-down timeline would
        // still be holding a slot in the reveal's listener set.
        return () => offReveal?.();
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="index"
      data-hero-intro
      className="relative flex min-h-svh flex-col overflow-hidden px-6 pt-24 pb-10 md:px-10 md:pt-32"
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
          gate
          stagger={0.09}
          // The same offset the intro timeline uses for its statement beat, on
          // the same clock: `gate` holds this tween until the reveal too, so the
          // lines rise exactly while the axes thicken instead of reading as two
          // separate events. SplitReveal has to own this tween — it must survive
          // autoSplit's re-splits — so the sync is by sharing the clock rather
          // than by living on the timeline.
          delay={INTRO.beat.statement}
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
          <span className="block">I build things because </span>
          <span className="block">
            something <em className="text-signal not-italic">annoyed me.</em>
          </span>
        </SplitReveal>

        {/* Copy left, ribbon right — and the ribbon is desktop-only again.
            It was stacked below `lg` to fill roughly 180px of blank paper that sat
            between a one-paragraph pitch and the CTA. The pitch is now two
            paragraphs and four sentences longer, so that gap is gone: keeping the
            ribbon on a phone pushed the stats 112px *below* the fold, which is the
            same failure it was introduced to solve, inverted. The covers are one
            scroll away in the work list either way. */}
        <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          {/* Two paragraphs, both on the same intro beat, so they arrive as one
              block of copy rather than as a second thing happening. */}
          <div className="max-w-xl space-y-5">
            <p
              data-intro="copy"
              className="text-ink-muted text-lg leading-relaxed text-pretty md:text-xl"
            >
              Most of my projects started the same way: I ran into a problem,
              couldn&rsquo;t find a solution I liked, and built one instead.
              Sometimes it&rsquo;s a job search tool. Sometimes it&rsquo;s a
              wedding website. Sometimes it&rsquo;s realizing halfway through a
              project that I forgot an entire onboarding screen.
            </p>
            <p
              data-intro="copy"
              className="text-ink-muted text-base leading-relaxed text-pretty md:text-lg"
            >
              I&rsquo;m {CONTACT.shortName}. I work across the stack, from
              database design to frontend polish, and I genuinely enjoy figuring
              out how all the pieces fit together.
            </p>
          </div>

          {/* The work, glimpsed. Decorative twin of the list below — same covers,
              and the list is the accessible path — so it stays out of the a11y
              tree entirely and the images carry no alt text. */}
          <div
            aria-hidden="true"
            className="hidden items-end gap-3 lg:flex lg:shrink-0 lg:gap-4"
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
                  // Above the fold, so the default `lazy` had them arriving
                  // *after* their own fade-in beat had played. Eager loading is
                  // also what lets the preloader wait on them: it counts these
                  // three decoding as a third of "ready".
                  //
                  // Not `preload`, and not the deprecated `priority`: a <head>
                  // preload link for three decorative covers would compete with
                  // Fraunces, which is the swap the preloader exists to hide.
                  // Same call, for the same reason, as app/work/[slug]/page.tsx.
                  loading="eager"
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
