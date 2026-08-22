"use client";

import { useEffect, useRef } from "react";
import { useLenis } from "lenis/react";
import { gsap, useGSAP } from "@/lib/gsap";
import {
  beginReveal,
  introSeen,
  markIntroSeen,
  onRevealStart,
  revealStarted,
} from "@/lib/intro";
import { CONTACT } from "@/lib/nav";
import { EASE_GSAP, INTRO, MOTION_OK } from "@/lib/tokens";

/**
 * How much of "ready" each signal is worth.
 *
 * Weighted rather than all-or-nothing because they are the three different ways
 * this page can look unfinished, and they do not arrive in a predictable order:
 * the document can be complete while Fraunces is still swapping, and the covers
 * can decode long after both. A weighted sum is also what gives the bar
 * something honest to show — it moves when something real has landed.
 */
const WEIGHT = {
  /** Scripts, stylesheets and eager images: the document itself. */
  load: 0.5,
  /** The webfont swap — the single most visible "it changed after I looked". */
  fonts: 0.3,
  /** The three hero covers, decoded rather than merely fetched. */
  covers: 0.2,
} as const;

/**
 * The bar stops here until the gate resolves, so the last few percent always
 * belong to the exit. A counter that sits on 100% while nothing happens reads as
 * a hang; one that finishes as the panels part reads as the cause of them.
 */
const CEILING = 0.97;

/** Per-frame approach rate for the bar, at 60fps. Delta-scaled below. */
const LERP = 0.12;

/**
 * The site preloader — it owns the wait, so nothing else has to guess at it.
 *
 * The problem it solves is that "React has hydrated" and "the page is ready to
 * be looked at" are different moments, and the hero used to open on the first
 * one: the panel lifted 0.72s after mount whether or not the webfont had
 * swapped or the covers had decoded, so the reveal uncovered a page that was
 * still assembling itself.
 *
 * So the wait is measured instead of assumed. Three real signals race a floor
 * and a ceiling — hold for at least `minHold` so the wordmark reads as
 * deliberate, resolve the moment everything has landed, and never wait longer
 * than `maxWait` no matter what is stuck. Then the panels part and
 * `beginReveal()` releases the hero's own choreography (lib/intro.ts).
 *
 * Rendered from app/layout.tsx rather than from the hero, for two reasons: it is
 * in the initial HTML so it paints before hydration (there is nothing to cover
 * the load with if it arrives after it), and as a direct child of <body> it has
 * no transformed ancestor. Inside the hero it was a `fixed` element inside an
 * `overflow-hidden` section inside a `[data-elastic]` band, and the first frame
 * of scroll velocity gave that band a transform — which makes it the containing
 * block for the "full-bleed" panel and clips it to the section.
 *
 * Site-wide, not home-only: someone arriving on a project page from a shared
 * link is loading the same fonts over the same connection. It marks the tab as
 * seen either way, so the opening happens once and never again in that tab.
 */
export default function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const lenis = useLenis();

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;

      const mm = gsap.matchMedia();

      mm.add(MOTION_OK, () => {
        // Already played in this tab. CSS has it hidden before paint; this is
        // for the case where the attribute that CSS keys off has been reset out
        // from under it (React's dev remount does exactly that), and it opens
        // the gate immediately so nothing downstream waits on a preloader that
        // is never going to run.
        if (introSeen() || revealStarted()) {
          gsap.set(el, { display: "none" });
          beginReveal();
          return;
        }

        const group = el.querySelector<HTMLElement>("[data-preloader-group]");
        const fill = el.querySelector<HTMLElement>("[data-preloader-fill]");
        const count = el.querySelector<HTMLElement>("[data-preloader-count]");
        const panels = Array.from(
          el.querySelectorAll<HTMLElement>("[data-preloader-panel]"),
        );
        if (!group || !fill || !count || panels.length !== 2) return;

        // Re-bound with the narrowed type. `tick` below is a hoisted `function`
        // declaration, so TypeScript cannot prove it does not run before the guard
        // above and resets the null-narrowing of anything it captures. These two
        // are declared `HTMLElement` outright, so there is no narrowing left to
        // lose — and the guard stays the single place the absence is handled.
        const bar: HTMLElement = fill;
        const readout: HTMLElement = count;

        // ── The exit ─────────────────────────────────────────────────────────
        //
        // Built paused and played by the gate below, so the sequence has one
        // trigger and it is "the page is ready" rather than "this component
        // mounted".
        const exit = gsap.timeline({
          paused: true,
          defaults: { ease: EASE_GSAP },
        });

        exit
          // The name leaves before the panels do, so the reveal is the panels
          // parting rather than a wordmark riding one of them off-screen.
          .to(
            group,
            { yPercent: -18, opacity: 0, duration: 0.5 },
            INTRO.exit.mark,
          )
          // The seams light up as the name goes. They are held at zero until
          // now on purpose: a vermilion hairline across the middle of the
          // screen would otherwise run straight through the wordmark.
          .to(
            "[data-preloader-seam]",
            { opacity: 1, duration: 0.3 },
            INTRO.exit.mark,
          )
          // One tween, not two, so the halves can never drift apart by a frame.
          // expo.inOut rather than expo.out: panels this size need to gather
          // speed before they leave, or the first third of the move reads as a
          // stall.
          .to(
            panels,
            {
              yPercent: (i: number) => (i === 0 ? -100 : 100),
              duration: INTRO.exit.partDuration,
              ease: "expo.inOut",
              // The site opens here — the hero assembles *while* the panels are
              // still travelling, so the reveal shows motion in progress
              // instead of a finished screen sliding into view.
              onStart: beginReveal,
            },
            INTRO.exit.part,
          )
          // Out of the layer tree the moment it is off-screen: a full-viewport
          // fixed element left behind is a compositing layer every later frame
          // pays for.
          .set(el, { display: "none" });

        // ── The wait ─────────────────────────────────────────────────────────
        //
        // `ready` only ever rises, and only the ticker below decides anything.
        // That is deliberate: with one decision point there is no race between
        // a signal landing, a timeout firing and a minimum hold expiring, and
        // no timer to clear on unmount.
        let ready = 0;

        if (document.readyState === "complete") {
          // Mandatory. On a warm cache `load` has already fired by the time
          // this effect runs, and a listener added afterwards never sees it —
          // which is a preloader that hangs on exactly the fastest visits.
          ready += WEIGHT.load;
        } else {
          window.addEventListener(
            "load",
            () => {
              ready += WEIGHT.load;
            },
            { once: true },
          );
        }

        // Resolves as soon as every face either loads or gives up, so a font CDN
        // that never answers costs at most the `maxWait` ceiling.
        document.fonts.ready.then(() => {
          ready += WEIGHT.fonts;
        });

        // Queried from the document, not this component's scope: the covers
        // belong to the hero. They are `loading="eager"` there, so this waits
        // for them rather than causing them.
        const covers = document.querySelectorAll<HTMLImageElement>(
          "[data-intro='ribbon'] img",
        );
        if (!covers.length) {
          ready += WEIGHT.covers;
        } else {
          let left = covers.length;
          const settled = () => {
            if (--left === 0) ready += WEIGHT.covers;
          };
          // `decode()`, not `onload`: decoding is the part that would otherwise
          // happen on the frame the cover fades in. It rejects on a broken or
          // detached image — counted either way, because a cover that will
          // never arrive must not hold the gate.
          covers.forEach((img) => img.decode().then(settled, settled));
        }

        let shown = 0;
        let printed = -1;
        /** Seconds since navigation when the gate resolved; -1 while waiting. */
        let resolvedAt = -1;
        /** Where the bar was at that moment, so the run-out starts from it. */
        let resolvedFrom = 0;

        function tick(_time: number, deltaTime: number) {
          // Elapsed is measured from *navigation*, not from mount. The 2s
          // ceiling is a promise to the visitor about how long they can be kept
          // waiting, and hydration is part of that wait — starting the clock at
          // mount would let a slow load spend its budget twice.
          const elapsed = performance.now() / 1000;

          if (resolvedAt < 0) {
            if (elapsed >= INTRO.load.minHold && ready >= 1) resolve(elapsed);
            else if (elapsed >= INTRO.load.maxWait) resolve(elapsed);
          }

          if (resolvedAt < 0) {
            // The elapsed-time floor. A bar that stops moving reads as a crash
            // even when the load genuinely has stalled, so time itself always
            // contributes something.
            const target = Math.min(
              CEILING,
              Math.max(ready, elapsed / INTRO.load.maxWait),
            );
            if (target > shown) {
              // Delta-scaled so the approach looks the same at 60 and 144Hz.
              const frames = Math.min(deltaTime, 50) / (1000 / 60);
              shown += (target - shown) * (1 - Math.pow(1 - LERP, frames));
            }
          } else {
            // Resolved: run out to exactly 1 over `settle`. Linear, and not a
            // lerp, because a lerp only ever approaches 100% and the last thing
            // this number should do is stop at 99.
            const k = Math.min(1, (elapsed - resolvedAt) / INTRO.load.settle);
            shown = resolvedFrom + (1 - resolvedFrom) * k;
            if (k === 1) gsap.ticker.remove(tick);
          }

          // Written straight to the element, and the text only when the integer
          // actually changes — the same discipline as ElasticProvider. The bar
          // and the group are separate elements on purpose, so the ticker and
          // the exit timeline are never two writers of one transform.
          bar.style.transform = `scaleX(${shown})`;
          const pct = Math.round(shown * 100);
          if (pct !== printed) {
            printed = pct;
            readout.textContent = `${pct}%`;
          }
        }

        function resolve(elapsed: number) {
          resolvedAt = elapsed;
          resolvedFrom = shown;
          // Written here rather than when the sequence ends: a reload partway
          // through the exit is still a visit that has seen the opening.
          markIntroSeen();
          exit.play();
        }

        gsap.ticker.add(tick);
        return () => gsap.ticker.remove(tick);
      });

      // Reduced motion: there is no preloader (see globals.css) and nothing is
      // waiting on it, since every gated animation lives in a MOTION_OK block
      // too — but the signal is published anyway so that a future subscriber
      // outside that gate can never be left holding a hidden element.
      mm.add("(prefers-reduced-motion: reduce)", () => beginReveal());
    },
    { scope: root },
  );

  /**
   * Scroll is held for the length of the intro.
   *
   * Not for the panels' sake — as a child of <body> they cannot be clipped by a
   * scrolling ancestor any more — but because scrolling behind a covered screen
   * means the ScrollTriggers of a hero nobody has seen yet fire while it is
   * still hidden, and the panels then open onto the middle of the page.
   *
   * Released on the reveal rather than at the end of the exit, so the site is
   * scrollable from the moment it is visible. Its own effect keyed on `lenis`
   * because `useLenis()` is null on the first render, and re-running the GSAP
   * setup for that would restart the sequence.
   */
  useEffect(() => {
    if (!lenis || introSeen() || revealStarted()) return;
    if (!window.matchMedia(MOTION_OK).matches) return;

    lenis.stop();
    // `force`, because a stopped Lenis ignores an ordinary scrollTo. Belt to
    // the inline script's `scrollRestoration = "manual"` braces: a reload
    // partway down the page must not open the panels onto the footer.
    lenis.scrollTo(0, { immediate: true, force: true });

    const off = onRevealStart(() => lenis.start());
    return () => {
      off();
      lenis.start();
    };
  }, [lenis]);

  return (
    <div
      ref={root}
      data-preloader
      // Removed from the a11y tree and non-interactive: this is a transition,
      // not content, and it must never eat the first click. z-70 puts it over
      // the grain (50) and the header (40) — everything, briefly.
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[70]"
    >
      {/* The two halves. Each carries a vermilion hairline on the edge it parts
          along, so the reveal is two bright lines travelling away from the
          middle of the screen. */}
      <div
        data-preloader-panel
        className="bg-paper absolute inset-x-0 top-0 h-1/2 will-change-transform"
      >
        <span
          data-preloader-seam
          className="bg-signal absolute inset-x-0 bottom-0 h-px opacity-0"
        />
      </div>
      <div
        data-preloader-panel
        className="bg-paper absolute inset-x-0 bottom-0 h-1/2 will-change-transform"
      >
        <span
          data-preloader-seam
          className="bg-signal absolute inset-x-0 top-0 h-px opacity-0"
        />
      </div>

      {/* Centred across the seam, and last in the DOM so it paints over both
          panels. This group is what the exit timeline moves; the bar's inner
          span is what the ticker writes. */}
      <div
        data-preloader-group
        className="absolute inset-0 flex flex-col items-center justify-center"
      >
        <p className="font-display text-2xl tracking-tight md:text-3xl">
          {CONTACT.shortName}
          <span className="text-signal">.</span>
        </p>
        <span className="bg-ink/15 relative mt-4 block h-px w-[min(38vw,320px)] overflow-hidden">
          {/* The transform is inline rather than a `scale-x-0` utility: Tailwind
              v4 writes those to the `scale` property, which would then multiply
              whatever this element's `transform` says by zero for good. */}
          <span
            data-preloader-fill
            className="bg-ink absolute inset-0 origin-left"
            style={{ transform: "scaleX(0)" }}
          />
        </span>
        <p
          data-preloader-count
          className="text-ink-muted mt-3 font-mono text-[0.625rem] tracking-[0.2em] tabular-nums"
        >
          0%
        </p>
      </div>
    </div>
  );
}
