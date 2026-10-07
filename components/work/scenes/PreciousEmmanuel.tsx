"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { preciousAndEmmanuel as copy } from "@/lib/scenes/precious-and-emmanuel";
import { rng } from "@/lib/stage/shapes";
import { useCamera } from "../SceneFrame";
import type { SceneProps } from "./types";
import { count, Panel, Pointer, press, type } from "./ui";

/**
 * Precious & Emmanuel, acted out: the invitation and its countdown, a guest's
 * RSVP, the ticket they get back, and the couple's view of the room filling.
 */

/** A QR-looking grid, fixed by seed. Decorative — it encodes nothing. */
const QR = (() => {
  const r = rng(31);
  const n = 21;
  const cells: [number, number][] = [];
  // The three corner squares that make it read as a QR code.
  const finder = (x: number, y: number) => {
    for (const [ox, oy] of [
      [0, 0],
      [n - 7, 0],
      [0, n - 7],
    ]) {
      const lx = x - ox;
      const ly = y - oy;
      if (lx >= 0 && lx < 7 && ly >= 0 && ly < 7) return [lx, ly];
    }
    return null;
  };
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const f = finder(x, y);
      if (f) {
        const [lx, ly] = f;
        const ring = lx === 0 || ly === 0 || lx === 6 || ly === 6;
        const core = lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4;
        if (ring || core) cells.push([x, y]);
      } else if (r() < 0.47) cells.push([x, y]);
    }
  return { n, cells };
})();

const PAPER = "#f3efe7";
const INK = "#1b1714";

export default function PreciousEmmanuelScene({ register }: SceneProps) {
  const root = useRef<HTMLDivElement>(null);
  const camera = useCamera();

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const tl = gsap.timeline({
        paused: true,
        defaults: { ease: "power3.out", duration: 0.2 },
      });
      const pad = (v: number) =>
        String(Math.max(0, Math.round(v))).padStart(2, "0");

      tl.set(camera, { x: 300 }, 0);
      // --- 0 · A date that won't move ---------------------------------------
      tl.fromTo(
        q("[data-invite]"),
        { autoAlpha: 0, y: 30, rotate: -2 },
        { autoAlpha: 1, y: 0, rotate: 0, duration: 0.3 },
        0,
      );
      tl.fromTo(
        q("[data-names] > *"),
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, stagger: 0.06, duration: 0.18 },
        0.12,
      );
      tl.fromTo(
        q("[data-unit]"),
        { autoAlpha: 0, y: 8 },
        { autoAlpha: 1, y: 0, stagger: 0.04, duration: 0.12 },
        0.3,
      );
      count(tl, q("[data-days]")[0], 90, copy.countdown.days, 0.3, 0.5, pad);
      count(tl, q("[data-secs]")[0], 59, 9, 0.3, 0.6, pad);

      // --- 1 · Guests RSVP in a minute --------------------------------------
      tl.to(camera, { x: 445, duration: 0.25, ease: "power2.inOut" }, 1);
      tl.to(
        q("[data-invite]"),
        {
          x: -120,
          autoAlpha: 0.35,
          scale: 0.94,
          duration: 0.25,
          ease: "power3.inOut",
        },
        1,
      );
      tl.fromTo(
        q("[data-rsvp]"),
        { autoAlpha: 0, x: 40 },
        { autoAlpha: 1, x: 0, duration: 0.22 },
        1.05,
      );
      type(tl, q("[data-guest]"), copy.guest.name.length, 1.2, 0.18);
      tl.fromTo(
        q("[data-cursor]"),
        { autoAlpha: 0, x: 470, y: 420 },
        { autoAlpha: 1, duration: 0.05 },
        1.25,
      );
      tl.to(
        q("[data-cursor]"),
        { x: 398, y: 197, duration: 0.1, ease: "power2.inOut" },
        1.3,
      );
      press(tl, q("[data-cursor]"), 1.4);
      tl.to(
        q("[data-yes]"),
        {
          backgroundColor: "#ff4a1c",
          color: "#0a0a0a",
          borderColor: "#ff4a1c",
          duration: 0.04,
        },
        1.42,
      );
      type(tl, q("[data-plus]"), copy.guest.plusOne.length, 1.46, 0.16);
      tl.to(
        q("[data-cursor]"),
        { x: 445, y: 352, duration: 0.1, ease: "power2.inOut" },
        1.64,
      );
      press(tl, q("[data-cursor], [data-send]"), 1.76);

      // --- 2 · Everyone gets a ticket ---------------------------------------
      tl.to(q("[data-cursor]"), { autoAlpha: 0, duration: 0.05 }, 2);
      tl.to(camera, { x: 300, duration: 0.2, ease: "power2.inOut" }, 2);
      tl.to(q("[data-rsvp]"), { autoAlpha: 0, x: 30, duration: 0.15 }, 2);
      tl.to(q("[data-invite]"), { autoAlpha: 0.12, duration: 0.15 }, 2);
      tl.fromTo(
        q("[data-ticket]"),
        { autoAlpha: 0, y: 50, rotate: 3 },
        {
          autoAlpha: 1,
          y: 0,
          rotate: -2,
          duration: 0.3,
          ease: "back.out(1.3)",
        },
        2.1,
      );
      tl.fromTo(
        q("[data-qr] rect"),
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.2,
          stagger: { each: 0.0008, from: "random" },
        },
        2.3,
      );

      // --- 3 · The room fills up --------------------------------------------
      tl.to(q("[data-ticket]"), { autoAlpha: 0, y: -30, duration: 0.15 }, 3);
      tl.to(q("[data-invite]"), { autoAlpha: 0, duration: 0.1 }, 3);
      tl.fromTo(
        q("[data-dash]"),
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.2 },
        3.08,
      );
      count(tl, q("[data-attending]")[0], 168, copy.attending.now, 3.15, 0.45);
      tl.fromTo(
        q("[data-fill]"),
        { scaleX: 168 / copy.attending.capacity },
        {
          scaleX: copy.attending.now / copy.attending.capacity,
          duration: 0.45,
          ease: "power1.inOut",
        },
        3.15,
      );
      tl.fromTo(
        q("[data-recent]"),
        { autoAlpha: 0, x: -16 },
        { autoAlpha: 1, x: 0, stagger: 0.07, duration: 0.12 },
        3.2,
      );

      tl.set({}, {}, copy.steps.length);
      register(tl);
    },
    { scope: root },
  );

  const [a, b] = copy.couple;
  return (
    <div ref={root} className="text-bone relative h-full w-full text-[12px]">
      {/* Invitation */}
      <div
        data-invite
        className="absolute top-[28px] left-[160px] h-[404px] w-[280px] rounded-[10px] p-6 text-center shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]"
        style={{ background: PAPER, color: INK }}
      >
        <p className="label text-[8px] opacity-60">
          Together with their families
        </p>
        <div data-names className="mt-5 font-serif leading-[0.95] italic">
          <p className="text-[46px]">{a}</p>
          <p className="text-[26px] text-[#b5683a]">&amp;</p>
          <p className="text-[46px]">{b}</p>
        </div>
        <span className="mx-auto mt-5 block h-px w-12 bg-[#1b1714]/25" />
        <p className="mt-4 text-[12px] font-medium">{copy.date}</p>
        <div className="mt-6 grid grid-cols-4 gap-1.5">
          {[
            ["Days", String(copy.countdown.days), "data-days"],
            ["Hrs", copy.countdown.time.slice(0, 2), ""],
            ["Min", copy.countdown.time.slice(3, 5), ""],
            ["Sec", copy.countdown.time.slice(6, 8), "data-secs"],
          ].map(([label, v, attr]) => (
            <div
              key={label}
              data-unit
              className="rounded-[6px] bg-[#1b1714]/[0.06] py-2"
            >
              <p
                {...(attr ? { [attr]: "" } : {})}
                className="text-[20px] font-semibold tracking-[-0.03em] tabular-nums"
              >
                {v}
              </p>
              <p className="label text-[7px] opacity-55">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* RSVP */}
      <Panel data-rsvp className="top-[60px] left-[300px] w-[290px] p-5">
        <p className="font-serif text-[24px] italic">Will you be there?</p>
        <p className="label text-bone-muted mt-4 text-[9px]">Your name</p>
        <div className="border-bone-faint mt-1.5 flex h-[34px] items-center rounded-[8px] border px-3 text-[13px]">
          <span data-guest className="whitespace-nowrap">
            {copy.guest.name}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <span
            data-yes
            className="border-bone-faint grid h-[34px] place-items-center rounded-[8px] border text-[12px] font-medium"
          >
            Joyfully yes
          </span>
          <span className="border-bone-faint text-bone-muted grid h-[34px] place-items-center rounded-[8px] border text-[12px]">
            Sadly no
          </span>
        </div>
        <p className="label text-bone-muted mt-4 text-[9px]">Plus one</p>
        <div className="border-bone-faint mt-1.5 flex h-[34px] items-center rounded-[8px] border px-3 text-[13px]">
          <span data-plus className="whitespace-nowrap">
            {copy.guest.plusOne}
          </span>
        </div>
        <div
          data-send
          className="bg-bone text-ink mt-5 grid h-[40px] place-items-center rounded-[9px] text-[12px] font-medium"
        >
          Send RSVP
        </div>
      </Panel>

      {/* Ticket */}
      <div
        data-ticket
        className="absolute top-[64px] left-[150px] flex h-[330px] w-[300px] overflow-hidden rounded-[14px] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]"
      >
        <div
          className="flex flex-1 flex-col justify-between p-5"
          style={{ background: PAPER, color: INK }}
        >
          <div>
            <p className="label text-[8px] opacity-60">Admit two</p>
            <p className="mt-1 font-serif text-[26px] leading-none italic">
              {a} &amp; {b}
            </p>
            <p className="mt-3 text-[11px] font-medium">{copy.guest.name}</p>
            <p className="text-[11px] opacity-60">+ {copy.guest.plusOne}</p>
          </div>
          <svg
            data-qr
            viewBox={`0 0 ${QR.n} ${QR.n}`}
            className="h-[96px] w-[96px]"
            aria-hidden="true"
          >
            {QR.cells.map(([x, y]) => (
              <rect
                key={`${x}-${y}`}
                x={x}
                y={y}
                width={1.02}
                height={1.02}
                fill={INK}
              />
            ))}
          </svg>
          <div className="flex gap-4 text-[11px]">
            <span>
              <span className="block text-[8px] tracking-[0.12em] uppercase opacity-55">
                Seat
              </span>
              {copy.ticket.table}
            </span>
            <span>
              <span className="block text-[8px] tracking-[0.12em] uppercase opacity-55">
                Entry
              </span>
              {copy.ticket.gate}
            </span>
          </div>
        </div>
        <div className="relative flex w-[54px] items-center justify-center bg-[#b5683a] text-[#f3efe7]">
          <span className="absolute -top-3 -left-3 h-6 w-6 rounded-full bg-[#0a0a0a]" />
          <span className="absolute -bottom-3 -left-3 h-6 w-6 rounded-full bg-[#0a0a0a]" />
          <span className="text-[11px] font-semibold tracking-[0.2em] [writing-mode:vertical-rl]">
            {copy.ticket.code}
          </span>
        </div>
      </div>

      {/* The couple's view */}
      <Panel data-dash className="top-[40px] left-[60px] w-[480px] p-6">
        <p className="label text-bone-muted text-[9px]">Guest list · live</p>
        <p className="mt-2 text-[44px] font-semibold tracking-[-0.04em] tabular-nums">
          <span data-attending>168</span>
          <span className="text-bone-muted text-[22px]">
            {" "}
            / {copy.attending.capacity} attending
          </span>
        </p>
        <span className="bg-bone-faint mt-3 block h-[6px] overflow-hidden rounded-full">
          <span
            data-fill
            className="bg-signal block h-full w-full origin-left rounded-full"
          />
        </span>
        <p className="label text-bone-muted mt-6 text-[9px]">Just in</p>
        <ul className="mt-2">
          {copy.recent.map((g, i) => (
            <li
              key={g}
              data-recent
              className="border-bone-faint flex items-center justify-between border-b py-2.5 text-[13px] last:border-0"
            >
              <span>{g}</span>
              <span className="text-bone-muted text-[11px]">
                {i === 0 ? "just now" : `${i * 4} min ago`}
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      <Pointer />
    </div>
  );
}
