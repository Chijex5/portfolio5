"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { intro } from "@/lib/intro";
import { lockScroll } from "@/lib/scroll";
import { stage } from "@/lib/stage/stage";

/** Never shorter than this, so the counter reads as a beat rather than a flash. */
const MIN_FIRST = 1.6;
/** A reload in the same tab has seen it; keep it brief. */
const MIN_REPEAT = 0.5;
/** Give up waiting on the stage after this and let the page in anyway. */
const GIVE_UP = 7;

/**
 * The opening. A counter that follows the stage's real loading progress
 * (pictures sampled, type loaded, shapes built), then a wipe upward that hands
 * the screen to the particles, which fly out of a single point into the knot.
 */
export default function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const reels = useRef<(HTMLSpanElement | null)[]>([]);
  const bar = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let seen = false;
    try {
      seen = sessionStorage.getItem("seen") === "1";
      sessionStorage.setItem("seen", "1");
    } catch {}
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    lockScroll(true);
    window.scrollTo(0, 0);

    const shown = { v: 0 };
    const start = performance.now();
    const min = (seen ? MIN_REPEAT : MIN_FIRST) * 1000;
    let done = false;

    // An odometer: each digit is a reel of 0–9 moved by transform. Rewriting the
    // text instead would repaint the counter on every tick, and the browser
    // would keep re-reporting it as the page's largest paint.
    const render = () => {
      const digits = String(Math.round(shown.v)).padStart(3, "0");
      reels.current.forEach((reel, i) => {
        if (reel)
          reel.style.transform = `translateY(${-Number(digits[i]) * 10}%)`;
      });
      if (bar.current) bar.current.style.transform = `scaleX(${shown.v / 100})`;
    };

    const leave = () => {
      if (done) return;
      done = true;
      gsap.killTweensOf(shown);
      const tl = gsap.timeline({
        onComplete: () => {
          el.style.display = "none";
        },
      });
      tl.to(shown, {
        v: 100,
        duration: 0.35,
        ease: "power2.out",
        onUpdate: render,
      });
      tl.to(el.querySelectorAll("[data-pl-out]"), {
        yPercent: -110,
        duration: reduced ? 0.01 : 0.7,
        ease: "expo.in",
        stagger: 0.04,
      });
      tl.to(
        el,
        {
          clipPath: "inset(0% 0% 100% 0%)",
          duration: reduced ? 0.2 : 1.05,
          ease: "expo.inOut",
        },
        "-=0.25",
      );
      // Overlaps the wipe so the particles start gathering as it clears. Under
      // reduced motion the wipe is shorter than the overlap, which would put
      // this at a negative time where it never fires — so it just follows.
      tl.add(
        () => {
          lockScroll(false);
          stage.intro();
          intro.reveal();
        },
        reduced ? ">" : "-=0.55",
      );
    };

    // Follow the real progress, eased so it never jumps.
    const follow = () => {
      if (done) return;
      const elapsed = performance.now() - start;
      // Time caps how far the counter may run ahead, so the minimum is honoured.
      const cap = Math.min(1, elapsed / min) * 100;
      const target = Math.min(stage.progress * 100, cap);
      gsap.to(shown, {
        v: target,
        duration: 0.5,
        ease: "power2.out",
        onUpdate: render,
        overwrite: true,
      });
      const loaded = stage.ready || stage.failed;
      if (loaded && elapsed >= min) leave();
    };
    const id = window.setInterval(follow, 120);
    const giveUp = window.setTimeout(leave, GIVE_UP * 1000);
    follow();

    return () => {
      window.clearInterval(id);
      window.clearTimeout(giveUp);
    };
  }, []);

  return (
    <div
      ref={root}
      aria-hidden="true"
      className="preloader bg-ink text-bone fixed inset-0 z-[90] flex-col justify-between p-4 md:p-10"
      style={{ clipPath: "inset(0% 0% 0% 0%)" }}
    >
      <div className="label text-bone-muted flex justify-between">
        <span className="block overflow-clip">
          <span data-pl-out className="block">
            Chijioke Uzodinma
          </span>
        </span>
        <span className="block overflow-clip">
          <span data-pl-out className="block">
            Portfolio — 2026
          </span>
        </span>
      </div>

      <div className="flex items-end justify-between gap-6">
        <span className="block overflow-clip">
          <span
            ref={count}
            data-pl-out
            className="display flex h-[0.9em] overflow-clip text-[clamp(5rem,22vw,20rem)] tabular-nums"
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                ref={(el) => {
                  reels.current[i] = el;
                }}
                className="flex flex-col transition-transform duration-500 ease-[var(--ease-out-expo)]"
              >
                {"0123456789".split("").map((d) => (
                  <span key={d} className="block h-[0.9em] leading-[0.9]">
                    {d}
                  </span>
                ))}
              </span>
            ))}
          </span>
        </span>
        <div className="label text-bone-muted mb-[1.2em] hidden w-56 md:block">
          <span className="block overflow-clip">
            <span data-pl-out className="block">
              Untangling
            </span>
          </span>
          <span className="bg-bone-faint mt-3 block h-px w-full overflow-hidden">
            <span
              ref={bar}
              className="bg-signal block h-full w-full origin-left scale-x-0"
            />
          </span>
        </div>
      </div>
    </div>
  );
}
