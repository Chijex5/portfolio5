"use client";

import { useRef } from "react";
import { PIPELINE_ICONS } from "@/components/type/PipelineIcons";
import { gsap, useGSAP } from "@/lib/gsap";
import { AXES, EASE_GSAP, MOTION_OK } from "@/lib/tokens";

/**
 * The pipeline, one step at a time. Read top to bottom it is how the work
 * actually goes, which is what makes it worth animating.
 *
 * `word` is the step. `copy` is what that step actually means — the thing the
 * previous version of this section was missing entirely.
 */
const STEPS = [
  {
    word: "Idea.",
    copy: "It starts as a problem I actually have — a messy job hunt, a wedding with a deadline, screens I forgot to design.",
  },
  {
    word: "Schema.",
    copy: "Before a line of interface: what are the things, and how do they relate? This is the decision everything later is stuck with.",
  },
  {
    word: "API.",
    copy: "The contract, typed end to end, so the interface can never ask for something the data cannot answer.",
  },
  {
    word: "Interface.",
    copy: "Where it stops being records and starts being something you would actually use without a disclaimer.",
  },
  {
    word: "Shipped.",
    copy: "On a real domain, with someone's money or someone's wedding riding on it. That part is not a detail.",
  },
] as const;

/** Scroll distance each step owns, in timeline units. */
const STEP_SPAN = 1;
/** Fraction of a step's span spent handing over to the next one. */
const HANDOVER = 0.28;

/**
 * "The order of things" — the section where the type *is* the animation.
 *
 * ── Why this was rebuilt ────────────────────────────────────────────────────
 *
 * The previous version stacked all five words in a sticky column and travelled a
 * variable-font weight "peak" down them. On paper that is kinetic typography; on
 * screen the only thing that visibly happened was text getting darker, and it all
 * sat in one column on the left. Worse, it named five stages of building software
 * and then said nothing about any of them — the words were decoration.
 *
 * So now one step holds the frame at a time, and each one arrives in four beats:
 *
 *   1. its icon *draws itself* — a stroke-dashoffset tween, so a line is written
 *      into a lightbulb, a schema, a pair of brackets (see PipelineIcons.tsx);
 *   2. the word masks up out of a clipped box;
 *   3. its copy rises in behind it, which is the part that actually explains
 *      anything;
 *   4. the rail node fills and the counter ticks over.
 *
 * Then it hands back — icon un-draws, word and copy fall away — and the next step
 * takes over. Scrubbed against scroll, so scrolling back runs the whole thing in
 * reverse rather than replaying it.
 *
 * ── Two structural choices ──────────────────────────────────────────────────
 *
 * Held with `position: sticky`, not a ScrollTrigger pin: sticky needs no
 * pin-spacer, so there is nothing for Lenis and ScrollTrigger to disagree about,
 * and the section still scrolls sensibly if the JS never runs.
 *
 * Every step is in the DOM at full opacity before the timeline touches it, and
 * the reduced-motion branch simply never runs. That leaves a plain, readable list
 * of five stages and their explanations — which is a better no-JS fallback than
 * the old version had, since the copy carries the meaning rather than the motion.
 */
export default function KineticStatement() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const section = root.current;
      if (!section) return;

      const mm = gsap.matchMedia();

      mm.add(MOTION_OK, () => {
        const cards = gsap.utils.toArray<HTMLElement>("[data-step]", section);
        const nodes = gsap.utils.toArray<HTMLElement>(
          "[data-rail-node]",
          section,
        );
        const counter = section.querySelector<HTMLElement>("[data-step-count]");
        const progress = section.querySelector<HTMLElement>("[data-rail-fill]");

        // Rest and active states, declared once. The axes ride the same tween as
        // the transform because GSAP animates registered custom properties
        // natively — see the `@property` block in globals.css.
        const wordRest = {
          "--wght": 260,
          "--opsz": AXES.opsz.min,
          yPercent: 105,
          opacity: 0,
        };
        const wordActive = {
          "--wght": 780,
          "--opsz": AXES.opsz.max,
          yPercent: 0,
          opacity: 1,
        };

        // Everything starts stowed...
        gsap.set("[data-step-word]", wordRest);
        gsap.set("[data-step-copy]", { y: 24, opacity: 0 });
        gsap.set("[data-step-icon] path", {
          strokeDasharray: 1,
          strokeDashoffset: 1,
        });

        // ...except the first step, which starts *arrived*.
        //
        // The timeline is scrubbed, so at scroll position "top top" its progress is
        // 0 and no tween has run yet. With every step stowed, the section would
        // pin an empty frame and only draw its first step once the visitor had
        // already scrolled into it — the opening beat would happen off-screen. So
        // step one is placed in its finished state here, and the loop below skips
        // its entrance. Its exit is scheduled as normal, and because a scrubbed
        // tween reverses, scrolling back up restores exactly this state.
        const first = cards[0];
        if (first) {
          gsap.set(first.querySelectorAll("[data-step-word]"), wordActive);
          gsap.set(first.querySelectorAll("[data-step-copy]"), {
            y: 0,
            opacity: 1,
          });
          gsap.set(first.querySelectorAll("[data-step-icon] path"), {
            strokeDashoffset: 0,
          });
        }
        // The five steps share one grid cell, so all but the visible one are
        // stacked underneath it. Hit-testing and text selection would otherwise
        // reach through to steps nobody can see, and a drag-select would collect
        // all five sets of copy at once. They stay in the a11y tree — it is a real
        // ordered list of the stages — they just cannot be pointed at.
        gsap.set(cards, { pointerEvents: "none" });
        gsap.set(nodes, { scale: 0 });

        const timeline = gsap.timeline({
          defaults: { ease: EASE_GSAP },
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
          },
        });

        cards.forEach((card, i) => {
          const at = i * STEP_SPAN;
          const word = card.querySelector<HTMLElement>("[data-step-word]");
          const copy = card.querySelector<HTMLElement>("[data-step-copy]");
          const paths = card.querySelectorAll("[data-step-icon] path");
          const node = nodes[i];

          // ── in ──
          // Skipped for step one, which is already on screen — see above. Its
          // node still fills at position 0 so the rail agrees with what is shown.
          if (i === 0) {
            if (node) timeline.to(node, { scale: 1, duration: 0.2 }, 0);
          } else {
            // The icon leads. It is the only element that is *drawn* rather than
            // moved, so giving it the first beat is what makes the step read as
            // being built rather than sliding in.
            timeline.to(
              paths,
              { strokeDashoffset: 0, duration: 0.34, stagger: 0.05 },
              at,
            );
            if (word) {
              timeline.to(word, { ...wordActive, duration: 0.34 }, at + 0.1);
            }
            if (copy) {
              timeline.to(copy, { y: 0, opacity: 1, duration: 0.3 }, at + 0.2);
            }
            if (node) {
              timeline.to(node, { scale: 1, duration: 0.2 }, at + 0.1);
            }
          }
          if (counter) {
            // A set, not a tween: the readout is an integer and interpolating it
            // would print numbers that are not steps.
            timeline.call(
              () => {
                counter.textContent = String(i + 1).padStart(2, "0");
              },
              undefined,
              at + 0.1,
            );
          }

          // ── out ──
          // The last step keeps the frame. Fading it would leave the section
          // ending on an empty screen the visitor has to scroll past.
          if (i === cards.length - 1) return;

          const out = at + STEP_SPAN - HANDOVER;
          if (copy) {
            timeline.to(copy, { y: -20, opacity: 0, duration: 0.24 }, out);
          }
          if (word) {
            timeline.to(
              word,
              { ...wordRest, yPercent: -105, duration: 0.28 },
              out + 0.04,
            );
          }
          // Un-drawn from the same end it was drawn from, so the line retracts
          // the way it arrived instead of erasing from the other side.
          timeline.to(
            paths,
            { strokeDashoffset: 1, duration: 0.26, stagger: 0.03 },
            out + 0.04,
          );
        });

        // The rail fills across the whole section, independent of the steps, so
        // there is always something reporting overall position.
        if (progress) {
          timeline.fromTo(
            progress,
            { scaleX: 0 },
            { scaleX: 1, ease: "none", duration: timeline.duration() },
            0,
          );
        }
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      aria-label="How the work happens"
      // One viewport of scroll per step, plus a little to land on. This is what
      // the scrub is measured against, so it is the real pacing control.
      className="relative px-6 md:px-10"
      style={{ minHeight: `${STEPS.length * 90 + 40}svh` }}
    >
      <div className="sticky top-0 flex h-svh flex-col justify-center overflow-hidden">
        {/* Header: label, then the counter */}
        <div className="flex items-center gap-4">
          <p className="text-ink-muted font-mono text-xs tracking-[0.2em] uppercase">
            The order of things
          </p>
          <span aria-hidden="true" className="bg-ink/10 h-px flex-1" />
          <p
            className="text-ink-muted font-mono text-xs tracking-[0.2em] tabular-nums"
            aria-hidden="true"
          >
            <span data-step-count>01</span>
            <span className="text-ink/25">
              {" "}
              / {String(STEPS.length).padStart(2, "0")}
            </span>
          </p>
        </div>

        {/* The steps, stacked in one grid cell so each holds the same frame.
            A real <ol> underneath: this is an ordered list of stages, and it
            stays one for a screen reader even though only one is visible. */}
        <ol className="relative mt-10 grid flex-1 items-center md:mt-14">
          {STEPS.map((step, i) => {
            const Icon = PIPELINE_ICONS[i];
            return (
              <li
                key={step.word}
                data-step
                // Every step occupies the same cell. `col-start-1 row-start-1`
                // rather than absolute positioning, so the grid still sizes
                // itself to the tallest step and nothing overflows the sticky box.
                className="col-start-1 row-start-1 flex flex-col gap-6 md:flex-row md:items-center md:gap-12"
              >
                <div
                  data-step-icon
                  className="text-signal size-16 shrink-0 md:size-24"
                >
                  <Icon className="size-full" />
                </div>

                <div className="min-w-0">
                  {/* The mask is its own element: the word slides inside a clipped
                      box, and putting overflow on the flex child would clip the
                      copy's rise as well. */}
                  <span className="block overflow-hidden pb-[0.14em]">
                    <span
                      data-step-word
                      className="kinetic font-display block origin-left text-[clamp(2.5rem,9vw,7rem)] leading-[1.02] tracking-[-0.02em] will-change-transform"
                    >
                      {step.word}
                    </span>
                  </span>

                  <p
                    data-step-copy
                    className="text-ink-muted mt-5 max-w-xl text-base leading-relaxed text-pretty md:mt-6 md:text-lg"
                  >
                    {step.copy}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        {/* Rail: one node per step over a fill that tracks the whole section. */}
        <div aria-hidden="true" className="relative mt-8 md:mt-10">
          <span className="bg-ink/10 block h-px w-full overflow-hidden">
            <span
              data-rail-fill
              className="bg-signal block h-full w-full origin-left scale-x-0"
            />
          </span>
          <ol className="mt-4 flex justify-between">
            {STEPS.map((step) => (
              <li key={step.word}>
                {/* Two elements, not one tweened colour: GSAP would have to
                    interpolate `var(--signal)` from a rest colour, and a CSS
                    variable is not a value it can read a start point from. Scaling
                    an inner dot that is already the right colour needs no colour
                    interpolation at all. */}
                <span className="bg-ink/20 block size-1.5 overflow-hidden rounded-full">
                  <span
                    data-rail-node
                    className="bg-signal block size-full origin-center rounded-full"
                  />
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
