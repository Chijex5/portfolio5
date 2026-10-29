"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { intro } from "@/lib/intro";
import { lockScroll } from "@/lib/scroll";
import { stage } from "@/lib/stage/stage";

/** The count always takes at least this long, so it reads as a beat. */
const MIN_FIRST = 2.4;
/** A reload in the same tab has seen it; keep it brief, but still a count. */
const MIN_REPEAT = 1.1;
/** Give up waiting on the stage after this and let the page in anyway. */
const GIVE_UP = 7;

/** 0–9 and a second 0, so a reel can roll from 9 over into 0 without jumping. */
const REEL = "01234567890".split("");
const STEP = 100 / REEL.length;

/**
 * Read once per page load, not per effect run: in development React runs
 * effects twice, and the second run would otherwise always see "seen".
 */
const SEEN = (() => {
  if (typeof window === "undefined") return false;
  try {
    const seen = sessionStorage.getItem("seen") === "1";
    sessionStorage.setItem("seen", "1");
    return seen;
  } catch {
    return false;
  }
})();

/**
 * Where each of the three reels sits for a value `v` (0–100), in digits.
 * Like a car's odometer: the units turn continuously, and a higher reel only
 * turns while every reel below it is rolling from 9 over to 0.
 */
function positions(v: number) {
  return [100, 10, 1].map((unit) => {
    const whole = Math.floor(v / unit);
    const below = v - whole * unit; // what the lower reels show, 0 – unit
    // Units roll continuously; higher reels roll during the last unit of below.
    const roll = unit === 1 ? below : Math.max(0, below - (unit - 1));
    return (whole % 10) + roll;
  });
}

/**
 * The opening. A rolling counter that follows the stage's real loading
 * progress (type loaded, shapes built) but never finishes faster than a
 * readable beat. Then one sequence hands over to the page: the labels and
 * the number lift out, the paper wipes up with an accent band chasing it,
 * and as it clears the particles fly into "CJ." and the headline rises.
 */
export default function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const curtain = useRef<HTMLDivElement>(null);
  const reels = useRef<(HTMLSpanElement | null)[]>([]);
  const bar = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current;
    const band = curtain.current;
    if (!el || !band) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    lockScroll(true);
    window.scrollTo(0, 0);

    const shown = { v: 0 };
    const start = performance.now();
    const min = (SEEN ? MIN_REPEAT : MIN_FIRST) * 1000;
    let done = false;
    let exit: gsap.core.Timeline | null = null;

    // Transforms only: rewriting text would repaint the counter every frame,
    // and the browser would keep re-reporting it as the largest paint.
    const render = () => {
      const pos = positions(Math.min(100, shown.v));
      reels.current.forEach((reel, i) => {
        if (reel) reel.style.transform = `translateY(${-pos[i] * STEP}%)`;
      });
      if (bar.current) bar.current.style.transform = `scaleX(${shown.v / 100})`;
    };
    render();

    const leave = () => {
      if (done) return;
      done = true;
      gsap.killTweensOf(shown);
      const fast = reduced ? 0.01 : 1;
      exit = gsap.timeline({
        onComplete: () => {
          el.style.display = "none";
          band.style.display = "none";
        },
      });
      // Land on 100, and hold it for a breath.
      exit.to(shown, {
        v: 100,
        duration: 0.45 * fast,
        ease: "power3.out",
        onUpdate: render,
      });
      // Everything on the panel lifts out together.
      exit.to(
        el.querySelectorAll("[data-pl-out]"),
        {
          yPercent: -110,
          duration: 0.6 * fast,
          ease: "expo.in",
          stagger: 0.05,
        },
        "+=0.2",
      );
      // The paper wipes up; the accent band follows a beat behind it.
      exit.addLabel("wipe", "-=0.1");
      exit.to(
        el,
        {
          clipPath: "inset(0% 0% 100% 0%)",
          duration: reduced ? 0.25 : 1,
          ease: "expo.inOut",
        },
        "wipe",
      );
      exit.to(
        band,
        {
          clipPath: "inset(0% 0% 100% 0%)",
          duration: reduced ? 0.25 : 1,
          ease: "expo.inOut",
        },
        reduced ? "wipe" : "wipe+=0.12",
      );
      // The page comes in as the wipe passes the middle of the screen: the
      // particles start gathering and the headline starts to rise, so both
      // land just after the screen is clear.
      exit.add(
        () => {
          lockScroll(false);
          stage.intro();
          intro.reveal();
        },
        reduced ? ">" : "wipe+=0.45",
      );
    };

    // Follow real progress, eased, never ahead of the time-based floor.
    const follow = () => {
      if (done) return;
      const elapsed = performance.now() - start;
      const t = Math.min(1, elapsed / min);
      // Ease the floor too, so the count starts briskly and settles.
      const cap = (1 - Math.pow(1 - t, 2)) * 100;
      const target = Math.min(stage.progress * 100, cap, 99);
      gsap.to(shown, {
        v: target,
        duration: 0.35,
        ease: "power1.out",
        onUpdate: render,
        overwrite: true,
      });
      const loaded = stage.ready || stage.failed;
      if (loaded && elapsed >= min) leave();
    };
    const id = window.setInterval(follow, 80);
    const giveUp = window.setTimeout(leave, GIVE_UP * 1000);
    follow();

    return () => {
      window.clearInterval(id);
      window.clearTimeout(giveUp);
      gsap.killTweensOf(shown);
      // A remount (development) starts the sequence over; don't leave a
      // half-played exit behind.
      if (exit) {
        exit.kill();
        el.style.display = "";
        band.style.display = "";
        el.style.clipPath = "inset(0% 0% 0% 0%)";
        band.style.clipPath = "inset(0% 0% 0% 0%)";
      }
    };
  }, []);

  return (
    <>
      {/* The band that chases the wipe. Same visibility rules as the panel. */}
      <div
        ref={curtain}
        aria-hidden="true"
        className="preloader bg-accent fixed inset-0 z-[89]"
        style={{ clipPath: "inset(0% 0% 0% 0%)" }}
      />
      <div
        ref={root}
        aria-hidden="true"
        className="preloader bg-paper text-ink fixed inset-0 z-[90] flex-col justify-between p-4 md:p-10"
        style={{ clipPath: "inset(0% 0% 0% 0%)" }}
      >
        <div className="label text-ink-muted flex justify-between">
          <span className="block overflow-clip">
            <span data-pl-out className="block">
              CJ — Portfolio 2026
            </span>
          </span>
          <span className="block overflow-clip">
            <span data-pl-out className="block">
              Full-stack developer
            </span>
          </span>
        </div>

        <div className="flex items-end justify-between gap-6">
          <span className="block overflow-clip">
            <span
              data-pl-out
              className="display flex h-[0.9em] overflow-clip text-[clamp(5rem,22vw,20rem)] tabular-nums"
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  ref={(el) => {
                    reels.current[i] = el;
                  }}
                  className="flex flex-col will-change-transform"
                >
                  {REEL.map((d, k) => (
                    <span key={k} className="block h-[0.9em] leading-[0.9]">
                      {d}
                    </span>
                  ))}
                </span>
              ))}
              <span className="text-accent ml-[0.06em] self-start text-[0.32em] leading-none">
                %
              </span>
            </span>
          </span>
          <div className="label text-ink-muted mb-[1.2em] hidden w-56 md:block">
            <span className="block overflow-clip">
              <span data-pl-out className="block">
                Loading the good stuff
              </span>
            </span>
            <span className="bg-ink-faint mt-3 block h-px w-full overflow-hidden">
              <span
                ref={bar}
                className="bg-accent block h-full w-full origin-left scale-x-0"
              />
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
