"use client";

import Link from "next/link";
import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import type { Project } from "@/lib/types";
import SceneFrame from "./SceneFrame";
import type { Scene } from "./scenes";

/** Scroll given to each step of a scene, in viewport heights. */
export const STEP_VH = 0.85;

/** Section height for a project with `steps` steps, in viewport heights. */
export function chapterVh(steps: number) {
  return steps * STEP_VH + 1;
}

/**
 * One project on the home page: its name and line on one side, its scene on
 * the other, held on screen while scrolling plays the scene step by step. A
 * small card names the current step ("02 / 04 · Pay with Paystack.").
 */
export default function ProjectChapter({
  project,
  index,
  total,
  scene,
  onOpen,
}: {
  project: Project;
  index: number;
  total: number;
  scene: Scene;
  onOpen?: (e: { preventDefault(): void }) => void;
}) {
  const root = useRef<HTMLElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const { steps } = scene.copy;
  const Component = scene.Component;

  useGSAP(
    () => {
      const tl = timeline.current;
      const el = root.current;
      if (!tl || !el) return;
      const cards = gsap.utils.toArray<HTMLElement>("[data-step-card]", el);
      const counter = el.querySelector<HTMLElement>("[data-step-count]");
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

      let active = 0;
      gsap.set(cards.slice(1), { autoAlpha: 0 });
      const show = (next: number) => {
        if (next === active) return;
        const prev = active;
        active = next;
        if (counter) counter.textContent = String(next + 1).padStart(2, "0");
        const dir = next > prev ? 1 : -1;
        gsap.killTweensOf([cards[prev], cards[next]]);
        if (reduced) {
          gsap.set(cards[prev], { autoAlpha: 0 });
          gsap.set(cards[next], { autoAlpha: 1, y: 0 });
          return;
        }
        gsap.to(cards[prev], {
          autoAlpha: 0,
          y: -16 * dir,
          duration: 0.3,
          ease: "power2.in",
        });
        gsap.fromTo(
          cards[next],
          { autoAlpha: 0, y: 20 * dir },
          { autoAlpha: 1, y: 0, duration: 0.7, ease: "expo.out", delay: 0.15 },
        );
      };

      // The card turns over a little after a step starts, once its motion reads.
      tl.eventCallback("onUpdate", () => {
        show(
          Math.min(steps.length - 1, Math.max(0, Math.floor(tl.time() - 0.15))),
        );
      });

      ScrollTrigger.create({
        trigger: el,
        // The first step builds while the chapter scrolls into place.
        start: "top 55%",
        end: "bottom bottom",
        animation: tl,
        scrub: reduced ? true : 0.7,
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      aria-labelledby={`project-${project.slug}`}
      className="relative"
      style={{ height: `${chapterVh(steps.length) * 100}svh` }}
    >
      <div
        data-exit
        className="sticky top-0 grid h-svh grid-rows-[1fr_auto] px-4 pt-20 pb-20 md:grid-cols-12 md:grid-rows-1 md:gap-10 md:px-10 md:pt-28 md:pb-24"
      >
        <SceneFrame className="row-start-1 min-h-0 md:col-span-7 md:col-start-6">
          <Component register={(tl) => (timeline.current = tl)} />
        </SceneFrame>

        <div className="row-start-2 flex flex-col justify-end md:col-span-5 md:col-start-1 md:row-start-1">
          <p className="label mb-4 flex items-center md:mb-6">
            <span className="text-signal">(05)</span>
            <span className="bg-bone-faint mx-3 h-px w-8" />
            <span className="text-bone-muted">
              {String(index + 1).padStart(2, "0")} /{" "}
              {String(total).padStart(2, "0")}
            </span>
          </p>
          <h2
            id={`project-${project.slug}`}
            className="display text-[clamp(2.6rem,5.4vw,6.25rem)]"
          >
            <Link
              href={`/work/${project.slug}`}
              onNavigate={onOpen}
              data-cursor="Case study"
            >
              {project.title}
            </Link>
          </h2>
          <p className="text-bone-muted mt-3 max-w-[30ch] text-[clamp(1rem,1.3vw,1.2rem)] leading-snug tracking-[-0.01em] md:mt-4">
            {project.line}
          </p>

          <div className="border-bone-faint mt-6 border-t pt-5 md:mt-10 md:pt-6">
            <p className="label text-bone-muted flex items-center gap-3">
              <span className="text-bone tabular-nums">
                <span data-step-count>01</span> /{" "}
                {String(steps.length).padStart(2, "0")}
              </span>
              <span>{project.category}</span>
            </p>
            <ol className="mt-3 grid">
              {steps.map((s) => (
                <li
                  key={s.title}
                  data-step-card
                  className="col-start-1 row-start-1"
                >
                  <p className="text-[clamp(1.3rem,1.9vw,1.8rem)] font-medium tracking-[-0.03em]">
                    {s.title}
                  </p>
                  <p className="text-bone-muted mt-1.5 max-w-[42ch] text-[0.95rem] leading-snug">
                    {s.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
