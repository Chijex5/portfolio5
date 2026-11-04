"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { intro } from "@/lib/intro";
import { cn } from "@/lib/utils";

/** The display face's width axis at rest (unless capped, see `maxHeight`),
 * and how far a letter may move. */
const WDTH = 100;
const WDTH_RANGE = 140;
/** Weight at rest, and how far a letter may move. */
const WGHT = 760;
const WGHT_RANGE = 420;

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

/**
 * A word set across the full width of its box in the display face, whose
 * letters breathe on its two variable axes. Near the pointer a letter lets
 * itself out wide and heavy; away from it, letters draw in. With no pointer
 * (touch, or the pointer elsewhere) a slow wave runs through instead.
 *
 * Two things keep the word exactly edge to edge while it moves: letters sit
 * on `justify-between`, so the gaps absorb small changes; and every letter's
 * change is measured from the average, so as one grows the rest give the
 * same room back and the total width barely moves.
 */
export default function LivingWord({
  text,
  accents = [],
  label,
  enter = "intro",
  maxHeight,
  narrow = 100,
  className,
}: {
  text: string;
  /** Indices of letters set in the accent colour. */
  accents?: number[];
  /** What a screen reader hears; defaults to the text. */
  label?: string;
  /** Rise in with the page's intro, or when scrolled to. */
  enter?: "intro" | "scroll";
  /**
   * Cap the type size at this share of the viewport height. When the cap
   * bites, the letters are set wider instead (the width axis), so the word
   * still spans its box rather than leaving a gap.
   */
  maxHeight?: number;
  /**
   * The width axis value the word rests at. Lower is narrower and so,
   * filling the same line, taller.
   */
  narrow?: number;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLDivElement>(null);
  const chars = [...text];

  useGSAP(
    () => {
      const el = box.current!;
      const row = line.current!;
      const glyphs = gsap.utils.toArray<HTMLElement>("[data-glyph]", el);
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const finePointer = matchMedia(
        "(hover: hover) and (pointer: fine)",
      ).matches;

      const setAxes = (g: HTMLElement, w: number, wg: number) => {
        g.style.fontStretch = `${w.toFixed(1)}%`;
        g.style.fontWeight = String(Math.round(wg));
      };

      // --- Fit: size the type so the word at rest spans the box ------------
      // Then measure every letter at a 3 × 3 grid of width and weight, so
      // each frame can predict the word's total width without touching
      // layout — see `solve` below.
      // The width the word rests at: normally WDTH, wider when capped.
      let rest = WDTH;
      let WD = [50, rest, 150];
      const WG = [300, WGHT, 900];
      let table: number[][][] = [];
      let total = 0;
      let centers: number[] = [];
      const fit = () => {
        const measure = (wd: number) => {
          glyphs.forEach((g) => setAxes(g, wd, WGHT));
          return row.getBoundingClientRect().width;
        };
        row.style.fontSize = "100px";
        row.style.width = "max-content";
        const want = el.clientWidth * 0.985;
        let size = (want / measure(narrow)) * 100;
        rest = narrow;
        const cap = maxHeight ? window.innerHeight * maxHeight : Infinity;
        if (size > cap) {
          // Set at the cap, and find the width axis value that fills the
          // line there (a few steps of bisection; width grows with wdth).
          size = cap;
          const need = (want / size) * 100;
          let lo = narrow;
          let hi = 150;
          for (let k = 0; k < 7; k++) {
            const mid = (lo + hi) / 2;
            if (measure(mid) < need) lo = mid;
            else hi = mid;
          }
          rest = lo;
        }
        WD = [50, rest, 150];
        row.style.fontSize = `${size}px`;
        table = glyphs.map(() => WD.map(() => WG.map(() => 0)));
        WD.forEach((wd, a) =>
          WG.forEach((wg, b) => {
            glyphs.forEach((g) => setAxes(g, wd, wg));
            glyphs.forEach((g, i) => {
              table[i][a][b] = g.getBoundingClientRect().width;
            });
          }),
        );
        glyphs.forEach((g) => setAxes(g, rest, WGHT));
        total = table.reduce((sum, t) => sum + t[1][1], 0);
        row.style.width = "";
        const left = el.getBoundingClientRect().left;
        centers = glyphs.map((g) => {
          const r = g.getBoundingClientRect();
          return r.left - left + r.width / 2;
        });
      };
      /** A letter's width at (wd, wg), interpolated from the grid. */
      const widthAt = (i: number, wd: number, wg: number) => {
        const a = wd <= rest ? 0 : 1;
        const b = wg <= WGHT ? 0 : 1;
        const u = (wd - WD[a]) / (WD[a + 1] - WD[a]);
        const v = (wg - WG[b]) / (WG[b + 1] - WG[b]);
        const t = table[i];
        return (
          t[a][b] * (1 - u) * (1 - v) +
          t[a + 1][b] * u * (1 - v) +
          t[a][b + 1] * (1 - u) * v +
          t[a + 1][b + 1] * u * v
        );
      };
      fit();
      const ro = new ResizeObserver(fit);
      ro.observe(el);
      document.fonts.ready.then(fit);

      // --- Entrance: letters rise out of their masks ------------------------
      const rise = () =>
        gsap.fromTo(
          glyphs,
          { yPercent: 108 },
          {
            yPercent: 0,
            duration: reduced ? 0.01 : 1.25,
            ease: "expo.out",
            stagger: 0.055,
          },
        );
      gsap.set(glyphs, { yPercent: 108 });
      let offIntro = () => {};
      if (enter === "intro") {
        offIntro = intro.onReveal(() => rise().delay(0.1));
      } else {
        gsap
          .timeline({
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          })
          .add(rise());
      }

      if (reduced) {
        return () => {
          ro.disconnect();
          offIntro();
        };
      }

      // --- The breath ---------------------------------------------------------
      const n = glyphs.length;
      const target = new Array<number>(n).fill(0.5);
      const shown = new Array<number>(n).fill(0.5);
      const wd = new Array<number>(n).fill(rest);
      const wg = new Array<number>(n).fill(WGHT);
      const pointer = { x: 0, inside: false, last: 0 };
      const section = el.closest("section") ?? el;

      const move = (e: PointerEvent) => {
        if (e.pointerType === "touch") return;
        const r = section.getBoundingClientRect();
        pointer.inside =
          e.clientY >= r.top && e.clientY <= r.bottom && r.bottom > 0;
        pointer.x = e.clientX - el.getBoundingClientRect().left;
        pointer.last = performance.now();
      };
      if (finePointer) window.addEventListener("pointermove", move);

      let visible = false;
      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
      });
      io.observe(el);

      const tick = (time: number, dt: number) => {
        if (!visible) return;
        const active =
          finePointer &&
          pointer.inside &&
          performance.now() - pointer.last < 2500;
        const sigma = el.clientWidth * 0.15;
        for (let i = 0; i < n; i++) {
          if (active) {
            const d = (pointer.x - centers[i]) / sigma;
            target[i] = Math.exp(-d * d);
          } else {
            // Idle: a slow wave rolling left to right.
            target[i] = 0.5 + 0.24 * Math.sin(time * 1.1 - i * 0.7);
          }
        }
        const k = 1 - Math.exp(-(dt / 1000) * (active ? 7 : 3));
        let mean = 0;
        for (let i = 0; i < n; i++) {
          shown[i] += (target[i] - shown[i]) * k;
          mean += shown[i];
        }
        mean /= n;
        // Each letter's own swing, then one shared width offset found by a
        // few Newton steps so the predicted total equals the resting total:
        // the word stays exactly edge to edge however the letters move.
        for (let i = 0; i < n; i++) {
          const dv = shown[i] - mean;
          wd[i] = rest + WDTH_RANGE * dv;
          wg[i] = clamp(WGHT + WGHT_RANGE * dv, 300, 900);
        }
        let c = 0;
        for (let it = 0; it < 3; it++) {
          let sum = 0;
          let slope = 0;
          for (let i = 0; i < n; i++) {
            const w = clamp(wd[i] + c, 50, 150);
            sum += widthAt(i, w, wg[i]);
            if (w > 50 && w < 150)
              slope +=
                (widthAt(i, Math.min(150, w + 1), wg[i]) -
                  widthAt(i, Math.max(50, w - 1), wg[i])) /
                2;
          }
          if (slope <= 0) break;
          c += (total - sum) / slope;
        }
        for (let i = 0; i < n; i++)
          setAxes(glyphs[i], clamp(wd[i] + c, 50, 150), wg[i]);
      };
      gsap.ticker.add(tick);

      return () => {
        gsap.ticker.remove(tick);
        window.removeEventListener("pointermove", move);
        io.disconnect();
        ro.disconnect();
        offIntro();
      };
    },
    { scope: box, dependencies: [text, maxHeight, narrow] },
  );

  return (
    <div ref={box} className={cn("relative w-full overflow-x-clip", className)}>
      {label !== "" && <span className="sr-only">{label ?? text}</span>}
      <div
        ref={line}
        aria-hidden="true"
        className="display flex justify-between whitespace-pre select-none"
        style={{ lineHeight: 0.8 }}
      >
        {chars.map((ch, i) => (
          <span key={i} className="block overflow-clip pt-[0.04em] pb-[0.06em]">
            <span
              data-glyph
              className={cn(
                "block will-change-transform",
                accents.includes(i) && "text-accent",
              )}
            >
              {ch}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
