"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { intro } from "@/lib/intro";
import { CONTACT } from "@/lib/nav";
import { cn } from "@/lib/utils";

/**
 * The hero, twice.
 *
 * On top: the finished thing — one statement, set big and composed like a
 * poster. Underneath, in the same places: how it's made — the same words as
 * outlines with their type specs, the layout grid, and the schema, request
 * and component that would sit behind a page like this.
 *
 * The pointer is a lens onto the underneath. Without a pointer (a phone, or
 * the pointer resting elsewhere) the lens drifts on its own, so the idea
 * still reads; touching the hero drags it.
 */

const LINES = [
  { text: "I build", spec: "h1 · Anybody 800 · wdth 64" },
  { text: "the whole", spec: "line 2 · tracking −1.2%" },
  { text: "thing.", spec: "em.turn · wdth 128 · italic" },
] as const;

export default function XRayHero() {
  const root = useRef<HTMLElement>(null);
  const xray = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const under = xray.current!;
      const lens = ring.current!;
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

      // --- Entrance ---------------------------------------------------------
      const words = el.querySelectorAll("[data-line] > span");
      const bits = el.querySelectorAll("[data-bit]");
      gsap.set(words, { yPercent: 110 });
      gsap.set(bits, { autoAlpha: 0, y: 10 });
      const state = { r: 0 };
      const offIntro = intro.onReveal(() => {
        const tl = gsap.timeline({ delay: 0.25 });
        tl.to(words, {
          yPercent: 0,
          duration: reduced ? 0.01 : 1.3,
          ease: "expo.out",
          stagger: 0.1,
        });
        tl.to(
          bits,
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.9,
            ease: "expo.out",
            stagger: 0.06,
          },
          0.5,
        );
        // The lens opens once the words have landed.
        tl.to(
          state,
          { r: 1, duration: reduced ? 0.01 : 1.1, ease: "expo.out" },
          0.9,
        );
      });

      // --- The lens ---------------------------------------------------------
      const pos = { x: 0, y: 0 };
      const target = { x: 0, y: 0 };
      let lastMove = -1e9;
      let dragging = false;

      const local = (cx: number, cy: number) => {
        const r = el.getBoundingClientRect();
        return { x: cx - r.left, y: cy - r.top };
      };
      const onMove = (e: PointerEvent) => {
        if (e.pointerType === "touch" && !dragging) return;
        const p = local(e.clientX, e.clientY);
        target.x = p.x;
        target.y = p.y;
        lastMove = performance.now();
      };
      const onDown = (e: PointerEvent) => {
        if (e.pointerType !== "touch") return;
        dragging = true;
        onMove(e);
      };
      const onUp = () => {
        dragging = false;
      };
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerdown", onDown);
      window.addEventListener("pointerup", onUp);

      let visible = true;
      const io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
      });
      io.observe(el);

      const start = performance.now();
      pos.x = el.clientWidth * 0.6;
      pos.y = el.clientHeight * 0.5;
      const tick = (_t: number, dt: number) => {
        if (!visible) return;
        const w = el.clientWidth;
        const h = el.clientHeight;
        const idle = performance.now() - lastMove > (fine ? 2200 : 3500);
        if (idle) {
          // Drift: a slow figure-of-eight across the statement.
          const t = (performance.now() - start) / 1000;
          target.x = w * (0.5 + 0.3 * Math.sin(t * 0.32));
          target.y = h * (0.48 + 0.16 * Math.sin(t * 0.64));
        }
        const k = 1 - Math.exp(-(dt / 1000) * (idle ? 2.2 : 9));
        pos.x += (target.x - pos.x) * k;
        pos.y += (target.y - pos.y) * k;
        const base = Math.min(w, h) * (w < 768 ? 0.3 : 0.22);
        const r = base * state.r;
        under.style.clipPath = `circle(${r.toFixed(1)}px at ${pos.x.toFixed(1)}px ${pos.y.toFixed(1)}px)`;
        lens.style.transform = `translate(${pos.x - r}px, ${pos.y - r}px)`;
        lens.style.width = lens.style.height = `${(r * 2).toFixed(1)}px`;
      };
      gsap.ticker.add(tick);

      return () => {
        gsap.ticker.remove(tick);
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerdown", onDown);
        window.removeEventListener("pointerup", onUp);
        io.disconnect();
        offIntro();
      };
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="top"
      aria-labelledby="hero-title"
      className="relative h-svh min-h-[36rem] touch-pan-y overflow-hidden select-none"
    >
      <Layer variant="surface" />
      <div
        ref={xray}
        aria-hidden="true"
        className="absolute inset-0"
        style={{ clipPath: "circle(0px at 50% 50%)" }}
      >
        <Layer variant="xray" />
      </div>
      {/* The lens's rim, and its name. */}
      <div
        ref={ring}
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 rounded-full border border-[color-mix(in_oklab,var(--accent)_55%,transparent)] shadow-[0_0_0_1px_rgba(0,0,0,0.4),0_30px_80px_-20px_rgba(0,0,0,0.8)]"
      >
        <span className="label text-accent absolute top-full left-1/2 mt-3 -translate-x-1/2 text-[9px] whitespace-nowrap">
          How it&rsquo;s built
        </span>
      </div>
    </section>
  );
}

/**
 * One composition, drawn as the finished page or as its x-ray. Both share
 * exactly the same boxes and type, so the lens lines up to the pixel.
 */
function Layer({ variant }: { variant: "surface" | "xray" }) {
  const x = variant === "xray";
  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col px-4 pt-24 pb-14 md:px-10 md:pt-28 md:pb-20",
        x ? "xray-field text-accent" : "bg-paper text-ink",
      )}
    >
      {/* Top row */}
      <div className="label flex items-start justify-between gap-6">
        <p data-bit className={x ? "" : "text-ink-muted"}>
          {x ? "<header> · grid 12 col · gutter 40" : "Portfolio — 2026"}
        </p>
        <p data-bit className={cn("text-right", x ? "" : "text-ink-muted")}>
          {x ? "viewport 100svh · dark · iris" : `${CONTACT.location} · Remote`}
        </p>
      </div>

      {/* The statement */}
      <div className="relative flex flex-1 flex-col justify-center">
        {x && <SidePieces />}
        <h1
          id={x ? undefined : "hero-title"}
          aria-hidden={x || undefined}
          className="display relative text-[clamp(4.25rem,min(22vw,14vh),17rem)] leading-[0.84] md:text-[clamp(4.25rem,min(15.5vw,21vh),17rem)]"
        >
          {LINES.map((l, i) => (
            <span
              key={l.text}
              data-line
              className={cn(
                "relative block overflow-clip pb-[0.04em]",
                i === 1 && "pl-[0.35em] md:pl-[0.9em]",
              )}
            >
              <span
                className={cn(
                  "block",
                  i === 2 && "turn",
                  x && "outline-accent",
                )}
              >
                {l.text}
              </span>
              {x && (
                <>
                  {/* Baseline and cap-height guides, and the spec. */}
                  <span className="absolute inset-x-0 bottom-[0.2em] h-px bg-[color-mix(in_oklab,var(--accent)_45%,transparent)]" />
                  <span className="absolute inset-x-0 top-[0.13em] h-px border-t border-dashed border-[color-mix(in_oklab,var(--accent)_30%,transparent)]" />
                  <span className="label absolute bottom-[0.24em] left-0 -translate-y-1 text-[clamp(8px,0.65vw,10px)] tracking-[0.06em] normal-case">
                    {l.spec}
                  </span>
                </>
              )}
            </span>
          ))}
        </h1>
      </div>

      {/* Bottom row */}
      <div className="grid gap-6 md:grid-cols-12 md:items-end md:gap-x-10">
        <p
          data-bit
          className={cn(
            "max-w-[38ch] text-[clamp(1rem,1.25vw,1.2rem)] leading-snug tracking-[-0.01em] md:col-span-5",
            x ? "font-mono text-[0.8rem] leading-relaxed" : "text-ink-muted",
          )}
        >
          {x ? (
            <>
              {"<p> "}schema → API → interface → polish{" </p>"}
              <br />
              {"// one person, every layer"}
            </>
          ) : (
            <>
              I&rsquo;m <span className="text-ink">Chijioke — CJ</span>. I
              design the data, wire the API, and sweat the interface until it
              feels obvious.
            </>
          )}
        </p>
        <div
          data-bit
          className="label flex items-center gap-5 md:col-span-4 md:col-start-9 md:justify-end"
        >
          {x ? (
            <span>{'<a href="#build"> · status: open'}</span>
          ) : (
            <>
              {CONTACT.available && (
                <span className="text-accent inline-flex items-center gap-2">
                  <span className="bg-accent h-1.5 w-1.5 animate-pulse rounded-full" />
                  Open to work
                </span>
              )}
              <a
                href="#build"
                className="text-ink-muted hover:text-ink flex items-center gap-3 transition-colors"
              >
                <span className="bg-ink-faint relative block h-6 w-px overflow-hidden">
                  <span className="bg-accent absolute inset-x-0 top-0 h-1/2 animate-[drip_1.8s_ease-in-out_infinite]" />
                </span>
                See how
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** What the lens finds beside the words: the layers behind the page. */
function SidePieces() {
  return (
    <div className="pointer-events-none absolute inset-0 font-mono text-[clamp(9.5px,0.78vw,12px)] leading-[1.65]">
      <Piece className="top-[4%] right-0" title="schema.sql">
        {`create table projects (
  id        uuid primary key,
  title     text not null,
  shipped   boolean default false
);`}
      </Piece>
      <Piece className="top-[38%] right-[4%] hidden md:block" title="api">
        {`GET /projects?shipped=true
→ 200 · 7 rows · 38ms`}
      </Piece>
      <Piece className="right-0 bottom-[2%]" title="Hero.tsx">
        {`export function Hero() {
  return <h1>I build the whole thing.</h1>
}`}
      </Piece>
    </div>
  );
}

function Piece({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: string;
}) {
  return (
    <figure
      className={cn(
        "absolute border border-[color-mix(in_oklab,var(--accent)_30%,transparent)] bg-[color-mix(in_oklab,var(--paper)_70%,transparent)]",
        className,
      )}
    >
      <figcaption className="border-b border-[color-mix(in_oklab,var(--accent)_30%,transparent)] px-3 py-1.5 opacity-70">
        {title}
      </figcaption>
      <pre className="px-3 py-2.5 whitespace-pre">{children}</pre>
    </figure>
  );
}
