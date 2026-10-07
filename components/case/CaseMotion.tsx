"use client";

import { useRef } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";

/**
 * Scroll reveals for a case study: `[data-split]` headings rise line by line,
 * `[data-rise]` blocks fade up. Everything is visible without JS, and under
 * reduced motion nothing animates.
 */
export default function CaseMotion({
  children,
}: {
  children: React.ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.utils
        .toArray<HTMLElement>("[data-split]", root.current)
        .forEach((el) => {
          SplitText.create(el, {
            type: "lines",
            mask: "lines",
            linesClass: "split-line",
            autoSplit: true,
            onSplit: (self) =>
              gsap.from(self.lines, {
                yPercent: 115,
                duration: 1.2,
                ease: "expo.out",
                stagger: 0.08,
                delay: el.hasAttribute("data-now") ? 0.5 : 0,
                scrollTrigger: el.hasAttribute("data-now")
                  ? undefined
                  : { trigger: el, start: "top 88%" },
              }),
          });
        });
      gsap.utils
        .toArray<HTMLElement>("[data-rise]", root.current)
        .forEach((el) => {
          gsap.from(el, {
            autoAlpha: 0,
            y: 24,
            duration: 1.1,
            ease: "expo.out",
            scrollTrigger: { trigger: el, start: "top 90%" },
          });
        });
    },
    { scope: root },
  );

  return <div ref={root}>{children}</div>;
}
