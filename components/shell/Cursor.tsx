"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

const FINE =
  "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

/**
 * A small dot that trails the pointer and opens into a labelled disc over
 * anything marked `data-cursor="Label"`. Only where there is a fine pointer;
 * touch and reduced-motion visitors keep the system cursor.
 */
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const reset = useRef<() => void>(() => {});
  const pathname = usePathname();

  // A route change swaps the element under a still pointer without a
  // pointermove, which would leave the last page's label showing.
  useEffect(() => reset.current(), [pathname]);

  useEffect(() => {
    const mq = matchMedia(FINE);
    if (!mq.matches || !dot.current || !label.current) return;
    const el = dot.current;
    const text = label.current;
    document.documentElement.classList.add("has-cursor");

    const x = gsap.quickTo(el, "x", { duration: 0.35, ease: "power3.out" });
    const y = gsap.quickTo(el, "y", { duration: 0.35, ease: "power3.out" });
    let shown = false;
    let active: string | null = null;

    const set = (next: string | null) => {
      if (next === active) return;
      active = next;
      if (next) {
        text.textContent = next;
        gsap.to(el, {
          width: 88,
          height: 88,
          duration: 0.5,
          ease: "expo.out",
          overwrite: "auto",
        });
        gsap.to(text, {
          opacity: 1,
          scale: 1,
          duration: 0.4,
          delay: 0.05,
          ease: "expo.out",
        });
      } else {
        gsap.to(el, {
          width: 10,
          height: 10,
          duration: 0.45,
          ease: "expo.out",
          overwrite: "auto",
        });
        gsap.to(text, { opacity: 0, scale: 0.6, duration: 0.2 });
      }
    };

    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      if (!shown) {
        shown = true;
        gsap.set(el, { x: e.clientX, y: e.clientY });
        gsap.to(el, { opacity: 1, duration: 0.3 });
      }
      x(e.clientX);
      y(e.clientY);
      const t = (e.target as Element | null)?.closest?.(
        "[data-cursor], a, button",
      );
      set(t ? (t.getAttribute("data-cursor") ?? "") || null : null);
      // Plain links without a label get a small grow rather than a disc.
      if (t && !t.getAttribute("data-cursor")) {
        gsap.to(el, {
          width: 34,
          height: 34,
          duration: 0.4,
          ease: "expo.out",
          overwrite: "auto",
        });
      } else if (!t && active === null) {
        gsap.to(el, {
          width: 10,
          height: 10,
          duration: 0.4,
          ease: "expo.out",
          overwrite: "auto",
        });
      }
    };
    reset.current = () => {
      set(null);
      gsap.to(el, {
        width: 10,
        height: 10,
        scale: 1,
        duration: 0.4,
        ease: "expo.out",
        overwrite: "auto",
      });
    };

    const leave = () => {
      shown = false;
      gsap.to(el, { opacity: 0, duration: 0.3 });
    };
    const down = () => gsap.to(el, { scale: 0.8, duration: 0.2 });
    const up = () => gsap.to(el, { scale: 1, duration: 0.4, ease: "expo.out" });

    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    return () => {
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  return (
    <div
      ref={dot}
      aria-hidden="true"
      className="bg-bone pointer-events-none fixed top-0 left-0 z-[100] flex h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full opacity-0 mix-blend-difference"
    >
      <span
        ref={label}
        className="label text-ink scale-[0.6] text-[0.625rem] whitespace-nowrap opacity-0"
      />
    </div>
  );
}
