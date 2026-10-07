"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { chapter } from "@/lib/chapter";
import { gsap } from "@/lib/gsap";
import { lockScroll } from "@/lib/scroll";
import { stage } from "@/lib/stage/stage";
import type { Project } from "@/lib/types";

/** A case study's cover screenshot, revealed with a wipe as the page opens. */
export default function CaseCover({ project }: { project: Project }) {
  const box = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);

  useEffect(() => {
    chapter.set({ index: project.index, label: project.category });
    const el = box.current;
    const pic = img.current;
    if (!el) return;
    stage.show(false, 0.3);
    lockScroll(false);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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
