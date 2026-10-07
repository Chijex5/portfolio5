"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { voltiq as copy } from "@/lib/scenes/voltiq";
import { rng } from "@/lib/stage/shapes";
import { useCamera } from "../SceneFrame";
import type { SceneProps } from "./types";
import { count, Panel } from "./ui";

/**
 * VoltIq, acted out on a night map of Nsukka: every lit window is a home. One
 * neighbourhood goes dark, the reports pour in, a crew drives over, the light
 * comes back, and tomorrow's forecast warns the next street.
 */

type Area = { x: number; y: number; r: number; n: number };
const AREAS: Record<string, Area> = {
  odenigwe: { x: 400, y: 205, r: 62, n: 70 },
  odim: { x: 150, y: 150, r: 52, n: 50 },
  onuiyi: { x: 215, y: 330, r: 58, n: 55 },
  unn: { x: 480, y: 370, r: 58, n: 55 },
  ogige: { x: 300, y: 105, r: 46, n: 40 },
};

type Home = {
  x: number;
  y: number;
  w: number;
  h: number;
  o: number;
  area: string;
};

/**
 * Two decimals. Math.cos/sin can differ in the last digit between the server's
 * engine and the browser's, which would make the SSR'd SVG fail hydration.
 */
const r2 = (v: number) => Math.round(v * 100) / 100;

/** Homes, laid out once from a fixed seed so the map is the same every visit. */
const HOMES: Home[] = (() => {
  const r = rng(7);
  const out: Home[] = [];
  for (const [area, a] of Object.entries(AREAS)) {
    for (let i = 0; i < a.n; i++) {
      const t = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * a.r;
      out.push({
        x: r2(a.x + Math.cos(t) * d),
        y: r2(a.y + Math.sin(t) * d * 0.8),
        w: r2(3 + r() * 6),
        h: r2(3 + r() * 4),
        o: r2(0.45 + r() * 0.5),
        area,
      });
    }
  }
  for (let i = 0; i < 90; i++) {
    out.push({
      x: r2(r() * 600),
      y: r2(r() * 460),
      w: r2(3 + r() * 4),
      h: r2(3 + r() * 3),
      o: r2(0.25 + r() * 0.4),
      area: "",
    });
  }
  return out;
})();

/** Report pins scattered over the dark neighbourhood. */
const PINS = (() => {
  const r = rng(19);
  const a = AREAS.odenigwe;
  return Array.from({ length: copy.reports }, () => {
    const t = r() * Math.PI * 2;
    const d = 14 + Math.sqrt(r()) * (a.r + 12);
    return { x: r2(a.x + Math.cos(t) * d), y: r2(a.y + Math.sin(t) * d * 0.8) };
  });
})();

const ROADS = [
  "M -10 430 C 150 360, 260 300, 330 250 S 520 120, 610 70",
  "M 60 -10 C 120 120, 160 240, 240 470",
  "M 290 -10 C 330 120, 420 260, 610 330",
  "M -10 200 C 120 210, 260 190, 380 120 S 520 40, 610 30",
  "M 330 470 C 360 400, 420 330, 610 250",
];

/** The crew's drive: substation, along Enugu Road, into Odenigwe. */
const ROUTE: [number, number][] = [
  [80, 405],
  [170, 362],
  [262, 304],
  [330, 252],
  [372, 226],
  [398, 212],
];
const AMBER = "#f2b45a";
const VIOLET = "#8f7dff";
const GREEN = "#3fbf6f";

export default function VoltiqScene({ register }: SceneProps) {
  const root = useRef<HTMLDivElement>(null);
  const camera = useCamera();

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const tl = gsap.timeline({
        paused: true,
        defaults: { ease: "power3.out", duration: 0.2 },
      });
      const times = q("[data-time]");
      const showTime = (k: number, at: number) => {
        tl.to(times, { autoAlpha: 0, duration: 0.05 }, at);
        tl.to(times[k], { autoAlpha: 1, duration: 0.08 }, at + 0.05);
      };

      tl.set(camera, { x: 400 }, 0);
      tl.fromTo(
        q("[data-map]"),
        { autoAlpha: 0, scale: 1.06 },
        { autoAlpha: 1, scale: 1, duration: 0.35 },
        0,
      );
      tl.fromTo(times, { autoAlpha: 0 }, { autoAlpha: 0, duration: 0.01 }, 0);
      tl.to(times[0], { autoAlpha: 1, duration: 0.1 }, 0.2);

      // --- 0 · The light goes ----------------------------------------------
      tl.fromTo(
        q("[data-flash]"),
        { autoAlpha: 0, scale: 0.4 },
        { autoAlpha: 0.9, scale: 1.4, duration: 0.06 },
        0.38,
      );
      tl.to(q("[data-flash]"), { autoAlpha: 0, duration: 0.12 }, 0.44);
      tl.fromTo(
        q("[data-out]"),
        { opacity: (i, el) => Number(el.getAttribute("data-o")) },
        { opacity: 0.08, duration: 0.18, stagger: 0.001 },
        0.42,
      );
      tl.fromTo(
        q("[data-out-glow]"),
        { opacity: 1 },
        { opacity: 0, duration: 0.2 },
        0.42,
      );
      tl.fromTo(
        q("[data-dark-pill]"),
        { autoAlpha: 0, y: 8 },
        { autoAlpha: 1, y: 0, duration: 0.12, ease: "back.out(2)" },
        0.6,
      );

      // --- 1 · Neighbours report it ----------------------------------------
      showTime(1, 1);
      tl.fromTo(
        q("[data-pin]"),
        { autoAlpha: 0, scale: 0 },
        {
          autoAlpha: 1,
          scale: 1,
          duration: 0.06,
          stagger: 0.01,
          ease: "back.out(3)",
        },
        1.05,
      );
      tl.fromTo(
        q("[data-reports]"),
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 0.15 },
        1.05,
      );
      count(tl, q("[data-report-count]")[0], 1, copy.reports, 1.05, 0.5);

      // --- 2 · A crew is already moving ------------------------------------
      showTime(2, 2);
      tl.to(camera, { x: 300, duration: 0.25, ease: "power2.inOut" }, 2);
      tl.to(q("[data-reports]"), { autoAlpha: 0, y: 10, duration: 0.1 }, 2);
      tl.fromTo(
        q("[data-console]"),
        { autoAlpha: 0, x: -20 },
        { autoAlpha: 1, x: 0, duration: 0.18 },
        2.05,
      );
      tl.fromTo(
        q("[data-station]"),
        { autoAlpha: 0, scale: 0.6 },
        { autoAlpha: 1, scale: 1, duration: 0.1 },
        2.12,
      );
      tl.fromTo(
        q("[data-route]"),
        { strokeDashoffset: 1 },
        { strokeDashoffset: 0, duration: 0.5, ease: "power1.inOut" },
        2.2,
      );
      tl.fromTo(
        q("[data-truck]"),
        { autoAlpha: 0, x: ROUTE[0][0], y: ROUTE[0][1] },
        { autoAlpha: 1, duration: 0.06 },
        2.2,
      );
      tl.to(
        q("[data-truck]"),
        {
          keyframes: ROUTE.slice(1).map(([x, y]) => ({ x, y })),
          duration: 0.5,
          ease: "power1.inOut",
        },
        2.2,
      );

      // --- 3 · Next time, a warning first ----------------------------------
      showTime(3, 3.35);
      tl.to(
        q("[data-out]"),
        {
          opacity: (i, el) => Number(el.getAttribute("data-o")),
          duration: 0.18,
          stagger: 0.001,
        },
        3,
      );
      tl.to(q("[data-out-glow]"), { opacity: 1, duration: 0.2 }, 3);
      tl.to(q("[data-pin]"), { autoAlpha: 0, duration: 0.1 }, 3);
      tl.to(q("[data-dark-pill]"), { autoAlpha: 0, duration: 0.06 }, 3);
      tl.fromTo(
        q("[data-lit-pill]"),
        { autoAlpha: 0, y: 8 },
        { autoAlpha: 1, y: 0, duration: 0.12, ease: "back.out(2)" },
        3.05,
      );
      tl.to(
        q("[data-console], [data-route], [data-truck], [data-station]"),
        { autoAlpha: 0, duration: 0.12 },
        3.3,
      );
      tl.to(q("[data-lit-pill]"), { autoAlpha: 0, duration: 0.1 }, 3.38);
      tl.to(camera, { x: 265, duration: 0.25, ease: "power2.inOut" }, 3.35);
      tl.fromTo(
        q("[data-forecast]"),
        { autoAlpha: 0, scale: 0.5 },
        { autoAlpha: 1, scale: 1, duration: 0.2 },
        3.42,
      );
      tl.fromTo(
        q("[data-forecast-pill]"),
        { autoAlpha: 0, y: 8 },
        { autoAlpha: 1, y: 0, duration: 0.12, ease: "back.out(2)" },
        3.52,
      );
      tl.fromTo(
        q("[data-note]"),
        { autoAlpha: 0, y: -20 },
        { autoAlpha: 1, y: 0, duration: 0.18, ease: "back.out(1.4)" },
        3.6,
      );

      tl.set({}, {}, copy.steps.length);
      register(tl);
    },
    { scope: root },
  );

  const o = AREAS.odenigwe;
  const f = AREAS.odim;
  return (
    <div ref={root} className="text-bone relative h-full w-full text-[12px]">
      <Panel data-map className="inset-0 overflow-hidden bg-[#0d0c0b]">
        <svg
          viewBox="0 0 600 460"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="vq-glow">
              <stop offset="0" stopColor={AMBER} stopOpacity="0.32" />
              <stop offset="1" stopColor={AMBER} stopOpacity="0" />
            </radialGradient>
          </defs>
          {ROADS.map((d) => (
            <path key={d} d={d} fill="none" stroke="#2c2721" strokeWidth={3} />
          ))}
          {Object.entries(AREAS).map(([k, a]) => (
            <circle
              key={k}
              {...(k === "odenigwe" ? { "data-out-glow": "" } : {})}
              cx={a.x}
              cy={a.y}
              r={a.r * 1.7}
              fill="url(#vq-glow)"
            />
          ))}
          {HOMES.map((h, i) => (
            <rect
              key={i}
              {...(h.area === "odenigwe"
                ? { "data-out": "", "data-o": h.o }
                : {})}
              x={h.x}
              y={h.y}
              width={h.w}
              height={h.h}
              rx={1}
              fill={AMBER}
              opacity={h.o}
            />
          ))}
          <circle
            data-flash
            cx={o.x}
            cy={o.y - 20}
            r={40}
            fill="#fff4dc"
            style={{ transformOrigin: `${o.x}px ${o.y - 20}px` }}
          />
          <circle
            data-forecast
            cx={f.x}
            cy={f.y}
            r={f.r * 1.45}
            fill={VIOLET}
            fillOpacity={0.16}
            stroke={VIOLET}
            strokeDasharray="4 4"
            style={{ transformOrigin: `${f.x}px ${f.y}px` }}
          />
          <path
            data-route
            d={`M ${ROUTE.map((p) => p.join(" ")).join(" L ")}`}
            pathLength={1}
            strokeDasharray="1 1"
            fill="none"
            stroke="#5b8cff"
            strokeWidth={3}
            strokeLinecap="round"
          />
          {PINS.map((p, i) => (
            <circle
              key={i}
              data-pin
              cx={p.x}
              cy={p.y}
              r={3.4}
              fill="#ff5a3c"
              stroke="#0d0c0b"
              strokeWidth={1}
              style={{ transformOrigin: `${p.x}px ${p.y}px` }}
            />
          ))}
        </svg>

        {/* Substation */}
        <span
          data-station
          className="text-ink absolute grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[6px] bg-[#f2b45a] text-[12px]"
          style={{ left: ROUTE[0][0], top: ROUTE[0][1] }}
        >
          ⚡
        </span>
      </Panel>

      {/* Pills over the map */}
      <span
        data-dark-pill
        className="text-ink absolute flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-[#ff5a3c] px-2.5 py-1 text-[11px] font-medium whitespace-nowrap"
        style={{ left: o.x, top: o.y - 46 }}
      >
        <span className="bg-ink h-1.5 w-1.5 rounded-full" />
        {copy.outage.area} · No light
      </span>
      <span
        data-lit-pill
        className="text-ink absolute flex -translate-x-1/2 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap"
        style={{ left: o.x, top: o.y - 46, background: GREEN }}
      >
        ✓ {copy.outage.area} · Light restored
      </span>
      <span
        data-forecast-pill
        className="absolute flex -translate-x-1/2 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap text-white"
        style={{ left: f.x, top: f.y - 14, background: VIOLET }}
      >
        {copy.forecast.area} · {copy.forecast.chance} · {copy.forecast.window}
      </span>
      <span
        data-truck
        className="absolute top-0 left-0 z-10 flex -translate-x-1/2 -translate-y-[130%] items-center gap-1 rounded-full bg-[#5b8cff] px-2 py-0.5 text-[10px] font-medium whitespace-nowrap text-white"
      >
        {copy.crew.name}
      </span>

      {/* The time */}
      <div className="absolute top-4 right-5 text-right">
        <p className="label text-bone-muted text-[9px]">Nsukka</p>
        <div className="relative mt-0.5 grid h-[30px] justify-items-end">
          {copy.times.map((t) => (
            <span
              key={t}
              data-time
              className="col-start-1 row-start-1 text-[24px] font-semibold tracking-[-0.03em] whitespace-nowrap tabular-nums"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Reports card */}
      <Panel data-reports className="bottom-4 left-4 w-[200px] p-3.5">
        <p className="label text-[9px] text-[#ff5a3c]">Live reports</p>
        <p className="mt-1 text-[22px] font-semibold tracking-[-0.03em] tabular-nums">
          <span data-report-count>1</span> neighbours
        </p>
        <p className="text-bone-muted text-[11px]">
          reported no light in {copy.outage.area}
        </p>
      </Panel>

      {/* EEDC console */}
      <Panel data-console className="top-4 left-4 w-[230px] p-3.5">
        <p className="label text-bone-muted text-[9px]">
          EEDC console · Fault #1
        </p>
        <p className="mt-1 text-[15px] font-medium tracking-[-0.01em]">
          {copy.outage.area} · {copy.outage.homes} homes
        </p>
        <div className="mt-2.5 flex items-center justify-between rounded-[8px] bg-[#1d2233] px-2.5 py-1.5 text-[11px]">
          <span className="text-[#9db8ff]">{copy.crew.name}</span>
          <span className="text-bone-muted">
            {copy.crew.distance} · en route
          </span>
        </div>
      </Panel>

      {/* Forecast notification */}
      <Panel
        data-note
        className="top-[244px] left-[212px] w-[250px] rounded-[16px] bg-[#22201e]/95 p-3"
      >
        <div className="flex items-center gap-2">
          <span className="text-ink grid h-5 w-5 place-items-center rounded-[6px] bg-[#f2b45a] text-[10px]">
            ⚡
          </span>
          <span className="label text-bone-muted text-[9px]">VoltIq · now</span>
        </div>
        <p className="mt-1.5 text-[13px] font-medium">
          Possible outage tonight, {copy.forecast.window}
        </p>
        <p className="text-bone-muted text-[11px]">
          {copy.forecast.area} · {copy.forecast.chance} likely. Charge your
          phones.
        </p>
      </Panel>
    </div>
  );
}
