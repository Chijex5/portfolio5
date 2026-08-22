"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { AXES, MOTION_OK } from "@/lib/tokens";

/**
 * The pipeline, one word per line. Read top to bottom it's how the work actually
 * goes, which is what makes it worth animating word by word.
 */
const STEPS = ["Idea.", "Schema.", "API.", "Interface.", "Shipped."] as const;

/** Scroll distance between one word's peak and the next, in timeline units. */
const STEP_GAP = 0.8;

/**
 * Kinetic statement — the section where type is the animation.
 *
 * As the section scrolls, a "peak" travels down the stack: each word swells from
 * a spindly 200 weight at optical size 9 to a fat 900 at optical size 144, picks
 * up the accent colour, pushes right, then falls back as the next word takes
 * over. The whole effect is variable-font axes plus a transform — no images, no
 * canvas, and the words stay selectable DOM text.
 *
 * Held in place with `position: sticky` rather than a ScrollTrigger pin: sticky
 * needs no pin-spacer, so there's nothing for Lenis and ScrollTrigger to
 * disagree about, and the section still scrolls normally if JS never runs.
 */
export default function KineticStatement() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const section = root.current;
      if (!section) return;

      const mm = gsap.matchMedia();

      mm.add(MOTION_OK, () => {
        const words = gsap.utils.toArray<HTMLElement>("[data-step]", section);
        const line = section.querySelector<HTMLElement>(
          "[data-statement-rule]",
        );

        const timeline = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
          },
        });

        const rest = {
          "--wght": 200,
          "--opsz": AXES.opsz.min,
          "--soft": 0,
          scale: 0.94,
          x: 0,
          opacity: 0.32,
        };
        const peak = {
          "--wght": 900,
          "--opsz": AXES.opsz.max,
          "--soft": 70,
          scale: 1,
          x: 24,
          opacity: 1,
        };

        // GSAP tweens registered CSS custom properties natively (CSSPlugin reads
        // the start value off getComputedStyle), so the axes ride the same tween
        // as the transform instead of needing a proxy + onUpdate.
        gsap.set(words, rest);

        words.forEach((word, i) => {
          const at = i * STEP_GAP;
          timeline
            .to(word, { ...peak, duration: 0.5 }, at)
            .to(word, { ...rest, duration: 0.5 }, at + 0.5);
        });

        // Keep the last word standing rather than fading out under the fold.
        const last = words[words.length - 1];
        if (last) {
          timeline.to(
            last,
            { ...peak, duration: 0.4 },
            (words.length - 1) * STEP_GAP + 0.5,
          );
        }

        if (line) {
          timeline.fromTo(
            line,
            { scaleX: 0 },
            { scaleX: 1, duration: timeline.duration() },
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
      className="relative min-h-[280svh] px-6 md:px-10"
    >
      <div className="sticky top-0 flex h-svh flex-col justify-center">
        <div className="flex items-center gap-4">
          <p className="text-ink-muted font-mono text-xs tracking-[0.2em] uppercase">
            The order of things
          </p>
          <span
            aria-hidden="true"
            data-statement-rule
            className="bg-signal h-px flex-1 origin-left"
          />
        </div>

        <ol className="mt-8 md:mt-12">
          {STEPS.map((step, i) => (
            <li key={step} className="flex items-baseline gap-4 md:gap-8">
              <span className="text-ink-muted w-8 font-mono text-[0.6875rem] tracking-[0.2em] tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                data-step
                className="kinetic font-display block origin-left text-[clamp(2.25rem,9vw,7rem)] leading-[1.04] tracking-[-0.02em] will-change-transform"
              >
                {step}
              </span>
            </li>
          ))}
        </ol>

        <p className="text-ink-muted mt-10 max-w-md text-base leading-relaxed text-pretty md:mt-14 md:text-lg">
          Same person at every step. That&rsquo;s the whole pitch.
        </p>
      </div>
    </section>
  );
}
