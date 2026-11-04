"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import SceneFrame, { useCamera } from "@/components/work/SceneFrame";
import { type } from "@/components/work/scenes/ui";
import { cn } from "@/lib/utils";

/**
 * "From the database to the button": one small feature — marking attendance
 * for a class — built in front of the visitor in four scrolls. The tables,
 * then the endpoint, then the screen roughed out, then the screen finished
 * and its button pressed.
 *
 * Laid out on the same fixed 600 × 460 canvas as the project scenes, so the
 * frame scales it (and, on a phone, follows the camera) the same way; but on
 * paper rather than a dark device, because this is a drawing of how a thing
 * is made, not the thing itself.
 */

const STEPS = [
  {
    title: "The data",
    body: "Tables first: students, sessions, and who actually showed up.",
  },
  {
    title: "The API",
    body: "One endpoint to mark a class, checked before it touches the database.",
  },
  {
    title: "The interface",
    body: "The screen, roughed out: who's here, who isn't, one button.",
  },
  {
    title: "The polish",
    body: "Real names, real states, and a button that tells you it worked.",
  },
] as const;

const TABLES = [
  {
    name: "students",
    y: 24,
    fields: [
      ["id", "uuid"],
      ["name", "text"],
      ["cohort_id", "uuid"],
    ],
  },
  {
    name: "sessions",
    y: 166,
    fields: [
      ["id", "uuid"],
      ["cohort_id", "uuid"],
      ["starts_at", "time"],
    ],
  },
  {
    name: "attendance",
    y: 308,
    fields: [
      ["student_id", "uuid"],
      ["session_id", "uuid"],
      ["present", "bool"],
    ],
  },
] as const;

const PEOPLE = [
  { name: "Ada Okafor", initials: "AO", present: true, hue: 18 },
  { name: "Tobi Nwosu", initials: "TN", present: true, hue: 210 },
  { name: "Kelechi Eze", initials: "KE", present: false, hue: 140 },
  { name: "Zainab Bello", initials: "ZB", present: true, hue: 280 },
  { name: "Femi Ibe", initials: "FI", present: true, hue: 40 },
] as const;

const TABLE_X = 20;
const TABLE_W = 190;
const ROW_H = 24;
const HEAD_H = 30;

export default function BuildSequence() {
  const root = useRef<HTMLElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const tl = timelineRef.current;
      if (!tl) return;
      const items = gsap.utils.toArray<HTMLElement>("[data-step]", el);
      const bars = gsap.utils.toArray<HTMLElement>("[data-step-bar]", el);
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

      let active = -1;
      tl.eventCallback("onUpdate", () => {
        const t = tl.time();
        const next = Math.min(STEPS.length - 1, Math.max(0, Math.floor(t)));
        bars.forEach((b, i) =>
          gsap.set(b, { scaleX: Math.min(1, Math.max(0, t - i)) }),
        );
        if (next === active) return;
        active = next;
        items.forEach((it, i) => it.toggleAttribute("data-active", i === next));
      });

      ScrollTrigger.create({
        trigger: el,
        start: "top 55%",
        end: "bottom bottom",
        animation: tl,
        scrub: reduced ? true : 0.7,
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="build"
      aria-labelledby="build-title"
      className="relative"
      style={{ height: `${STEPS.length * 85 + 100}svh` }}
    >
      <div className="sticky top-0 grid h-svh grid-rows-[auto_1fr_auto] gap-y-6 px-4 pt-24 pb-20 md:grid-cols-12 md:grid-rows-1 md:gap-x-10 md:px-10 md:pt-[clamp(6rem,14vh,8rem)] md:pb-24">
        {/* The copy ------------------------------------------------------ */}
        <div className="flex flex-col md:col-span-4 md:justify-between">
          <div>
            <p className="label mb-4 flex items-center md:mb-6">
              <span className="text-accent">(01)</span>
              <span className="bg-ink-faint mx-3 h-px w-8" />
              <span className="text-ink-muted">How I build</span>
            </p>
            <h2
              id="build-title"
              className="display max-w-[11ch] text-[clamp(2.2rem,min(4.4vw,7.5vh),5rem)]"
            >
              From the database to the <em className="turn">button.</em>
            </h2>
          </div>

          <ol className="mt-8 hidden md:block">
            {STEPS.map((s, i) => (
              <li
                key={s.title}
                data-step
                className="group border-ink-faint relative border-t py-3.5 opacity-40 transition-opacity duration-500 data-[active]:opacity-100"
              >
                <span
                  data-step-bar
                  aria-hidden="true"
                  className="bg-accent absolute -top-px left-0 h-px w-full origin-left scale-x-0"
                />
                <p className="flex items-baseline gap-4">
                  <span className="label text-ink-muted tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[clamp(1.15rem,1.5vw,1.45rem)] font-medium tracking-[-0.02em]">
                    {s.title}
                  </span>
                </p>
                {/* Only the step in progress says more than its name. */}
                <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 ease-[var(--ease-out-expo)] group-data-[active]:grid-rows-[1fr]">
                  <p className="text-ink-muted ml-[calc(2ch+1rem)] min-h-0 max-w-[34ch] overflow-hidden pt-1.5 text-[0.95rem] leading-snug">
                    {s.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* The drawing ---------------------------------------------------- */}
        <SceneFrame
          tone="paper"
          className="blueprint row-start-2 min-h-0 md:col-span-8 md:col-start-5 md:row-start-1"
        >
          <Drawing register={(tl) => (timelineRef.current = tl)} />
        </SceneFrame>

        {/* Phone: the current step only, under the drawing. */}
        <ol className="grid md:hidden">
          {STEPS.map((s, i) => (
            <li
              key={s.title}
              data-step
              className="col-start-1 row-start-1 opacity-0 transition-opacity duration-500 data-[active]:opacity-100"
            >
              <p className="flex items-baseline gap-3">
                <span className="label text-accent tabular-nums">
                  {String(i + 1).padStart(2, "0")} / 04
                </span>
                <span className="text-[1.2rem] font-medium tracking-[-0.02em]">
                  {s.title}
                </span>
              </p>
              <p className="text-ink-muted mt-1 text-[0.95rem] leading-snug">
                {s.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** The canvas: built as one paused timeline, one unit of time per step. */
function Drawing({ register }: { register: (tl: gsap.core.Timeline) => void }) {
  const root = useRef<HTMLDivElement>(null);
  const camera = useCamera();

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const tl = gsap.timeline({
        paused: true,
        defaults: { ease: "power3.out", duration: 0.2 },
      });

      // --- 0 · The data -----------------------------------------------------
      tl.set(camera, { x: 118 }, 0);
      q("[data-table]").forEach((t, i) => {
        tl.fromTo(
          t,
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.18 },
          0.05 + i * 0.12,
        );
        tl.fromTo(
          t.querySelectorAll("[data-field]"),
          { autoAlpha: 0, x: -6 },
          { autoAlpha: 1, x: 0, duration: 0.1, stagger: 0.04 },
          0.15 + i * 0.12,
        );
      });
      tl.fromTo(
        q("[data-relation]"),
        { strokeDashoffset: 1 },
        {
          strokeDashoffset: 0,
          duration: 0.3,
          ease: "power1.inOut",
          stagger: 0.1,
        },
        0.55,
      );

      // --- 1 · The API ------------------------------------------------------
      tl.to(camera, { x: 412, duration: 0.3, ease: "power2.inOut" }, 1);
      tl.fromTo(
        q("[data-api]"),
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 0.2 },
        1.05,
      );
      tl.fromTo(
        q("[data-wire-api]"),
        { strokeDashoffset: 1 },
        { strokeDashoffset: 0, duration: 0.25, ease: "power1.inOut" },
        1.1,
      );
      q("[data-json]").forEach((line, i) =>
        type(tl, line, line.textContent?.length ?? 10, 1.25 + i * 0.07, 0.12),
      );
      tl.fromTo(
        q("[data-created]"),
        { autoAlpha: 0, scale: 0.8 },
        { autoAlpha: 1, scale: 1, duration: 0.12, ease: "back.out(2)" },
        1.75,
      );

      // --- 2 · The interface ------------------------------------------------
      tl.to(
        q("[data-blueprint]"),
        { autoAlpha: 0.18, scale: 0.97, duration: 0.25 },
        2,
      );
      tl.fromTo(
        q("[data-window]"),
        { autoAlpha: 0, y: 40 },
        { autoAlpha: 1, y: 0, duration: 0.28, ease: "expo.out" },
        2.05,
      );
      tl.fromTo(
        q("[data-wire]"),
        { autoAlpha: 0, scaleX: 0.2 },
        {
          autoAlpha: 1,
          scaleX: 1,
          duration: 0.14,
          stagger: 0.025,
          transformOrigin: "left center",
        },
        2.25,
      );

      // --- 3 · The polish ---------------------------------------------------
      tl.to(
        q("[data-wire]"),
        { autoAlpha: 0, duration: 0.1, stagger: 0.015 },
        3,
      );
      tl.fromTo(
        q("[data-real]"),
        { autoAlpha: 0, y: 6 },
        { autoAlpha: 1, y: 0, duration: 0.14, stagger: 0.03 },
        3.04,
      );
      tl.fromTo(
        q("[data-toggle-on]"),
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 0.1,
          stagger: 0.04,
          transformOrigin: "left center",
        },
        3.2,
      );
      tl.fromTo(
        q("[data-cursor]"),
        { autoAlpha: 0, x: 520, y: 440 },
        { autoAlpha: 1, duration: 0.05 },
        3.45,
      );
      tl.to(
        q("[data-cursor]"),
        { x: 410, y: 404, duration: 0.14, ease: "power2.inOut" },
        3.48,
      );
      tl.to(
        q("[data-cursor], [data-save]"),
        { scale: 0.88, duration: 0.03, yoyo: true, repeat: 1 },
        3.64,
      );
      tl.to(q("[data-save-label]"), { autoAlpha: 0, duration: 0.03 }, 3.68);
      tl.fromTo(
        q("[data-saved]"),
        { autoAlpha: 0, scale: 0.7 },
        { autoAlpha: 1, scale: 1, duration: 0.08, ease: "back.out(2)" },
        3.7,
      );
      tl.fromTo(
        q("[data-toast]"),
        { autoAlpha: 0, y: -12 },
        { autoAlpha: 1, y: 0, duration: 0.12 },
        3.76,
      );
      tl.to(q("[data-cursor]"), { autoAlpha: 0, duration: 0.08 }, 3.9);

      tl.set({}, {}, STEPS.length);
      register(tl);
    },
    { scope: root },
  );

  const present = PEOPLE.filter((p) => p.present).length;

  return (
    <div ref={root} className="text-ink relative h-full w-full text-[12px]">
      {/* Blueprint: the schema and the endpoint ---------------------------- */}
      <div data-blueprint className="absolute inset-0 origin-center">
        {/* Relations, drawn behind the tables. */}
        <svg
          className="absolute inset-0 h-full w-full overflow-visible"
          fill="none"
          aria-hidden="true"
        >
          <path
            data-relation
            pathLength={1}
            strokeDasharray="1"
            d={`M ${TABLE_X + TABLE_W} ${TABLES[0].y + HEAD_H + ROW_H * 0.5} h 18 V ${TABLES[2].y + HEAD_H + ROW_H * 0.5} h -18`}
            stroke="var(--ink-muted)"
            strokeWidth="1.2"
          />
          <path
            data-relation
            pathLength={1}
            strokeDasharray="1"
            d={`M ${TABLE_X + TABLE_W} ${TABLES[1].y + HEAD_H + ROW_H * 0.5} h 8 V ${TABLES[2].y + HEAD_H + ROW_H * 1.5} h -8`}
            stroke="var(--ink-muted)"
            strokeWidth="1.2"
          />
          <path
            data-wire-api
            pathLength={1}
            strokeDasharray="1"
            d={`M ${TABLE_X + TABLE_W + 18} ${TABLES[2].y + 70} C 236 ${TABLES[2].y + 70}, 236 120, 252 120`}
            stroke="var(--accent)"
            strokeWidth="1.4"
          />
        </svg>

        {TABLES.map((t) => (
          <div
            key={t.name}
            data-table
            className="bg-paper border-ink-faint absolute overflow-hidden rounded-[10px] border shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)]"
            style={{ left: TABLE_X, top: t.y, width: TABLE_W }}
          >
            <p
              className="border-ink-faint flex items-center gap-2 border-b px-3 font-mono text-[11px]"
              style={{ height: HEAD_H }}
            >
              <span className="bg-accent h-1.5 w-1.5 rounded-full" />
              {t.name}
            </p>
            {t.fields.map(([f, kind], i) => (
              <p
                key={f}
                data-field
                className="flex items-center justify-between px-3 font-mono text-[10.5px]"
                style={{ height: ROW_H }}
              >
                <span className={i === 0 ? "text-accent" : undefined}>{f}</span>
                <span className="text-ink-muted">{kind}</span>
              </p>
            ))}
          </div>
        ))}

        <div
          data-api
          className="bg-paper border-ink-faint absolute overflow-hidden rounded-[10px] border shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)]"
          style={{ left: 252, top: 24, width: 328 }}
        >
          <p className="border-ink-faint flex h-[34px] items-center gap-2 border-b px-3 font-mono text-[11px]">
            <span className="bg-accent text-paper rounded-[4px] px-1.5 py-0.5 text-[9.5px] font-semibold tracking-[0.04em]">
              POST
            </span>
            /sessions/:id/attendance
          </p>
          <div className="px-3 py-3 font-mono text-[10.5px] leading-[1.7] whitespace-pre">
            {[
              "{",
              '  "present": ["ada", "tobi", "zainab", "femi"],',
              '  "absent":  ["kelechi"]',
              "}",
            ].map((l, i) => (
              <span key={i} data-json className="block">
                {l}
              </span>
            ))}
          </div>
          <p className="border-ink-faint flex items-center justify-between border-t px-3 py-2 font-mono text-[10.5px]">
            <span className="text-ink-muted">→ response</span>
            <span
              data-created
              className="border-accent text-accent rounded-full border px-2 py-0.5"
            >
              201 Created · 4 present
            </span>
          </p>
        </div>
      </div>

      {/* The screen -------------------------------------------------------- */}
      <div
        data-window
        className="bg-paper border-ink-faint absolute overflow-hidden rounded-[14px] border shadow-[0_30px_70px_-30px_rgba(0,0,0,0.5)]"
        style={{ left: 236, top: 20, width: 348, height: 420 }}
      >
        <div className="border-ink-faint flex h-[30px] items-center gap-1.5 border-b px-3">
          <span className="bg-ink-faint h-2 w-2 rounded-full" />
          <span className="bg-ink-faint h-2 w-2 rounded-full" />
          <span className="bg-ink-faint h-2 w-2 rounded-full" />
        </div>

        <div className="relative px-4 pt-4">
          {/* Header */}
          <div className="relative h-[46px]">
            <span
              data-wire
              className="bg-ink-faint absolute top-1 left-0 h-3 w-40 rounded-full"
            />
            <span
              data-wire
              className="bg-ink-faint absolute top-7 left-0 h-2 w-24 rounded-full"
            />
            <div
              data-real
              className="absolute inset-0 flex items-start justify-between"
            >
              <div>
                <p className="text-[14px] font-medium tracking-[-0.01em]">
                  Mark attendance
                </p>
                <p className="text-ink-muted mt-0.5 text-[11px]">
                  Frontend · Cohort 4 · Tuesday
                </p>
              </div>
              <p className="text-ink-muted text-[11px] tabular-nums">
                <span className="text-ink text-[18px] font-semibold">
                  {present}
                </span>{" "}
                / {PEOPLE.length}
              </p>
            </div>
          </div>

          {/* Rows */}
          <ul className="mt-2">
            {PEOPLE.map((p) => (
              <li
                key={p.name}
                className="border-ink-faint relative flex h-[50px] items-center border-t"
              >
                <span
                  data-wire
                  className="bg-ink-faint absolute left-0 h-7 w-7 rounded-full"
                />
                <span
                  data-wire
                  className="bg-ink-faint absolute left-10 h-2.5 w-28 rounded-full"
                />
                <span
                  data-wire
                  className="bg-ink-faint absolute right-0 h-5 w-9 rounded-full"
                />
                <div data-real className="flex w-full items-center gap-3">
                  <span
                    className="grid h-7 w-7 place-items-center rounded-full text-[9.5px] font-semibold"
                    style={{
                      background: `hsl(${p.hue} 45% 86%)`,
                      color: `hsl(${p.hue} 45% 28%)`,
                    }}
                  >
                    {p.initials}
                  </span>
                  <span className="flex-1 text-[12.5px]">{p.name}</span>
                  <span
                    className={cn(
                      "text-[10px]",
                      p.present ? "text-accent" : "text-ink-muted",
                    )}
                  >
                    {p.present ? "Present" : "Absent"}
                  </span>
                  <span className="bg-ink-faint relative h-5 w-9 overflow-hidden rounded-full">
                    {p.present && (
                      <span
                        data-toggle-on
                        className="bg-accent absolute inset-0 rounded-full"
                      />
                    )}
                    <span
                      className={cn(
                        "bg-paper absolute top-0.5 h-4 w-4 rounded-full shadow-sm",
                        p.present ? "right-0.5" : "left-0.5",
                      )}
                    />
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Save */}
        <div className="absolute inset-x-4 bottom-4 h-[38px]">
          <span
            data-wire
            className="bg-ink-faint absolute inset-0 rounded-[10px]"
          />
          <div
            data-real
            data-save
            className="bg-ink text-paper absolute inset-0 grid place-items-center rounded-[10px] text-[12.5px] font-medium"
          >
            <span data-save-label>Save attendance</span>
            <span
              data-saved
              className="bg-accent absolute inset-0 grid place-items-center rounded-[10px]"
            >
              Saved ✓
            </span>
          </div>
        </div>

        {/* Toast */}
        <p
          data-toast
          className="bg-ink text-paper absolute top-[42px] left-1/2 -translate-x-1/2 rounded-full px-3 py-1.5 text-[10.5px] whitespace-nowrap"
        >
          Attendance saved · {present} of {PEOPLE.length} present
        </p>
      </div>

      {/* The pointer */}
      <span
        data-cursor
        className="border-paper bg-ink pointer-events-none absolute top-0 left-0 z-20 block h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-[0_2px_10px_rgba(0,0,0,0.35)]"
      />
    </div>
  );
}
