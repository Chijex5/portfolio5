"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { applyKinetic } from "@/lib/kinetic";
import { CAPABILITIES } from "@/lib/nav";
import { COMPOSE, EASE_GSAP, FIELD, MOTION_OK } from "@/lib/tokens";
import { getVelocity } from "@/lib/velocity";

/**
 * Deterministic pseudo-random in 0..1 from a string.
 *
 * Not `Math.random()`, for two separate reasons. The obvious one: a random value
 * read during render differs between server and client and is a hydration
 * mismatch. The less obvious one, which matters more here: with a hash, a given
 * tool always scatters to the same place, so the composition is a fixed
 * arrangement that can be judged and tuned rather than a different accident on
 * every load.
 *
 * FNV-1a. Small, no dependency, and well spread for short ASCII strings, which is
 * all these are.
 */
function seed(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  // >>> 0 to get an unsigned 32-bit value before normalising.
  return ((hash >>> 0) % 10000) / 10000;
}

/** Seeded value in -1..1, from `text` plus a salt so one name yields many axes. */
function seedSigned(text: string, salt: string): number {
  return seed(`${salt}:${text}`) * 2 - 1;
}

/**
 * Capabilities — "the type is composed".
 *
 * ── What this replaced, and why ─────────────────────────────────────────────
 *
 * The layout has always been right: four named groups in build order, each with a
 * note and its tools. The motion was not. It was a masked rise with a stagger —
 * the same gesture the hero, the work rows and the writing list already use — and
 * it presented the grouping as a finished fact. The marquee before it failed
 * because it could not group or rank anything; this section inherited the fix
 * without ever *showing* it.
 *
 * So now the grouping is the animation. The sixteen tool names arrive as loose
 * letterpress sorts — scattered, tilted, dimmed — and scrolling composes them into
 * their four rows. Each one travels to its own laid-out position, straightens and
 * comes up to full strength as it lands; the labels mask up and the rules draw in
 * beneath as their row fills. It ends on exactly the layout that was here before,
 * which is what makes the fallback trivially correct: with reduced motion or no
 * JavaScript the `MOTION_OK` block never runs, and the section is simply the
 * finished list with nothing hidden and nothing to recover.
 *
 * Letterpress rather than an arbitrary scatter because that is the language the
 * whole site is already speaking — warm paper, ink, grain, hairline rules, mono
 * labels. Type being set is the one metaphor this design implies.
 *
 * ── Why displacements come from indices, not measurements ───────────────────
 *
 * Each item's starting offset is derived from its position within its group and
 * its group's position within the section — never from a measured rect. A measured
 * convergence point would need re-measuring whenever Fraunces swaps in or the
 * viewport changes, which means reading layout from inside an animation and
 * keeping a refresh hook honest. An index already says which side of its row an
 * item sits on, so index-derived offsets converge in the right direction, cost no
 * layout reads at all, and are correct at every width.
 *
 * ── One writer per element ──────────────────────────────────────────────────
 *
 * Three things want to move a tool, so they are given three different nodes:
 *
 *   <li  data-cap-item>           the field: spring offset, scale, proximity
 *                                 weight, and the compose-time smear — all in one
 *                                 `transform` string from one loop
 *     <span data-cap-item-inner>  the compose: `x` / `yPercent` / `rotate` /
 *                                 `opacity`, from the scrubbed timeline
 *
 * Two elements, two writers, no overlap: the compose places a tool and the field
 * pushes whatever the compose has placed. There is no per-item hover tween at all
 * any more — proximity replaced it, which is strictly better, because a hover
 * listener cannot fire until the cursor is already on the target and so can never
 * produce a field.
 *
 * Weight cascades in three layers, each overriding the last through ordinary CSS
 * inheritance rather than by fighting: `.kinetic` declares
 * `font-variation-settings` on the list, `applyKinetic` animates the list's
 * `--wght` as the row crosses the viewport (the resting base), and the field sets
 * `--wght` on individual items when the cursor is near them. Because an inherited
 * declaration resolves its `var()` against the element it lands on, setting the
 * variable on an item is enough to change that item alone.
 */
export default function Capabilities() {
  const root = useRef<HTMLElement>(null);
  const count = String(CAPABILITIES.length).padStart(2, "0");

  useGSAP(
    () => {
      const section = root.current;
      if (!section) return;

      const mm = gsap.matchMedia();

      mm.add(MOTION_OK, () => {
        const rows = gsap.utils.toArray<HTMLElement>("[data-cap-row]", section);

        // One timeline for the whole section, not one per row: the four groups
        // have to compose *in order*, and four independent triggers would each
        // start on their own row's entry, so the order would depend on scroll
        // speed rather than on the sequence being expressed.
        const timeline = gsap.timeline({
          defaults: { ease: EASE_GSAP },
          scrollTrigger: {
            trigger: section,
            // The window is where the section is actually *being looked at*.
            //
            // "top bottom" -> "top 40%" was the first attempt and it was wrong:
            // that window opens the instant the section's top edge peeks over the
            // viewport bottom, so on a 900px screen the compose was ~85% finished
            // while the section was still below the fold, and by the time it was
            // comfortably in view there was nothing left to watch. Measured, the
            // whole thing played out across scrollY 16–556 with the section top
            // never above y=819.
            //
            // Second correction: the window has to span the section's whole *pass*
            // through the viewport, not just its arrival. The section is taller
            // than the viewport and its four rows are stacked down it, so a window
            // that closes while the section is still arriving composes the lower
            // groups before they exist on screen. "top 80%" -> "top 15%" fixed the
            // gross case but still ran group 01 mostly below the fold.
            //
            // Opening at "top 65%" puts the first row on screen before anything
            // moves; closing at "bottom 70%" keeps the window open until the
            // section is most of the way past. Each group then composes at roughly
            // the moment it is in view, which is the whole point of staggering them.
            start: "top 65%",
            end: "bottom 70%",
            scrub: true,
          },
        });

        rows.forEach((row, groupIndex) => {
          const rule = row.querySelector<HTMLElement>("[data-cap-rule]");
          const label = row.querySelector<HTMLElement>("[data-cap-label]");
          const note = row.querySelector<HTMLElement>("[data-cap-note]");
          const inners = gsap.utils.toArray<HTMLElement>(
            "[data-cap-item-inner]",
            row,
          );

          // Where this group sits vertically, as -0.5..0.5. Groups at the edges
          // of the section start pulled hardest toward its middle.
          const groupBias =
            rows.length > 1 ? groupIndex / (rows.length - 1) - 0.5 : 0;

          // Groups resolve in reading order, each overlapping the last so the
          // section composes as one continuous gesture rather than four bursts.
          const at = groupIndex * 0.5;

          inners.forEach((inner, itemIndex) => {
            const name = inner.textContent ?? String(itemIndex);
            // -0.5..0.5 across the row: the sign is what makes an item on the
            // right travel left and an item on the left travel right.
            const itemBias =
              inners.length > 1 ? itemIndex / (inners.length - 1) - 0.5 : 0;

            timeline.from(
              inner,
              {
                x:
                  -itemBias * COMPOSE.gatherX +
                  seedSigned(name, "x") * COMPOSE.jitterX,
                // `yPercent`, not `y`, so the hover lift below can own `y` on this
                // same element without the two overwriting each other. See the
                // note on COMPOSE.gatherYPercent.
                yPercent:
                  -groupBias * COMPOSE.gatherYPercent +
                  seedSigned(name, "y") * COMPOSE.jitterYPercent,
                rotate: seedSigned(name, "r") * COMPOSE.rotate,
                // Never to zero: an item still in flight stays readable, so
                // pausing mid-scroll shows a loose arrangement of words rather
                // than a grey smear.
                opacity:
                  COMPOSE.minOpacity +
                  seed(`o:${name}`) * (1 - COMPOSE.minOpacity) * 0.6,
                duration: 1,
              },
              at + itemIndex * 0.06,
            );
          });

          // The row's own furniture trails its tools: the rule draws in and the
          // label masks up once there is something for them to belong to.
          if (rule) {
            timeline.from(rule, { scaleX: 0, duration: 0.8 }, at + 0.1);
          }
          if (label) {
            timeline.from(label, { yPercent: 110, duration: 0.8 }, at + 0.16);
          }
          if (note) {
            timeline.from(
              note,
              { opacity: 0, y: 10, duration: 0.6 },
              at + 0.32,
            );
          }

          // Axis morph across the row's own pass. Declared on the list, which is
          // inherited, so every tool inside moves together — and left to the
          // enclosing element on purpose, so a per-item hover morph can override
          // it without the two fighting over the same custom property.
          const list = row.querySelector<HTMLElement>("[data-cap-list]");
          if (list) {
            applyKinetic(list, {
              wght: [340, 560],
              opsz: [24, 96],
              tracking: [0.006, -0.012],
              start: "top 88%",
              end: "bottom 42%",
            });
          }
        });

        // ── The field ────────────────────────────────────────────────────────
        //
        // One loop, one writer per element, and it owns everything continuous:
        // the cursor's proximity pull, the spring that carries it, and the
        // scroll-velocity smear during the compose. Folding them together is not
        // tidiness — three separate loops would each want to write the same
        // element's `transform`, which is the desync this codebase avoids
        // everywhere else.
        //
        // The `<li>` is the field's element. The compose owns the inner `<span>`,
        // so the two never collide: the compose places a tool, the field pushes
        // whatever the compose has placed.
        const trigger = timeline.scrollTrigger;
        const items = gsap.utils.toArray<HTMLElement>(
          "[data-cap-item]",
          section,
        );

        /**
         * Per-item spring state. `cx`/`cy` are document-space centres, cached
         * rather than measured per frame — sixteen `getBoundingClientRect()` calls
         * every frame would force a synchronous layout sixty times a second, which
         * is exactly the cost this section was just rescued from. Converting a
         * cached document centre to viewport space needs only `scrollY`, which is
         * free to read.
         */
        const springs = items.map((el) => ({
          el,
          cx: 0,
          cy: 0,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          influence: 0,
          written: "",
          writtenWght: -1,
        }));

        const measure = () => {
          for (const s of springs) {
            const r = s.el.getBoundingClientRect();
            s.cx = r.left + r.width / 2 + window.scrollX;
            s.cy = r.top + r.height / 2 + window.scrollY;
          }
        };
        measure();

        // Re-measured on resize and once the webfont has swapped, both of which
        // move every centre. Not on scroll: scrolling is what `scrollY` is for.
        const observer = new ResizeObserver(measure);
        observer.observe(section);
        document.fonts?.ready.then(measure).catch(() => {});

        // Cursor in document space, or null when it is nowhere near.
        let px = 0;
        let py = 0;
        let pointerLive = false;

        const onPointerMove = (event: PointerEvent) => {
          px = event.clientX + window.scrollX;
          py = event.clientY + window.scrollY;
          pointerLive = true;
        };
        // Only fine pointers get the follow. On touch a move event is a drag, and
        // tracking it would leave the field frozen wherever the finger lifted.
        const onPointerDown = (event: PointerEvent) => {
          if (event.pointerType === "mouse") return;
          const tx = event.clientX + window.scrollX;
          const ty = event.clientY + window.scrollY;
          // A tap is an impulse, not a position: kick the neighbours and let the
          // springs carry it, so touch gets the same physicality without a cursor.
          for (const s of springs) {
            const dx = s.cx - tx;
            const dy = s.cy - ty;
            const dist = Math.hypot(dx, dy);
            if (dist > FIELD.radius) continue;
            const t = 1 - dist / FIELD.radius;
            const norm = dist || 1;
            s.vx += (dx / norm) * FIELD.impulse * t;
            s.vy += (dy / norm) * FIELD.impulse * t;
          }
        };
        const onPointerLeave = () => {
          pointerLive = false;
        };

        window.addEventListener("pointermove", onPointerMove, {
          passive: true,
        });
        window.addEventListener("pointerdown", onPointerDown, {
          passive: true,
        });
        document.addEventListener("pointerleave", onPointerLeave);

        const tick = (_time: number, deltaTime: number) => {
          // Two different clamps, because the spring needs a tighter one than
          // anything else here.
          //
          // A spring integrated with a large timestep does not merely go slower,
          // it goes *wrong*: `Math.pow(damping, frames)` is applied once per tick,
          // so at 20 frames' worth of delta it multiplies velocity by 0.74^20 ≈
          // 0.002 and the item crawls instead of converging. Measured under a
          // throttled rAF (~3fps) an item sat at -0.54px indefinitely — invisible,
          // but enough to keep a transform and a raster layer alive forever.
          //
          // So the integration step is capped at two frames and simply catches up
          // over several ticks. A slow device gets a slightly lazier spring rather
          // than one that never arrives.
          const rawFrames = Math.min(deltaTime, 50) / (1000 / 60);
          const frames = Math.min(rawFrames, 2);

          // The smear only exists while the compose is running, and fades out with
          // it, so it can never outlive the motion it is smearing.
          const progress = trigger?.progress ?? 1;
          const composing = progress > 0 && progress < 1;
          const smear = composing
            ? getVelocity().scroll * COMPOSE.smearLag * (1 - progress)
            : 0;
          const skew = composing
            ? -getVelocity().scroll * COMPOSE.smearSkew * (1 - progress)
            : 0;

          for (const s of springs) {
            let targetX = 0;
            let targetY = 0;
            let influence = 0;

            if (pointerLive) {
              const dx = px - s.cx;
              const dy = py - s.cy;
              const dist = Math.hypot(dx, dy);
              if (dist < FIELD.radius) {
                // Squared falloff: a linear one spreads the response evenly over
                // the whole radius and reads as everything drifting at once. This
                // keeps the effect concentrated on what the cursor is actually near.
                const t = 1 - dist / FIELD.radius;
                influence = t * t;
                const norm = dist || 1;
                targetX = (dx / norm) * FIELD.pull * influence;
                targetY =
                  (dy / norm) * FIELD.pull * influence - FIELD.lift * influence;
              }
            }

            // Integrate. Velocity is damped by a power of the frame count so the
            // decay is identical at 60Hz and 144Hz.
            s.vx += (targetX - s.x) * FIELD.stiffness * frames;
            s.vy += (targetY - s.y) * FIELD.stiffness * frames;
            s.vx *= Math.pow(FIELD.damping, frames);
            s.vy *= Math.pow(FIELD.damping, frames);
            s.x += s.vx * frames;
            s.y += s.vy * frames;
            s.influence += (influence - s.influence) * 0.2 * rawFrames;

            // Snapped, not merely close, and deliberately *not* gated on
            // `settled` — that was the bug. `settled` requires |x| < rest, so an
            // item resting at 0.54px could never satisfy the very condition that
            // would have cleared it. With no influence at all and less than a
            // pixel to go, there is nothing left worth animating.
            if (
              influence === 0 &&
              Math.abs(s.x) < 1 &&
              Math.abs(s.y) < 1 &&
              Math.abs(s.vx) < 1 &&
              Math.abs(s.vy) < 1
            ) {
              s.x = 0;
              s.y = 0;
              s.vx = 0;
              s.vy = 0;
              s.influence = 0;
            }

            const settled =
              Math.abs(s.x) < FIELD.rest &&
              Math.abs(s.y) < FIELD.rest &&
              Math.abs(s.vx) < FIELD.rest &&
              Math.abs(s.vy) < FIELD.rest &&
              s.influence < 0.004;

            // Cleared outright when settled, so a resting item carries no
            // transform, no raster layer, and no stacking context.
            const transform =
              settled && Math.abs(smear) < 0.05
                ? ""
                : `translate3d(${s.x.toFixed(2)}px, ${(s.y + smear).toFixed(2)}px, 0)` +
                  ` scale(${(1 + s.influence * FIELD.scale).toFixed(4)})` +
                  (skew ? ` skewY(${skew.toFixed(3)}deg)` : "");

            if (s.written !== transform) {
              s.written = transform;
              s.el.style.transform = transform;
              s.el.style.willChange = transform ? "transform" : "";
            }

            // Weight tracks proximity, rounded so a resting item is not handed a
            // fresh font-variation-settings string — and therefore re-rasterised —
            // on every frame for a value that has not visibly changed.
            const wght = Math.round(340 + s.influence * (FIELD.peakWght - 340));
            if (s.writtenWght !== wght) {
              s.writtenWght = wght;
              if (s.influence < 0.002) {
                // Handed back to the list's own scroll morph, which is the base.
                s.el.style.removeProperty("--wght");
                s.el.style.removeProperty("--opsz");
              } else {
                s.el.style.setProperty("--wght", String(wght));
                s.el.style.setProperty(
                  "--opsz",
                  String(Math.round(24 + s.influence * (FIELD.peakOpsz - 24))),
                );
              }
            }
          }
        };

        gsap.ticker.add(tick);

        return () => {
          gsap.ticker.remove(tick);
          observer.disconnect();
          window.removeEventListener("pointermove", onPointerMove);
          window.removeEventListener("pointerdown", onPointerDown);
          document.removeEventListener("pointerleave", onPointerLeave);
          for (const s of springs) {
            s.el.style.transform = "";
            s.el.style.willChange = "";
            s.el.style.removeProperty("--wght");
            s.el.style.removeProperty("--opsz");
          }
        };
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="capabilities"
      aria-label="Capabilities"
      className="px-6 pt-24 md:px-10 md:pt-32"
    >
      <header className="border-ink/10 flex items-baseline justify-between gap-4 border-b pb-6">
        <h2 className="text-ink-muted font-mono text-xs tracking-[0.2em] uppercase">
          01 &mdash; Capabilities
        </h2>
        <p
          className="text-ink-muted font-mono text-xs tracking-[0.2em] uppercase"
          aria-label={`${CAPABILITIES.length} groups`}
        >
          ({count})
        </p>
      </header>

      <ul>
        {CAPABILITIES.map((group, i) => (
          <li key={group.label} data-cap-row className="relative">
            {/* Drawn, not bordered. The first row sits under the header's own
                rule, so it doesn't get a second one. */}
            {i > 0 ? (
              <span
                aria-hidden="true"
                data-cap-rule
                className="bg-ink/10 absolute inset-x-0 top-0 h-px origin-left"
              />
            ) : null}

            <div className="grid gap-6 py-10 md:grid-cols-12 md:gap-14 md:py-14">
              <div className="md:col-span-4">
                {/* The mask has to be its own element: the label slides inside a
                    clipped box, and putting overflow on the grid cell would clip
                    the note's fade as well. */}
                <span className="block overflow-hidden pb-[0.12em]">
                  <span
                    data-cap-label
                    className="text-ink block font-mono text-xs tracking-[0.2em] uppercase"
                  >
                    {group.label}
                  </span>
                </span>
                <p
                  data-cap-note
                  className="text-ink-muted mt-4 max-w-xs text-sm leading-relaxed text-pretty md:text-base"
                >
                  {group.note}
                </p>
              </div>

              <div className="md:col-span-8">
                <ul
                  data-cap-list
                  className="kinetic font-display flex flex-wrap items-baseline gap-x-6 gap-y-2 text-[clamp(1.5rem,3.6vw,2.75rem)] leading-[1.12] md:gap-x-9"
                >
                  {group.items.map((item) => (
                    <li
                      key={item}
                      data-cap-item
                      // No `overflow-hidden` here any more. It existed to clip the
                      // masked rise this replaced, and a name cannot travel in from
                      // a scatter while confined to its own box.
                      className="will-change-transform"
                    >
                      <span
                        data-cap-item-inner
                        className="hover:text-signal block transition-colors duration-300 will-change-transform"
                      >
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
