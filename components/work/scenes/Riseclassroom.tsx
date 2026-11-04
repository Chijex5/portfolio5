"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { riseclassroom as copy } from "@/lib/scenes/riseclassroom";
import { useCamera } from "../SceneFrame";
import type { SceneProps } from "./types";
import { Chrome, count, Panel, Pointer, press } from "./ui";

/**
 * Rise Classroom, acted out on one cohort: thirty-two seats fill from an invite
 * link, fall into mentor groups, three students go quiet and get a check-in,
 * then the week's attendance and an assignment deadline fill in beside them.
 */

const VIOLET = "#9d8cff";
const AMBER = "#f2b45a";
const GREEN = "#3fbf6f";
const INITIALS = [
  "AO",
  "TN",
  "KE",
  "ZB",
  "FI",
  "NC",
  "KO",
  "BA",
  "IM",
  "SU",
  "CE",
  "DA",
  "OL",
  "EM",
  "YA",
  "JU",
  "PR",
  "GO",
  "AK",
  "BO",
  "RE",
  "TO",
  "VI",
  "ON",
  "NK",
  "LA",
  "HU",
  "FD",
  "MI",
  "SE",
  "UC",
  "CH",
];

const AV = 26;
/** Seats as a plain grid: 8 across, as they join. */
const grid = (i: number) => ({
  x: 34 + (i % 8) * 42,
  y: 130 + Math.floor(i / 8) * 46,
});
/** Seats in mentor groups: four columns of eight, two by four. */
const group = (i: number) => {
  const g = Math.floor(i / 8);
  const k = i % 8;
  return { x: 30 + g * 88 + (k % 2) * 34, y: 150 + Math.floor(k / 2) * 44 };
};
const QUIET = new Set<number>(copy.quiet.map((s) => s.seat));

export default function RiseclassroomScene({ register }: SceneProps) {
  const root = useRef<HTMLDivElement>(null);
  const camera = useCamera();

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const tl = gsap.timeline({
        paused: true,
        defaults: { ease: "power3.out", duration: 0.2 },
      });
      const seats = q("[data-seat]");

      tl.set(camera, { x: 210 }, 0);
      tl.fromTo(
        q("[data-app]"),
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: 0.25 },
        0,
      );

      // --- 0 · A cohort starts ---------------------------------------------
      tl.fromTo(
        q("[data-invite]"),
        { autoAlpha: 0, y: 8 },
        { autoAlpha: 1, y: 0, duration: 0.12 },
        0.2,
      );
      tl.fromTo(
        seats,
        { autoAlpha: 0, scale: 0.3 },
        {
          autoAlpha: 1,
          scale: 1,
          duration: 0.08,
          stagger: 0.016,
          ease: "back.out(2.4)",
        },
        0.3,
      );
      count(tl, q("[data-count]")[0], 0, copy.students, 0.3, 0.55);

      // --- 1 · Mentors get their people ------------------------------------
      tl.to(q("[data-invite]"), { autoAlpha: 0, duration: 0.08 }, 1);
      seats.forEach((el, i) => {
        const a = grid(i);
        const b = group(i);
        tl.to(
          el,
          {
            x: b.x - a.x,
            y: b.y - a.y,
            duration: 0.3,
            ease: "power2.inOut",
          },
          1.05 + (i % 8) * 0.008,
        );
      });
      tl.fromTo(
        q("[data-mentor]"),
        { autoAlpha: 0, y: -6 },
        { autoAlpha: 1, y: 0, duration: 0.12, stagger: 0.05 },
        1.3,
      );

      // --- 2 · Someone goes quiet ------------------------------------------
      tl.to(camera, { x: 440, duration: 0.25, ease: "power2.inOut" }, 2);
      tl.to(
        q("[data-seat-face][data-quiet]"),
        { opacity: 0.35, duration: 0.1 },
        2.05,
      );
      tl.fromTo(
        q("[data-ring]"),
        { autoAlpha: 0, scale: 1.6 },
        { autoAlpha: 1, scale: 1, duration: 0.12, stagger: 0.04 },
        2.08,
      );
      tl.fromTo(
        q("[data-quiet-card]"),
        { autoAlpha: 0, x: 20 },
        { autoAlpha: 1, x: 0, duration: 0.18 },
        2.15,
      );
      tl.fromTo(
        q("[data-cursor]"),
        { autoAlpha: 0, x: 560, y: 430 },
        { autoAlpha: 1, duration: 0.05 },
        2.4,
      );
      tl.to(
        q("[data-cursor]"),
        { x: 472, y: 247, duration: 0.14, ease: "power2.inOut" },
        2.44,
      );
      press(tl, q("[data-cursor], [data-check-in]"), 2.62);
      tl.to(q("[data-check-label]"), { autoAlpha: 0, duration: 0.03 }, 2.66);
      tl.fromTo(
        q("[data-checked]"),
        { autoAlpha: 0, scale: 0.7 },
        { autoAlpha: 1, scale: 1, duration: 0.08, ease: "back.out(2)" },
        2.68,
      );
      tl.to(q("[data-cursor]"), { autoAlpha: 0, duration: 0.08 }, 2.85);

      // --- 3 · Attendance and work, one place ------------------------------
      tl.to(q("[data-quiet-card]"), { autoAlpha: 0, x: 16, duration: 0.1 }, 3);
      tl.fromTo(
        q("[data-week]"),
        { autoAlpha: 0, x: 20 },
        { autoAlpha: 1, x: 0, duration: 0.18 },
        3.06,
      );
      tl.fromTo(
        q("[data-bar]"),
        { scaleY: 0 },
        { scaleY: 1, duration: 0.2, stagger: 0.05, ease: "power2.out" },
        3.15,
      );
      tl.fromTo(
        q("[data-progress]"),
        { scaleX: 0 },
        {
          scaleX: copy.assignment.submitted / copy.students,
          duration: 0.5,
          ease: "power1.inOut",
        },
        3.3,
      );
      count(
        tl,
        q("[data-submitted]")[0],
        0,
        copy.assignment.submitted,
        3.3,
        0.5,
      );

      tl.set({}, {}, copy.steps.length);
      register(tl);
    },
    { scope: root },
  );

  return (
    <div ref={root} className="text-ink relative h-full w-full text-[12px]">
      {/* The cohort */}
      <Panel data-app className="top-[16px] left-0 h-[428px] w-[380px]">
        <Chrome url="riseclassroom" />
        <div className="flex items-end justify-between px-4 pt-4">
          <div>
            <p className="label text-ink-muted text-[9px]">Cohort</p>
            <p className="mt-1 text-[15px] font-medium tracking-[-0.01em]">
              {copy.cohort}
            </p>
          </div>
          <p className="text-ink-muted text-[11px] tabular-nums">
            <span data-count className="text-ink text-[22px] font-semibold">
              0
            </span>{" "}
            / {copy.students} students
          </p>
        </div>

        <p
          data-invite
          className="border-ink-faint absolute top-[396px] right-4 left-4 flex items-center justify-between rounded-[9px] border px-3 py-2 text-[11px]"
        >
          <span className="text-ink-muted">rise.link/fe-cohort-4</span>
          <span style={{ color: VIOLET }}>Invite link copied</span>
        </p>

        {copy.mentors.map((m, g) => (
          <p
            key={m}
            data-mentor
            className="absolute text-[10px] leading-tight"
            style={{ left: 30 + g * 88, top: 118 }}
          >
            <span className="label text-ink-muted block text-[8px]">
              Mentor
            </span>
            {m}
          </p>
        ))}

        {INITIALS.map((ini, i) => {
          const p = grid(i);
          const quiet = QUIET.has(i);
          return (
            <span
              key={i}
              data-seat
              className="absolute"
              style={{ left: p.x, top: p.y, width: AV, height: AV }}
            >
              <span
                data-seat-face
                data-quiet={quiet ? "" : undefined}
                className="grid h-full w-full place-items-center rounded-full text-[9px] font-semibold"
                style={{
                  background: `hsl(${(i * 47) % 360} 30% 26%)`,
                  color: `hsl(${(i * 47) % 360} 60% 82%)`,
                }}
              >
                {ini}
              </span>
              {quiet && (
                <span
                  data-ring
                  className="absolute -inset-[4px] rounded-full border-2"
                  style={{ borderColor: AMBER }}
                />
              )}
            </span>
          );
        })}
      </Panel>

      {/* Gone quiet */}
      <Panel data-quiet-card className="top-[96px] right-0 w-[236px] p-4">
        <p className="label text-[9px]" style={{ color: AMBER }}>
          Gone quiet
        </p>
        <ul className="mt-3 space-y-2.5">
          {copy.quiet.map((s) => (
            <li key={s.seat} className="flex items-center justify-between">
              <span className="text-[12px]">{s.name}</span>
              <span className="text-ink-muted text-[10px]">{s.days} days</span>
            </li>
          ))}
        </ul>
        <div
          data-check-in
          className="relative mt-4 grid h-[34px] place-items-center rounded-[9px] text-[12px] font-medium text-[#0f0c0a]"
          style={{ background: VIOLET }}
        >
          <span data-check-label>Check in with all 3</span>
          <span
            data-checked
            className="absolute inset-0 grid place-items-center rounded-[9px] text-white"
            style={{ background: GREEN }}
          >
            Sent ✓
          </span>
        </div>
      </Panel>

      {/* This week */}
      <Panel data-week className="top-[70px] right-0 w-[236px] p-4">
        <p className="label text-ink-muted text-[9px]">
          Attendance · this week
        </p>
        <div className="mt-3 flex h-[86px] items-end gap-2.5">
          {copy.attendance.map((v, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <span
                data-bar
                className="w-full origin-bottom rounded-[3px]"
                style={{
                  height: `${v * 0.8}px`,
                  background: v < 80 ? AMBER : VIOLET,
                }}
              />
              <span className="text-ink-muted text-[9px]">{"MTWTF"[i]}</span>
            </div>
          ))}
        </div>
        <div className="border-ink-faint mt-4 border-t pt-3">
          <p className="label text-ink-muted text-[9px]">Assignment</p>
          <p className="mt-1 text-[12px]">{copy.assignment.title}</p>
          <div className="bg-ink-faint mt-2.5 h-[6px] overflow-hidden rounded-full">
            <span
              data-progress
              className="block h-full w-full origin-left rounded-full"
              style={{ background: GREEN }}
            />
          </div>
          <p className="text-ink-muted mt-1.5 text-[10px] tabular-nums">
            <span data-submitted className="text-ink">
              0
            </span>{" "}
            / {copy.students} submitted
          </p>
        </div>
      </Panel>

      <Pointer />
    </div>
  );
}
