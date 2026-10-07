"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { picpress as copy } from "@/lib/scenes/picpress";
import { useCamera } from "../SceneFrame";
import type { SceneProps } from "./types";
import { count, Panel, Pointer, press } from "./ui";

/**
 * PicPress, acted out: twelve heavy phone photos, shrunk in place with nothing
 * uploaded, laid onto pages, and sent as one small PDF.
 */

/** Stand-in photos: warm and cool gradients, so the grid reads as pictures. */
const PHOTOS = [
  ["#c76b3a", "#3a1f14"],
  ["#5d8aa8", "#1c2a38"],
  ["#d9b26f", "#5a3b1c"],
  ["#7a9a62", "#26331d"],
  ["#b25b6e", "#3a1822"],
  ["#e0c9a6", "#6b5640"],
  ["#4f6d7a", "#162329"],
  ["#c9894b", "#4a2a12"],
  ["#8a6fb0", "#2a2038"],
  ["#d46f4d", "#3b1a10"],
  ["#6aa39a", "#1d3330"],
  ["#bfa27a", "#4a3a26"],
];
const TILE_W = 100;
const TILE_H = 74;
const GAP = 9;

function Photo({
  i,
  className,
  style,
}: {
  i: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [a, b] = PHOTOS[i % PHOTOS.length];
  return (
    <span
      className={`block overflow-hidden rounded-[6px] ${className ?? ""}`}
      style={{
        background: `radial-gradient(circle at ${30 + ((i * 17) % 50)}% ${25 + ((i * 29) % 40)}%, ${a}, ${b})`,
        ...style,
      }}
    />
  );
}

export default function PicpressScene({ register }: SceneProps) {
  const root = useRef<HTMLDivElement>(null);
  const camera = useCamera();

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const tl = gsap.timeline({
        paused: true,
        defaults: { ease: "power3.out", duration: 0.2 },
      });
      const tiles = q("[data-tile]");

      tl.set(camera, { x: 175 }, 0);
      // --- 0 · Twelve photos. 248 MB. ---------------------------------------
      tl.fromTo(
        q("[data-app]"),
        { autoAlpha: 0, y: 20 },
        { autoAlpha: 1, y: 0, duration: 0.2 },
        0,
      );
      tl.fromTo(
        tiles,
        { autoAlpha: 0, y: -18, scale: 0.92 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          stagger: 0.035,
          duration: 0.12,
          ease: "back.out(1.6)",
        },
        0.12,
      );
      tl.fromTo(
        q("[data-stats]"),
        { autoAlpha: 0, x: 20 },
        { autoAlpha: 1, x: 0, duration: 0.18 },
        0.3,
      );
      count(
        tl,
        q("[data-total]")[0],
        0,
        copy.before.total,
        0.15,
        0.45,
        (v) => `${Math.round(v)} MB`,
      );
      tl.fromTo(
        q("[data-bar]"),
        { scaleX: 0 },
        { scaleX: 1, duration: 0.45, ease: "power1.inOut" },
        0.15,
      );

      // --- 1 · Shrunk on the device -----------------------------------------
      tl.to(camera, { x: 330, duration: 0.25, ease: "power2.inOut" }, 1);
      tiles.forEach((t, i) => {
        const at = 1.05 + i * 0.03;
        tl.fromTo(
          t.querySelector("[data-shine]"),
          { xPercent: -120 },
          { xPercent: 120, duration: 0.12, ease: "power1.inOut" },
          at,
        );
        tl.to(
          t.querySelector("[data-before]"),
          { autoAlpha: 0, duration: 0.03 },
          at + 0.06,
        );
        tl.fromTo(
          t.querySelector("[data-after]"),
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.03 },
          at + 0.06,
        );
      });
      count(
        tl,
        q("[data-total]")[0],
        copy.before.total,
        copy.after.total,
        1.05,
        0.42,
        (v) => `${v < 10 ? v.toFixed(1) : Math.round(v)} MB`,
      );
      tl.to(q("[data-total]"), { color: "#ede8df", duration: 0.1 }, 1.4);
      tl.to(
        q("[data-bar]"),
        {
          scaleX: copy.after.total / copy.before.total,
          backgroundColor: "#3fbf6f",
          duration: 0.42,
          ease: "power1.inOut",
        },
        1.05,
      );
      tl.fromTo(
        q("[data-local]"),
        { autoAlpha: 0, y: 8 },
        { autoAlpha: 1, y: 0, duration: 0.12 },
        1.5,
      );

      // --- 2 · Laid out as pages --------------------------------------------
      tl.to(camera, { x: 300, duration: 0.2, ease: "power2.inOut" }, 2);
      tl.to(q("[data-app]"), { autoAlpha: 0, x: -30, duration: 0.15 }, 2);
      tl.to(q("[data-stats]"), { autoAlpha: 0, x: 30, duration: 0.15 }, 2);
      q("[data-page]").forEach((p, k) => {
        tl.fromTo(
          p,
          { autoAlpha: 0, y: 30, rotate: 0 },
          { autoAlpha: 1, y: 0, duration: 0.15 },
          2.1 + k * 0.07,
        );
        tl.fromTo(
          p.querySelectorAll("[data-thumb]"),
          { autoAlpha: 0, scale: 0.6 },
          {
            autoAlpha: 1,
            scale: 1,
            stagger: 0.03,
            duration: 0.08,
            ease: "back.out(2)",
          },
          2.2 + k * 0.1,
        );
      });

      // --- 3 · One small PDF ------------------------------------------------
      q("[data-page]").forEach((p, k) => {
        tl.to(
          p,
          {
            x: (1 - k) * 125,
            y: -10 + k * 6,
            rotate: (k - 1) * 4,
            scale: 0.8,
            duration: 0.18,
            ease: "power3.inOut",
          },
          3,
        );
      });
      tl.to(
        q("[data-pages]"),
        { autoAlpha: 0, scale: 0.6, duration: 0.12 },
        3.2,
      );
      tl.fromTo(
        q("[data-file]"),
        { autoAlpha: 0, scale: 0.7 },
        { autoAlpha: 1, scale: 1, duration: 0.16, ease: "back.out(1.6)" },
        3.22,
      );
      tl.fromTo(
        q("[data-cursor]"),
        { autoAlpha: 0, x: 380, y: 420 },
        { autoAlpha: 1, duration: 0.05 },
        3.35,
      );
      tl.to(
        q("[data-cursor]"),
        { x: 352, y: 296, duration: 0.12, ease: "power2.inOut" },
        3.38,
      );
      press(tl, q("[data-cursor], [data-send]"), 3.52);
      tl.to(q("[data-send-label]"), { autoAlpha: 0, duration: 0.03 }, 3.56);
      tl.fromTo(
        q("[data-sent]"),
        { autoAlpha: 0, scale: 0.7 },
        { autoAlpha: 1, scale: 1, duration: 0.08, ease: "back.out(2)" },
        3.58,
      );

      tl.set({}, {}, copy.steps.length);
      register(tl);
    },
    { scope: root },
  );

  return (
    <div ref={root} className="text-bone relative h-full w-full text-[12px]">
      {/* The app */}
      <Panel data-app className="top-[16px] left-0 h-[428px] w-[350px]">
        <div className="flex h-[50px] items-center justify-between px-4">
          <p className="text-[15px] font-medium tracking-[-0.01em]">PicPress</p>
          <p className="label text-bone-muted text-[9px]">
            {copy.photos} photos
          </p>
        </div>
        {Array.from({ length: copy.photos }, (_, i) => (
          <div
            key={i}
            data-tile
            className="absolute overflow-hidden rounded-[6px]"
            style={{
              left: 16 + (i % 3) * (TILE_W + GAP),
              top: 50 + Math.floor(i / 3) * (TILE_H + GAP),
              width: TILE_W,
              height: TILE_H,
            }}
          >
            <Photo i={i} className="h-full w-full" />
            <span
              data-shine
              className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            />
            <span className="absolute bottom-1 left-1 grid rounded-[4px] bg-black/60 px-1.5 py-0.5 text-[9px] tabular-nums">
              <span
                data-before
                className="col-start-1 row-start-1 text-[#ff8a6a]"
              >
                {copy.before.each}
              </span>
              <span
                data-after
                className="col-start-1 row-start-1 text-[#8fe0ad]"
              >
                {copy.after.each}
              </span>
            </span>
          </div>
        ))}
        <div className="bg-bone text-ink absolute right-4 bottom-4 left-4 grid h-[38px] place-items-center rounded-[9px] text-[12px] font-medium">
          Make PDF
        </div>
      </Panel>

      {/* Size */}
      <Panel data-stats className="top-[110px] right-0 w-[220px] p-4">
        <p className="label text-bone-muted text-[9px]">Total size</p>
        <p
          data-total
          className="mt-1 text-[34px] font-semibold tracking-[-0.04em] text-[#ff6a45] tabular-nums"
        >
          0 MB
        </p>
        <span className="bg-bone-faint mt-3 block h-[5px] overflow-hidden rounded-full">
          <span
            data-bar
            className="block h-full w-full origin-left rounded-full bg-[#ff6a45]"
          />
        </span>
        <p data-local className="mt-4 flex items-center gap-2 text-[11px]">
          <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true">
            <path
              d="M4 10h8.5a3 3 0 0 0 .3-6A4.5 4.5 0 0 0 4.2 4.5 2.8 2.8 0 0 0 4 10Z"
              fill="none"
              stroke="#8fe0ad"
              strokeWidth="1.2"
            />
            <path d="M2 1l12 10" stroke="#8fe0ad" strokeWidth="1.2" />
          </svg>
          <span>
            <span className="text-[#8fe0ad]">0 bytes</span> uploaded
          </span>
        </p>
      </Panel>

      {/* Pages */}
      <div data-pages className="absolute inset-0">
        {[0, 1, 2].map((k) => (
          <div
            key={k}
            data-page
            className="absolute rounded-[4px] bg-[#f3efe7] p-[9px] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.9)]"
            style={{ left: 120 + k * 125, top: 110, width: 115, height: 162 }}
          >
            <div className="grid h-full grid-cols-2 grid-rows-2 gap-[6px]">
              {[0, 1, 2, 3].map((j) => (
                <span key={j} data-thumb className="block">
                  <Photo i={k * 4 + j} className="h-full w-full" />
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* The file */}
      <Panel
        data-file
        className="top-[120px] left-[175px] w-[250px] p-5 text-center"
      >
        <span className="mx-auto grid h-[66px] w-[52px] place-items-center rounded-[6px] bg-[#f3efe7] text-[10px] font-bold tracking-[0.06em] text-[#c0392b]">
          PDF
        </span>
        <p className="mt-3 text-[15px] font-medium">{copy.file}</p>
        <p className="text-bone-muted text-[11px] tabular-nums">
          {copy.after.total} MB · 3 pages
        </p>
        <div
          data-send
          className="bg-bone text-ink relative mt-4 grid h-[38px] place-items-center rounded-[9px] text-[12px] font-medium"
        >
          <span data-send-label>Send</span>
          <span data-sent className="absolute">
            ✓ Sent
          </span>
        </div>
      </Panel>

      <Pointer />
    </div>
  );
}
