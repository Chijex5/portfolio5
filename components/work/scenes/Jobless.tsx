"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { jobless as copy } from "@/lib/scenes/jobless";
import { useCamera } from "../SceneFrame";
import type { SceneProps } from "./types";
import { count, Panel } from "./ui";

/**
 * Jobless, acted out: five boards pour into one inbox, AI strikes out the
 * noise, the keepers are scored and re-sorted, and the best one is carried
 * across the tracker to an offer.
 */

const ROW_Y = 78;
const ROW_H = 52;
const ROW_GAP = 8;
const slotY = (i: number) => ROW_Y + i * (ROW_H + ROW_GAP);

const keepers = copy.listings
  .map((l, i) => ({ ...l, i }))
  .filter((l) => !l.tag)
  .sort((a, b) => b.score - a.score);
const best = keepers[0];

const COL_W = 99;
const colX = (c: number) => 14 + c * (COL_W + 8);

export default function JoblessScene({ register }: SceneProps) {
  const root = useRef<HTMLDivElement>(null);
  const camera = useCamera();

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const tl = gsap.timeline({
        paused: true,
        defaults: { ease: "power3.out", duration: 0.2 },
      });
      const rows = q("[data-row]");

      tl.set(camera, { x: 250 }, 0);
      // --- 0 · Five boards, one inbox ---------------------------------------
      tl.fromTo(
        q("[data-source]"),
        { autoAlpha: 0, x: -12 },
        { autoAlpha: 1, x: 0, stagger: 0.04, duration: 0.12 },
        0,
      );
      tl.fromTo(
        q("[data-inbox]"),
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 0.2 },
        0.08,
      );
      tl.fromTo(
        q("[data-wire]"),
        { strokeDashoffset: 1 },
        { strokeDashoffset: 0, duration: 0.2, stagger: 0.03, ease: "none" },
        0.15,
      );
      tl.fromTo(
        q("[data-packet]"),
        { autoAlpha: 0, x: 0 },
        {
          autoAlpha: 1,
          x: 36,
          duration: 0.18,
          stagger: { each: 0.05, repeat: 1 },
          ease: "none",
        },
        0.3,
      );
      tl.to(camera, { x: 375, duration: 0.3, ease: "power2.inOut" }, 0.35);
      tl.fromTo(
        rows,
        { autoAlpha: 0, x: -24 },
        { autoAlpha: 1, x: 0, stagger: 0.05, duration: 0.14 },
        0.32,
      );
      count(tl, q("[data-total]")[0], 0, copy.scraped, 0.3, 0.45);

      // --- 1 · Most of it is noise ------------------------------------------
      copy.listings.forEach((l, i) => {
        if (!l.tag) return;
        const t = 1.05 + i * 0.05;
        tl.fromTo(
          q(`[data-tag="${i}"]`),
          { autoAlpha: 0, scale: 0.7 },
          { autoAlpha: 1, scale: 1, duration: 0.08, ease: "back.out(2)" },
          t,
        );
        tl.fromTo(
          q(`[data-strike="${i}"]`),
          { scaleX: 0 },
          { scaleX: 1, duration: 0.1, ease: "power2.inOut" },
          t + 0.06,
        );
        tl.to(rows[i], { opacity: 0.28, duration: 0.1 }, t + 0.12);
      });
      tl.to(q("[data-total-label]"), { autoAlpha: 0, duration: 0.05 }, 1.3);
      tl.fromTo(
        q("[data-kept-label]"),
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.08 },
        1.35,
      );
      count(tl, q("[data-total]")[0], copy.scraped, copy.kept, 1.3, 0.3);

      // --- 2 · Ranked against me --------------------------------------------
      copy.listings.forEach((l, i) => {
        if (l.tag) tl.to(rows[i], { autoAlpha: 0, x: 30, duration: 0.12 }, 2);
      });
      keepers.forEach((k, slot) => {
        tl.to(
          rows[k.i],
          { y: slotY(slot) - slotY(k.i), duration: 0.3, ease: "power3.inOut" },
          2.12 + slot * 0.04,
        );
        tl.fromTo(
          q(`[data-score="${k.i}"]`),
          { autoAlpha: 0, scale: 0.5 },
          { autoAlpha: 1, scale: 1, duration: 0.1, ease: "back.out(2)" },
          2.1 + slot * 0.08,
        );
      });
      tl.to(rows[best.i], { borderColor: "#ff4a1c", duration: 0.1 }, 2.48);
      tl.fromTo(
        q("[data-why]"),
        { autoAlpha: 0, y: 6 },
        { autoAlpha: 1, y: 0, duration: 0.12 },
        2.52,
      );

      // --- 3 · Tracked to signed ---------------------------------------------
      tl.to(
        q("[data-inbox]"),
        { autoAlpha: 0, scale: 0.97, duration: 0.15 },
        3,
      );
      tl.to(
        q("[data-source], [data-wires]"),
        { autoAlpha: 0.15, duration: 0.15 },
        3,
      );
      tl.fromTo(
        q("[data-board]"),
        { autoAlpha: 0, scale: 1.03 },
        { autoAlpha: 1, scale: 1, duration: 0.18 },
        3.05,
      );
      tl.to(camera, { x: 300, duration: 0.15, ease: "power2.inOut" }, 3.05);
      for (let c = 1; c < copy.columns.length; c++) {
        const t = 3.2 + (c - 1) * 0.15;
        tl.to(
          q("[data-card]"),
          { x: colX(c) - colX(0), duration: 0.12, ease: "power3.inOut" },
          t,
        );
        tl.to(
          camera,
          { x: 300 + c * 60, duration: 0.12, ease: "power3.inOut" },
          t,
        );
      }
      tl.to(q("[data-card]"), { borderColor: "#ff4a1c", duration: 0.06 }, 3.62);
      tl.to(q("[data-offer-head]"), { color: "#ff4a1c", duration: 0.06 }, 3.62);
      tl.fromTo(
        q("[data-offer-badge]"),
        { autoAlpha: 0, scale: 0.6 },
        { autoAlpha: 1, scale: 1, duration: 0.1, ease: "back.out(2)" },
        3.66,
      );

      tl.set({}, {}, copy.steps.length);
      register(tl);
    },
    { scope: root },
  );

  return (
    <div ref={root} className="text-bone relative h-full w-full text-[12px]">
      {/* Sources */}
      {copy.sources.map((s, i) => (
        <div
          key={s}
          data-source
          className="border-bone-faint absolute left-0 flex h-[34px] w-[118px] items-center gap-2 rounded-[9px] border bg-[#161514] px-2.5"
          style={{ top: 92 + i * 56 }}
        >
          <span className="bg-bone/10 grid h-5 w-5 place-items-center rounded-[5px] text-[10px] font-semibold">
            {s[0]}
          </span>
          <span className="text-[11px]">{s}</span>
        </div>
      ))}
      <svg
        data-wires
        viewBox="0 0 600 460"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        {copy.sources.map((s, i) => (
          <path
            key={s}
            data-wire
            d={`M 118 ${109 + i * 56} C 135 ${109 + i * 56}, 135 230, 152 230`}
            pathLength={1}
            strokeDasharray="1 1"
            fill="none"
            stroke="rgba(237,232,223,0.25)"
            strokeWidth={1.2}
          />
        ))}
      </svg>
      {copy.sources.map((s, i) => (
        <span
          key={s}
          data-packet
          className="bg-signal absolute h-[5px] w-[5px] rounded-full"
          style={{ left: 116, top: 107 + i * 56 }}
        />
      ))}

      {/* Inbox */}
      <Panel
        data-inbox
        className="top-[16px] left-[152px] h-[428px] w-[448px] px-4"
      >
        <div className="flex h-[54px] items-center justify-between">
          <p className="text-[15px] font-medium tracking-[-0.01em]">Inbox</p>
          <p className="label relative text-[10px]">
            <span data-total className="text-bone tabular-nums">
              0
            </span>{" "}
            <span className="relative inline-grid">
              <span
                data-total-label
                className="text-bone-muted col-start-1 row-start-1"
              >
                new today
              </span>
              <span
                data-kept-label
                className="text-bone-muted col-start-1 row-start-1 whitespace-nowrap"
              >
                worth reading
              </span>
            </span>
          </p>
        </div>
        {copy.listings.map((l, i) => (
          <div
            key={l.role}
            data-row
            className="border-bone-faint absolute right-4 left-4 flex items-center justify-between rounded-[10px] border bg-[#1a1918] px-3"
            style={{ top: slotY(i) - 16, height: ROW_H }}
          >
            <div>
              <p className="text-[13px] font-medium tracking-[-0.01em]">
                {l.role}
              </p>
              <p className="text-bone-muted text-[11px]">{l.company}</p>
            </div>
            {l.tag ? (
              <span
                data-tag={i}
                className="rounded-full bg-[#ff4a1c]/15 px-2 py-0.5 text-[10px] font-medium text-[#ff7a55]"
              >
                {l.tag}
              </span>
            ) : (
              <span
                data-score={i}
                className="grid h-[30px] w-[30px] place-items-center rounded-full border text-[11px] font-semibold tabular-nums"
                style={{
                  borderColor:
                    l.score >= 90 ? "#ff4a1c" : "rgba(237,232,223,0.3)",
                  color: l.score >= 90 ? "#ff4a1c" : "#ede8df",
                }}
              >
                {l.score}
              </span>
            )}
            <span
              data-strike={i}
              className="bg-bone/50 absolute top-1/2 right-3 left-3 h-px origin-left"
              style={{ transform: "scaleX(0)" }}
            />
          </div>
        ))}
        <p
          data-why
          className="text-bone-muted absolute right-4 bottom-4 left-4 text-[11px]"
        >
          <span className="text-signal">●</span> Top match: React, remote, pay
          in range
        </p>
      </Panel>

      {/* Tracker */}
      <Panel data-board className="top-[16px] left-[152px] h-[428px] w-[448px]">
        <p className="px-4 pt-4 text-[15px] font-medium tracking-[-0.01em]">
          Applications
        </p>
        {copy.columns.map((c, i) => (
          <div
            key={c}
            className="absolute top-[54px] bottom-4 rounded-[10px] bg-[#1a1918]"
            style={{ left: colX(i), width: COL_W }}
          >
            <p
              {...(i === copy.columns.length - 1
                ? { "data-offer-head": "" }
                : {})}
              className="label text-bone-muted px-2.5 pt-2.5 text-[9px]"
            >
              {c}
            </p>
          </div>
        ))}
        {/* A few other applications, for a board that looks lived in. */}
        {[
          [1, 0, "Backend Engineer"],
          [1, 1, "React Native Dev"],
          [2, 0, "Product Engineer"],
          [0, 1, "Platform Engineer"],
        ].map(([c, r, role]) => (
          <div
            key={role as string}
            className="border-bone-faint absolute rounded-[8px] border bg-[#161514] p-2 opacity-60"
            style={{
              left: colX(c as number) + 4,
              top: 84 + 66 + (r as number) * 66,
              width: COL_W - 8,
              height: 58,
            }}
          >
            <p className="text-[10px] leading-tight font-medium">{role}</p>
            <p className="text-bone-muted mt-0.5 text-[9px]">2 days ago</p>
          </div>
        ))}
        <div
          data-card
          className="border-bone-faint absolute z-10 rounded-[8px] border bg-[#201e1c] p-2 shadow-[0_10px_30px_-8px_rgba(0,0,0,0.8)]"
          style={{ left: colX(0) + 4, top: 84, width: COL_W - 8, height: 58 }}
        >
          <p className="text-[10px] leading-tight font-medium">{best.role}</p>
          <p className="text-bone-muted mt-0.5 text-[9px]">{best.company}</p>
          <span
            data-offer-badge
            className="bg-signal text-ink absolute -top-2 -right-2 rounded-full px-1.5 py-0.5 text-[8px] font-semibold tracking-[0.08em] uppercase"
          >
            Offer
          </span>
        </div>
      </Panel>
    </div>
  );
}
