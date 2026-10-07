"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { wayframe as copy } from "@/lib/scenes/wayframe";
import { useCamera } from "../SceneFrame";
import type { SceneProps } from "./types";
import { Panel, Pointer, press, type } from "./ui";

/**
 * Wayframe, acted out: a sentence is typed, the screen flow draws itself, the
 * pattern check lights up the screens nobody designed, and accepting them
 * closes the gaps.
 */

const W = 112;
const H = 46;
type Node = { label: string; x: number; y: number; ghost?: boolean };
const [home, search, listing, cart, checkout, placed] = copy.screens;
const [noResults, signIn, reset] = copy.missing;
const NODES: Node[] = [
  { label: home, x: 24, y: 126 },
  { label: search, x: 172, y: 126 },
  { label: listing, x: 320, y: 126 },
  { label: cart, x: 468, y: 126 },
  { label: checkout, x: 468, y: 256 },
  { label: placed, x: 320, y: 256 },
  // Ghosts in the order they light up; EDGES lists their edges in the same order.
  { label: noResults, x: 172, y: 372, ghost: true },
  { label: signIn, x: 468, y: 372, ghost: true },
  { label: reset, x: 320, y: 372, ghost: true },
];
const at = (label: string) => NODES.find((n) => n.label === label)!;
const right = (n: Node) => [n.x + W, n.y + H / 2] as const;
const left = (n: Node) => [n.x, n.y + H / 2] as const;
const bottom = (n: Node) => [n.x + W / 2, n.y + H] as const;
const top = (n: Node) => [n.x + W / 2, n.y] as const;

type Edge = {
  from: readonly [number, number];
  to: readonly [number, number];
  ghost?: boolean;
};
const EDGES: Edge[] = [
  { from: right(at(home)), to: left(at(search)) },
  { from: right(at(search)), to: left(at(listing)) },
  { from: right(at(listing)), to: left(at(cart)) },
  { from: bottom(at(cart)), to: top(at(checkout)) },
  { from: left(at(checkout)), to: right(at(placed)) },
  { from: bottom(at(search)), to: top(at(noResults)), ghost: true },
  { from: bottom(at(checkout)), to: top(at(signIn)), ghost: true },
  { from: left(at(signIn)), to: right(at(reset)), ghost: true },
];

function Screen({ node }: { node: Node }) {
  return (
    <div
      data-node={node.ghost ? "ghost" : "real"}
      className="absolute flex items-center gap-2.5 rounded-[10px] border px-3"
      style={{
        left: node.x,
        top: node.y,
        width: W,
        height: H,
        borderStyle: node.ghost ? "dashed" : "solid",
        borderColor: node.ghost ? "#ff4a1c" : "var(--bone-faint)",
        background: node.ghost ? "rgba(255,74,28,0.06)" : "#161514",
        color: node.ghost ? "#ff4a1c" : "var(--bone)",
      }}
    >
      <span
        className="block h-[20px] w-[14px] shrink-0 rounded-[3px] border"
        style={{ borderColor: "currentColor", opacity: 0.6 }}
      />
      <span className="text-[12px] leading-tight font-medium">
        {node.label}
      </span>
      {node.ghost ? (
        <span
          data-missing
          className="text-ink absolute -top-2.5 right-2 rounded-full bg-[#ff4a1c] px-1.5 py-0.5 text-[8px] font-semibold tracking-[0.08em] uppercase"
        >
          missing
        </span>
      ) : null}
    </div>
  );
}

export default function WayframeScene({ register }: SceneProps) {
  const root = useRef<HTMLDivElement>(null);
  const camera = useCamera();

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const tl = gsap.timeline({
        paused: true,
        defaults: { ease: "power3.out", duration: 0.2 },
      });
      const real = q('[data-node="real"]');
      const ghosts = q('[data-node="ghost"]');
      const edges = q('[data-edge="real"]');
      const ghostEdges = q('[data-edge="ghost"]');

      tl.set(camera, { x: 300 }, 0);
      // --- 0 · Describe the app --------------------------------------------
      tl.fromTo(
        q("[data-prompt]"),
        { autoAlpha: 0, y: -14 },
        { autoAlpha: 1, y: 0, duration: 0.2 },
        0,
      );
      type(tl, q("[data-typed]"), copy.prompt.length, 0.12, 0.45);
      tl.fromTo(
        q("[data-caret]"),
        { opacity: 1 },
        { opacity: 0, duration: 0.02 },
        0.6,
      );
      tl.fromTo(
        q("[data-cursor]"),
        { autoAlpha: 0, x: 420, y: 140 },
        { autoAlpha: 1, duration: 0.06 },
        0.5,
      );
      tl.to(
        q("[data-cursor]"),
        { x: 532, y: 46, duration: 0.14, ease: "power2.inOut" },
        0.56,
      );
      press(tl, q("[data-cursor], [data-generate]"), 0.72);

      // --- 1 · Get the flow -------------------------------------------------
      tl.to(q("[data-cursor]"), { autoAlpha: 0, duration: 0.06 }, 1);
      tl.fromTo(
        camera,
        { x: 160 },
        { x: 440, duration: 0.6, ease: "power1.inOut", immediateRender: false },
        1.05,
      );
      real.forEach((n, i) => {
        const t = 1.05 + i * 0.1;
        tl.fromTo(
          n,
          { autoAlpha: 0, scale: 0.85 },
          { autoAlpha: 1, scale: 1, duration: 0.1, ease: "back.out(2)" },
          t,
        );
        // Opacity too: the arrowhead marker ignores the dash and would show early.
        if (edges[i])
          tl.fromTo(
            edges[i],
            { strokeDashoffset: 1, opacity: 0 },
            { strokeDashoffset: 0, opacity: 1, duration: 0.08, ease: "none" },
            t + 0.08,
          );
      });

      // --- 2 · See what you forgot -----------------------------------------
      tl.to(camera, { x: 330, duration: 0.2, ease: "power2.inOut" }, 2);
      tl.to(q("[data-typed-line]"), { autoAlpha: 0, y: -8, duration: 0.08 }, 2);
      tl.fromTo(
        q("[data-check]"),
        { autoAlpha: 0, y: 8 },
        { autoAlpha: 1, y: 0, duration: 0.12 },
        2.06,
      );
      tl.fromTo(
        q("[data-scan]"),
        { autoAlpha: 0, x: 0 },
        { autoAlpha: 1, x: 560, duration: 0.35, ease: "power1.inOut" },
        2.08,
      );
      tl.to(q("[data-scan]"), { autoAlpha: 0, duration: 0.04 }, 2.42);
      ghosts.forEach((n, i) => {
        const t = 2.2 + i * 0.1;
        tl.fromTo(
          ghostEdges[i],
          { strokeDashoffset: 1, opacity: 0 },
          { strokeDashoffset: 0, opacity: 1, duration: 0.08, ease: "none" },
          t,
        );
        tl.fromTo(
          n,
          { autoAlpha: 0, scale: 0.85 },
          { autoAlpha: 1, scale: 1, duration: 0.1, ease: "back.out(2)" },
          t + 0.06,
        );
      });

      // --- 3 · Fix it before it's code -------------------------------------
      tl.to(camera, { x: 380, duration: 0.2, ease: "power2.inOut" }, 3);
      tl.to(
        q("[data-missing]"),
        { autoAlpha: 0, scale: 0.6, duration: 0.08, stagger: 0.06 },
        3.05,
      );
      tl.to(
        ghosts,
        {
          borderColor: "rgba(237,232,223,0.16)",
          backgroundColor: "#161514",
          color: "#ede8df",
          borderStyle: "solid",
          duration: 0.1,
          stagger: 0.06,
        },
        3.1,
      );
      tl.to(
        ghostEdges,
        { stroke: "rgba(237,232,223,0.45)", duration: 0.1, stagger: 0.06 },
        3.1,
      );
      tl.to(q("[data-check]"), { autoAlpha: 0, y: -8, duration: 0.08 }, 3.3);
      tl.fromTo(
        q("[data-done]"),
        { autoAlpha: 0, y: 8 },
        { autoAlpha: 1, y: 0, duration: 0.12 },
        3.36,
      );

      tl.set({}, {}, copy.steps.length);
      register(tl);
    },
    { scope: root },
  );

  return (
    <div ref={root} className="text-bone relative h-full w-full">
      {/* Prompt */}
      <Panel
        data-prompt
        className="top-[14px] left-[20px] h-[70px] w-[560px] overflow-hidden px-4 py-3"
      >
        <p className="label text-bone-muted text-[9px]">Describe your app</p>
        <div className="relative mt-1.5 h-[22px]">
          <p
            data-typed-line
            className="absolute inset-0 flex items-center text-[15px] tracking-[-0.01em]"
          >
            <span data-typed className="whitespace-nowrap">
              {copy.prompt}
            </span>
            <span
              data-caret
              className="bg-signal ml-0.5 inline-block h-[16px] w-[2px]"
            />
          </p>
          <p
            data-check
            className="text-signal absolute inset-0 flex items-center text-[14px] font-medium"
          >
            Checked against {copy.compared} similar apps · {copy.missing.length}{" "}
            screens missing
          </p>
          <p
            data-done
            className="absolute inset-0 flex items-center text-[14px] font-medium text-[#3fbf6f]"
          >
            ✓ Flow complete · {copy.screens.length + copy.missing.length}{" "}
            screens
          </p>
        </div>
        <span
          data-generate
          className="bg-bone text-ink absolute top-1/2 right-3 grid h-[34px] -translate-y-1/2 place-items-center rounded-[8px] px-3.5 text-[12px] font-medium"
        >
          Generate
        </span>
      </Panel>

      {/* Edges */}
      <svg
        viewBox="0 0 600 460"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <marker
            id="wf-arrow"
            viewBox="0 0 8 8"
            refX="7"
            refY="4"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path d="M0 0 L8 4 L0 8 Z" fill="rgba(237,232,223,0.6)" />
          </marker>
        </defs>
        {EDGES.map((e, i) => (
          <line
            key={i}
            data-edge={e.ghost ? "ghost" : "real"}
            x1={e.from[0]}
            y1={e.from[1]}
            x2={e.to[0]}
            y2={e.to[1]}
            pathLength={1}
            strokeDasharray="1 1"
            stroke={e.ghost ? "#ff4a1c" : "rgba(237,232,223,0.45)"}
            strokeWidth={1.5}
            markerEnd="url(#wf-arrow)"
          />
        ))}
      </svg>

      {NODES.map((n) => (
        <Screen key={n.label} node={n} />
      ))}

      {/* The pattern check's sweep */}
      <span
        data-scan
        className="bg-signal pointer-events-none absolute top-[100px] left-[20px] h-[340px] w-[2px] shadow-[0_0_24px_6px_rgba(255,74,28,0.45)]"
      />

      <Pointer />
    </div>
  );
}
