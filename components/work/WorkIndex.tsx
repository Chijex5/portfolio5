"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { projects } from "@/lib/projects";
import { cn } from "@/lib/utils";

/**
 * Every project in one list, each row jumping to its scene below. Rows draw
 * their rule and lift their title in as they reach the screen; on a fine
 * pointer, hovering a row floats that project's cover beside the cursor,
 * leaning with the way it moves.
 */
export default function WorkIndex({ className }: { className?: string }) {
  const root = useRef<HTMLOListElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (!reduced) {
        gsap.utils.toArray<HTMLElement>("[data-row]", el).forEach((row) => {
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: row,
              start: "top 92%",
              toggleActions: "play none none reverse",
            },
          });
          tl.from(row.querySelector("[data-rule]"), {
            scaleX: 0,
            duration: 0.9,
            ease: "expo.inOut",
          });
          tl.from(
            row.querySelectorAll("[data-lift]"),
            { yPercent: 110, duration: 0.9, ease: "expo.out", stagger: 0.05 },
            0.25,
          );
        });
      }

      // The floating cover. Fine pointers only; touch has no hover.
      const box = preview.current!;
      if (reduced || !matchMedia("(hover: hover) and (pointer: fine)").matches)
        return;
      const x = gsap.quickTo(box, "x", { duration: 0.6, ease: "power3" });
      const y = gsap.quickTo(box, "y", { duration: 0.6, ease: "power3" });
      const rot = gsap.quickTo(box, "rotation", {
        duration: 0.8,
        ease: "power3",
      });
      let lastX = 0;
      const move = (e: PointerEvent) => {
        x(e.clientX + 28);
        y(e.clientY - box.offsetHeight / 2);
        rot(gsap.utils.clamp(-8, 8, (e.clientX - lastX) * 0.6));
        lastX = e.clientX;
      };
      el.addEventListener("pointermove", move);
      return () => el.removeEventListener("pointermove", move);
    },
    { scope: root },
  );

  const show = !!active;

  return (
    <>
      <ol
        ref={root}
        className={cn("relative", className)}
        onPointerLeave={() => setActive(null)}
      >
        {projects.map((p) => (
          <li key={p.slug} data-row className="relative">
            <a
              href={`#work-${p.slug}`}
              onPointerEnter={() => setActive(p.slug)}
              onFocus={() => setActive(null)}
              data-cursor="Jump"
              className="group grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-x-4 py-4 md:grid-cols-[3rem_1fr_10rem_2rem] md:py-5"
            >
              <span className="overflow-clip">
                <span data-lift className="label text-ink-muted block">
                  {p.index}
                </span>
              </span>
              <span className="overflow-clip pb-[0.08em]">
                <span
                  data-lift
                  className="group-hover:text-accent block text-[clamp(1.35rem,2.4vw,2.25rem)] font-medium tracking-[-0.03em] transition-[color,translate] duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-2"
                >
                  {p.title}
                </span>
              </span>
              <span className="hidden overflow-clip md:block">
                <span data-lift className="label text-ink-muted block">
                  {p.category} · {p.year}
                </span>
              </span>
              <span
                aria-hidden="true"
                className="text-ink-muted group-hover:text-accent justify-self-end transition-[color,rotate] duration-500 group-hover:-rotate-45"
              >
                →
              </span>
            </a>
            {/* The row's rule, drawn in from the left. */}
            <span
              data-rule
              aria-hidden="true"
              className="bg-ink-faint absolute inset-x-0 bottom-0 h-px origin-left"
            />
          </li>
        ))}
      </ol>

      <div
        ref={preview}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-30 hidden w-[min(26vw,360px)] md:block"
      >
        <div
          className={cn(
            "bg-paper-raised relative aspect-[16/11] overflow-hidden rounded-[14px] shadow-[0_30px_70px_-25px_rgba(0,0,0,0.55)] transition-[opacity,scale] duration-500 ease-[var(--ease-out-expo)]",
            show ? "scale-100 opacity-100" : "scale-75 opacity-0",
          )}
        >
          {projects.map(
            (p) =>
              p.cover && (
                <Image
                  key={p.slug}
                  src={p.cover.src}
                  alt=""
                  fill
                  sizes="360px"
                  className={cn(
                    "object-cover object-top transition-[opacity,scale] duration-500 ease-[var(--ease-out-expo)]",
                    active === p.slug
                      ? "scale-100 opacity-100"
                      : "scale-110 opacity-0",
                  )}
                />
              ),
          )}
        </div>
      </div>
    </>
  );
}
