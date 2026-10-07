"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { chapter, handoff } from "@/lib/chapter";
import { gsap } from "@/lib/gsap";
import { lockScroll } from "@/lib/scroll";
import { stage } from "@/lib/stage/stage";
import type { Project } from "@/lib/types";

/**
 * A case study's cover, and the far side of the home page's transition.
 *
 * Arriving from the home page, the particles are already holding this picture
 * in exactly this box (coverRect in lib/stage/layout.ts mirrors `.case-cover`),
 * so the image simply fades in over them and the stage fades out underneath.
 * Arriving any other way, the cover reveals itself.
 */
export default function CaseCover({ project }: { project: Project }) {
  const box = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);

  useEffect(() => {
    chapter.set({ index: project.index, label: project.category });
    const el = box.current;
    const pic = img.current;
    if (!el) return;
    const fromHome = handoff.take(project.slug);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!fromHome) {
      stage.show(false, 0.3);
      lockScroll(false);
      if (!reduced) {
        gsap.fromTo(
          el,
          { clipPath: "inset(100% 0% 0% 0%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 1.4,
            ease: "expo.inOut",
            delay: 0.1,
          },
        );
        if (pic)
          gsap.fromTo(
            pic,
            { scale: 1.25 },
            { scale: 1, duration: 1.8, ease: "expo.out", delay: 0.1 },
          );
      }
      return;
    }

    gsap.set(el, { autoAlpha: 0 });
    let done = false;
    const land = () => {
      if (done) return;
      done = true;
      // Slow enough to read as the picture developing: light covers go from
      // the stage's dark-mode dots to the real, bright screenshot.
      gsap.to(el, {
        autoAlpha: 1,
        duration: 0.9,
        ease: "power2.out",
        onComplete: () => {
          stage.handoff();
          lockScroll(false);
        },
      });
    };
    if (pic?.complete && pic.naturalWidth) land();
    else pic?.addEventListener("load", land, { once: true });
    // Never hold the page hostage to one image.
    const t = window.setTimeout(land, 2500);
    return () => window.clearTimeout(t);
  }, [project]);

  if (!project.cover) return null;
  return (
    <div
      ref={box}
      className="case-cover bg-ink-raised relative overflow-hidden"
    >
      <Image
        ref={img}
        src={project.cover.src}
        alt={project.cover.alt}
        fill
        loading="eager"
        sizes="100vw"
        className="object-cover"
      />
    </div>
  );
}
