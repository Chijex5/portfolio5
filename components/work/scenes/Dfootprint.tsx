"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { dfootprint as copy } from "@/lib/scenes/dfootprint";
import { useCamera } from "../SceneFrame";
import type { SceneProps } from "./types";

/**
 * D'Footprint, acted out: pick a made-to-measure pair, pay with Paystack, watch
 * the order cross the workshop bench, get the "on its way" notification.
 *
 * One timeline, one unit of time per step (see SceneProps). Every element is
 * absolutely placed on the 600×460 scene canvas.
 */

// The sole of a slide, seen from above — wider at the ball, narrow at the heel.
const SOLE =
  "M0,-68 C22,-68 31,-50 31,-30 C31,-6 24,10 24,30 C24,52 14,66 0,66 C-14,66 -24,52 -24,30 C-24,10 -31,-6 -31,-30 C-31,-50 -22,-68 0,-68 Z";
const STRAP = "M-34,-40 C-20,-51 20,-51 34,-40 L32,-8 C18,-17 -18,-17 -32,-8 Z";

function Slide({
  x,
  y,
  r,
  flip,
}: {
  x: number;
  y: number;
  r: number;
  flip?: boolean;
}) {
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${r}) scale(${flip ? -1 : 1} 1)`}
    >
      <path
        data-sole
        d={SOLE}
        pathLength={1}
        fill="#1e1a17"
        stroke="#ede8df"
        strokeWidth={1.2}
      />
      <path
        data-stitch
        d={SOLE}
        pathLength={1}
        fill="none"
        stroke="#ede8df"
        strokeOpacity={0.35}
        strokeWidth={0.8}
        strokeDasharray="0.012 0.012"
        transform="scale(0.86)"
      />
      <path data-strap d={STRAP} fill="#b07a4f" />
      <path
        data-strap
        d="M-30,-37 C-18,-46 18,-46 30,-37"
        fill="none"
        stroke="#d9a777"
        strokeWidth={1}
      />
    </g>
  );
}

export default function DfootprintScene({ register }: SceneProps) {
  const root = useRef<HTMLDivElement>(null);
  const camera = useCamera();

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const tl = gsap.timeline({
        paused: true,
        defaults: { ease: "power3.out", duration: 0.2 },
      });

      // Where a narrow screen should look on each step (see SceneFrame).
      tl.set(camera, { x: 300 }, 0);
      tl.to(camera, { x: 430, duration: 0.25, ease: "power2.inOut" }, 1.2);
      tl.to(camera, { x: 440, duration: 0.2, ease: "power2.inOut" }, 2.05);

      // --- 0 · Pick a pair --------------------------------------------------
      // Alone on the first step, the storefront sits centred; it steps aside
      // when the checkout arrives.
      tl.fromTo(
        q("[data-store]"),
        { autoAlpha: 0, x: 135, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.25 },
        0,
      );
      tl.fromTo(
        q("[data-sole]"),
        { strokeDasharray: "1 1", strokeDashoffset: 1 },
        { strokeDashoffset: 0, duration: 0.35, ease: "power2.inOut" },
        0.05,
      );
      tl.fromTo(
        q("[data-stitch]"),
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.15 },
        0.3,
      );
      tl.fromTo(
        q("[data-strap]"),
        { autoAlpha: 0, y: -6 },
        { autoAlpha: 1, y: 0, stagger: 0.02 },
        0.28,
      );
      tl.fromTo(
        q("[data-chip]"),
        { autoAlpha: 0, y: 6 },
        { autoAlpha: 1, y: 0, stagger: 0.025, duration: 0.12 },
        0.22,
      );
      tl.fromTo(
        q("[data-cursor]"),
        { autoAlpha: 0, x: 395, y: 430 },
        { autoAlpha: 1, duration: 0.08 },
        0.32,
      );
      tl.to(
        q("[data-cursor]"),
        { x: 383, y: 316, duration: 0.16, ease: "power2.inOut" },
        0.34,
      );
      tl.to(
        q("[data-cursor]"),
        { scale: 0.8, duration: 0.03, yoyo: true, repeat: 1 },
        0.5,
      );
      tl.to(
        q("[data-custom]"),
        {
          backgroundColor: "#ff4a1c",
          borderColor: "#ff4a1c",
          color: "#0a0a0a",
          duration: 0.05,
        },
        0.52,
      );
      tl.fromTo(
        q("[data-measure]"),
        { autoAlpha: 0, height: 0 },
        { autoAlpha: 1, height: 38, duration: 0.12 },
        0.55,
      );

      // --- 1 · Pay with Paystack -------------------------------------------
      tl.to(
        q("[data-cursor]"),
        { x: 295, y: 400, duration: 0.14, ease: "power2.inOut" },
        1,
      );
      tl.to(
        q("[data-cursor]"),
        { scale: 0.8, duration: 0.03, yoyo: true, repeat: 1 },
        1.15,
      );
      tl.to(
        q("[data-add]"),
        { scale: 0.97, duration: 0.03, yoyo: true, repeat: 1 },
        1.15,
      );
      tl.to(
        q("[data-store]"),
        { x: 0, autoAlpha: 0.35, duration: 0.25, ease: "power3.inOut" },
        1.2,
      );
      tl.fromTo(
        q("[data-pay]"),
        { autoAlpha: 0, y: 40 },
        { autoAlpha: 1, y: 0, duration: 0.22 },
        1.22,
      );
      tl.to(
        q("[data-cursor]"),
        { x: 432, y: 290, duration: 0.14, ease: "power2.inOut" },
        1.42,
      );
      tl.to(
        q("[data-cursor]"),
        { scale: 0.8, duration: 0.03, yoyo: true, repeat: 1 },
        1.57,
      );
      tl.to(q("[data-paylabel]"), { autoAlpha: 0, duration: 0.04 }, 1.6);
      tl.fromTo(
        q("[data-spinner]"),
        { autoAlpha: 0, rotate: 0 },
        { autoAlpha: 1, rotate: 540, duration: 0.18, ease: "none" },
        1.6,
      );
      tl.to(q("[data-spinner]"), { autoAlpha: 0, duration: 0.04 }, 1.76);
      tl.fromTo(
        q("[data-paid]"),
        { autoAlpha: 0, scale: 0.6 },
        { autoAlpha: 1, scale: 1, duration: 0.12, ease: "back.out(2)" },
        1.78,
      );
      tl.to(
        q("[data-paybtn]"),
        { backgroundColor: "#1f2a1f", duration: 0.08 },
        1.78,
      );

      // --- 2 · Watch it get made -------------------------------------------
      tl.to(q("[data-cursor]"), { autoAlpha: 0, duration: 0.08 }, 2);
      tl.to(q("[data-pay]"), { autoAlpha: 0, y: 30, duration: 0.15 }, 2);
      tl.to(q("[data-store]"), { autoAlpha: 0.18, x: 0, duration: 0.2 }, 2);
      tl.fromTo(
        q("[data-track]"),
        { autoAlpha: 0, x: 40 },
        { autoAlpha: 1, x: 0, duration: 0.25 },
        2.05,
      );
      const rows = q("[data-step]");
      const dots = q("[data-dot]");
      const n = copy.order.steps.length;
      const fill = (k: number, at: number, dur: number) => {
        tl.to(
          q("[data-fill]"),
          { scaleY: k / (n - 1), duration: dur, ease: "power1.inOut" },
          at,
        );
        tl.to(
          dots[k],
          {
            backgroundColor: "#ff4a1c",
            borderColor: "#ff4a1c",
            scale: 1,
            duration: 0.05,
          },
          at + dur,
        );
        tl.to(rows[k], { opacity: 1, duration: 0.06 }, at + dur);
      };
      tl.set(q("[data-fill]"), { scaleY: 0 }, 0);
      tl.fromTo(rows, { opacity: 0.32 }, { opacity: 0.32, duration: 0.01 }, 0);
      fill(0, 2.3, 0.04);
      fill(1, 2.36, 0.16);
      fill(2, 2.54, 0.16);

      // --- 3 · At the door --------------------------------------------------
      fill(3, 3.0, 0.18);
      tl.to(q("[data-track-head]"), { autoAlpha: 0, duration: 0.1 }, 3.15);
      tl.fromTo(
        q("[data-note]"),
        { autoAlpha: 0, y: -30 },
        { autoAlpha: 1, y: 0, duration: 0.2, ease: "back.out(1.4)" },
        3.2,
      );
      fill(4, 3.42, 0.18);
      tl.fromTo(
        q("[data-delivered]"),
        { autoAlpha: 0, scale: 0.7 },
        { autoAlpha: 1, scale: 1, duration: 0.12, ease: "back.out(2)" },
        3.62,
      );

      tl.set({}, {}, copy.steps.length);
      register(tl);
    },
    { scope: root },
  );

  const p = copy.product;
  return (
    <div ref={root} className="text-bone relative h-full w-full text-[13px]">
      {/* Storefront --------------------------------------------------------- */}
      <div
        data-store
        className="bg-ink-raised border-bone-faint absolute top-[24px] left-0 h-[412px] w-[330px] overflow-hidden rounded-[14px] border shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]"
      >
        <div className="border-bone-faint flex h-[30px] items-center gap-1.5 border-b px-3">
          <span className="bg-bone-faint h-2 w-2 rounded-full" />
          <span className="bg-bone-faint h-2 w-2 rounded-full" />
          <span className="bg-bone-faint h-2 w-2 rounded-full" />
          <span className="label text-bone-muted mx-auto text-[9px]">
            dfootprint.me
          </span>
        </div>
        <svg
          viewBox="0 0 330 170"
          className="block h-[170px] w-[330px]"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="dfp-floor" cx="50%" cy="60%" r="70%">
              <stop offset="0" stopColor="#2a221c" />
              <stop offset="1" stopColor="#141312" />
            </radialGradient>
          </defs>
          <rect width="330" height="170" fill="url(#dfp-floor)" />
          <Slide x={130} y={88} r={-12} />
          <Slide x={204} y={90} r={10} flip />
        </svg>
        <div className="px-4 pt-3">
          <div className="flex items-baseline justify-between">
            <p className="text-[15px] font-medium tracking-[-0.01em]">
              {p.name}
            </p>
            <p className="text-[15px] tabular-nums">{p.price}</p>
          </div>
          <p className="text-bone-muted mt-0.5 text-[11px]">{p.variant}</p>
          <p className="label text-bone-muted mt-3 text-[9px]">Size</p>
          <div className="mt-1.5 flex gap-1.5">
            {p.sizes.map((s) => (
              <span
                key={s}
                data-chip
                className="border-bone-faint grid h-[28px] w-[36px] place-items-center rounded-[7px] border text-[11px] tabular-nums"
              >
                {s}
              </span>
            ))}
            <span
              data-chip
              data-custom
              className="border-bone-faint grid h-[28px] place-items-center rounded-[7px] border px-2.5 text-[11px] font-medium"
            >
              {p.custom}
            </span>
          </div>
          <div data-measure className="mt-2 overflow-hidden">
            <div className="flex h-[30px] items-center justify-between rounded-[7px] bg-[#1c1a18] px-2.5 text-[11px]">
              <span className="text-bone-muted">Foot length</span>
              <span className="tabular-nums">{p.footLength}</span>
            </div>
          </div>
        </div>
        <div
          data-add
          className="bg-bone text-ink absolute right-4 bottom-4 left-4 grid h-[38px] place-items-center rounded-[9px] text-[12px] font-medium"
        >
          Add to bag
        </div>
      </div>

      {/* Paystack checkout --------------------------------------------------- */}
      <div
        data-pay
        className="border-bone-faint absolute top-[96px] left-[282px] w-[300px] rounded-[14px] border bg-[#161514] p-5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]"
      >
        <div className="flex items-center justify-between">
          <p className="label text-bone-muted text-[9px]">
            Secured by Paystack
          </p>
          <p className="text-bone-muted text-[10px]">D&rsquo;Footprint</p>
        </div>
        <p className="text-bone-muted mt-4 text-[11px]">Pay</p>
        <p className="text-[30px] font-medium tracking-[-0.03em] tabular-nums">
          {p.price}
        </p>
        <div className="border-bone-faint mt-4 flex h-[38px] items-center justify-between rounded-[8px] border px-3 text-[12px]">
          <span className="text-bone-muted">Card</span>
          <span className="tracking-[0.08em] tabular-nums">
            {copy.payment.card}
          </span>
        </div>
        <div
          data-paybtn
          className="relative mt-3 grid h-[42px] place-items-center rounded-[9px] bg-[#2b7a4b] text-[12px] font-medium"
        >
          <span data-paylabel>Pay {p.price}</span>
          <span
            data-spinner
            className="border-bone/30 border-t-bone absolute h-4 w-4 rounded-full border-2"
          />
          <span data-paid className="absolute flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <circle cx="8" cy="8" r="7.5" fill="#3fbf6f" />
              <path
                d="M4.5 8.3l2.2 2.1 4.6-4.8"
                stroke="#0a0a0a"
                strokeWidth="1.8"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Payment successful
          </span>
        </div>
      </div>

      {/* Order tracker ------------------------------------------------------- */}
      <div
        data-track
        className="border-bone-faint absolute top-[24px] right-0 h-[412px] w-[320px] rounded-[14px] border bg-[#161514] p-5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]"
      >
        <div data-track-head>
          <p className="label text-bone-muted text-[9px]">
            Order {copy.order.id}
          </p>
          <p className="mt-1 text-[16px] font-medium tracking-[-0.01em]">
            {p.name} · {p.footLength}
          </p>
        </div>
        <div className="relative mt-6">
          <span className="bg-bone-faint absolute top-[7px] left-[7px] h-[232px] w-[2px]" />
          <span
            data-fill
            className="bg-signal absolute top-[7px] left-[7px] h-[232px] w-[2px] origin-top"
          />
          <ol className="relative grid gap-[38px]">
            {copy.order.steps.map((s) => (
              <li key={s.label} data-step className="flex items-center gap-4">
                <span
                  data-dot
                  className="bg-ink border-bone-faint z-10 h-4 w-4 shrink-0 scale-90 rounded-full border-2"
                />
                <span className="flex flex-1 items-baseline justify-between">
                  <span className="text-[13px]">{s.label}</span>
                  <span className="label text-bone-muted text-[9px]">
                    {s.time}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
        <div
          data-delivered
          className="bg-signal text-ink absolute right-5 bottom-5 left-5 grid h-[40px] place-items-center rounded-[9px] text-[12px] font-medium"
        >
          Delivered
        </div>
      </div>

      {/* Notification -------------------------------------------------------- */}
      <div
        data-note
        className="border-bone-faint absolute top-[12px] right-[10px] w-[300px] rounded-[16px] border bg-[#22201e]/95 p-3 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.9)] backdrop-blur"
      >
        <div className="flex items-center gap-2">
          <span className="bg-signal text-ink grid h-5 w-5 place-items-center rounded-[6px] text-[10px] font-semibold">
            D
          </span>
          <span className="label text-bone-muted text-[9px]">
            D&rsquo;Footprint · now
          </span>
        </div>
        <p className="mt-1.5 text-[13px] font-medium">
          {copy.notification.title}
        </p>
        <p className="text-bone-muted text-[11px]">{copy.notification.body}</p>
      </div>

      {/* Pointer ------------------------------------------------------------- */}
      <span
        data-cursor
        className="border-ink bg-bone pointer-events-none absolute top-0 left-0 z-20 block h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-[0_2px_10px_rgba(0,0,0,0.6)]"
      />
    </div>
  );
}
