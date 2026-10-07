"use client";

import { useRef } from "react";
import SceneFrame from "@/components/work/SceneFrame";
import { SCENES } from "@/components/work/scenes";
import { chapter } from "@/lib/chapter";
import { gsap, useGSAP } from "@/lib/gsap";
import { lockScroll } from "@/lib/scroll";
import { stage } from "@/lib/stage/stage";

/** Real seconds per step when a scene plays on its own. */
const STEP_SECONDS = 3.4;

/**
 * The top of a case study: the project's scene, playing on a loop, with a row
 * of steps underneath that fill as it goes. The same scene the home page drives
 * with scroll, driven by the clock here. Pauses whenever it is off screen.
 */
export default function CaseScene({
  slug,
  index,
  label,
}: {
  slug: string;
  index: string;
  label: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const scene = SCENES[slug];

  useGSAP(
    () => {
      chapter.set({ index, label });
      stage.show(false, 0.3);
      lockScroll(false);

      const tl = timeline.current;
      const el = root.current;
      if (!tl || !el || !scene) return;
      const bars = gsap.utils.toArray<HTMLElement>("[data-step-bar]", el);
      const items = gsap.utils.toArray<HTMLElement>("[data-step-item]", el);

      const paint = () => {
        const t = tl.time();
        bars.forEach(
          (b, i) =>
            (b.style.transform = `scaleX(${Math.min(1, Math.max(0, t - i))})`),
        );
        items.forEach((it, i) =>
          it.toggleAttribute("data-active", t >= i && t < i + 1),
        );
      };

      if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
        tl.progress(1);
        bars.forEach((b) => (b.style.transform = "scaleX(1)"));
        return;
      }

      tl.timeScale(1 / STEP_SECONDS);
      tl.eventCallback("onUpdate", paint);
      // Loop with a breath: hold the last frame, fade, start over.
      tl.eventCallback("onComplete", () => {
        gsap.to(frame.current, {
          autoAlpha: 0,
          duration: 0.45,
          delay: 1.6,
          onComplete: () => {
            tl.restart();
            gsap.to(frame.current, { autoAlpha: 1, duration: 0.45 });
          },
        });
      });
      tl.play(0);

      const io = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) tl.resume();
        else tl.pause();
      });
      io.observe(el);
      return () => io.disconnect();
    },
    { scope: root },
  );

  if (!scene) return null;
  const Component = scene.Component;
  return (
    <div ref={root} className="px-4 pt-20 md:px-10 md:pt-28">
      <div ref={frame}>
        <SceneFrame className="h-[min(62svh,560px)] md:h-[min(70svh,640px)]">
          <Component register={(tl) => (timeline.current = tl)} />
        </SceneFrame>
      </div>
      <ol className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 md:mt-10 md:grid-cols-4">
        {scene.copy.steps.map((s, i) => (
          <li
            key={s.title}
            data-step-item
            className="text-bone-muted data-[active]:text-bone transition-colors duration-500"
          >
            <span className="bg-bone-faint block h-px overflow-hidden">
              <span
                data-step-bar
                className="bg-signal block h-full w-full origin-left"
                style={{ transform: "scaleX(0)" }}
              />
            </span>
            <p className="label mt-3 tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </p>
            <p className="mt-1 text-[0.95rem] font-medium tracking-[-0.02em]">
              {s.title}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
