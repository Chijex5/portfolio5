"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { applyKinetic, attachKineticHover } from "@/lib/kinetic";
import { CAPABILITIES } from "@/lib/nav";
import {
  COMPOSE,
  DURATION,
  EASE_GSAP,
  HOVER_OK,
  MOTION_OK,
} from "@/lib/tokens";
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
 *   <li  data-cap-item>           the velocity smear (ticker, writes `transform`)
 *     <span data-cap-item-inner>  the compose (`x`/`yPercent`/`rotate`) and the
 *                                 hover lift (`y`)
 *
 * The compose and the hover do share that inner span, which is safe only because
 * they use different transform components: GSAP tracks `y` and `yPercent`
 * separately, so the lift can move an item that the compose has already placed,
 * and scrolling back up cannot erase the lift. Both in px would be two writers on
 * one property.
 *
 * The axis morph is declared on the enclosing `[data-cap-list]`, where it is
 * inherited — which also lets a per-item hover morph override it via ordinary
 * cascade instead of the two fighting over one custom property.
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

        // ── The smear ────────────────────────────────────────────────────────
        //
        // A fast flick drags the type as it lands, which is the same liquid
        // language the elastic bands and work rows speak — read from the same
        // shared store, so every part of the page agrees about how fast the
        // scroll is at a given instant.
        //
        // Only while composing. Once the timeline is done the loop writes nothing
        // at all, so a settled section costs a comparison per frame and no style
        // churn — the idle-out discipline ElasticProvider and LiquidLens use.
        const trigger = timeline.scrollTrigger;
        const items = gsap.utils.toArray<HTMLElement>(
          "[data-cap-item]",
          section,
        );
        const written = new WeakMap<HTMLElement, string>();

        const smear = () => {
          const progress = trigger?.progress ?? 1;
          const composing = progress > 0 && progress < 1;
          const scroll = composing ? getVelocity().scroll : 0;

          // Fades out as the compose completes, so the smear cannot outlive the
          // motion it is meant to be smearing.
          const weight = composing ? 1 - progress : 0;
          const lag = scroll * COMPOSE.smearLag * weight;
          const skew = -scroll * COMPOSE.smearSkew * weight;

          for (const item of items) {
            const transform =
              Math.abs(lag) < 0.05
                ? ""
                : `translate3d(0, ${lag.toFixed(2)}px, 0) skewY(${skew.toFixed(3)}deg)`;
            if (written.get(item) === transform) continue;
            written.set(item, transform);
            item.style.transform = transform;
          }
        };

        gsap.ticker.add(smear);

        return () => {
          gsap.ticker.remove(smear);
          for (const item of items) item.style.transform = "";
        };
      });

      // Per-item hover is cursor-only: on touch there is no hover state to
      // return from, and a tap would leave one tool permanently bold.
      mm.add(HOVER_OK, () => {
        const items = gsap.utils.toArray<HTMLElement>(
          "[data-cap-item]",
          section,
        );
        const teardowns = items.map((item) => {
          const inner = item.querySelector<HTMLElement>(
            "[data-cap-item-inner]",
          );
          if (!inner) return () => {};

          const morph = attachKineticHover(
            inner,
            { wght: [520, 800], opsz: [96, 144], soft: [0, 45] },
            DURATION.base,
          );
          const lift = gsap.quickTo(inner, "y", {
            duration: DURATION.base,
            ease: EASE_GSAP,
          });

          const enter = () => {
            morph.play();
            lift(-4);
          };
          const leave = () => {
            morph.reverse();
            lift(0);
          };

          item.addEventListener("pointerenter", enter);
          item.addEventListener("pointerleave", leave);
          return () => {
            item.removeEventListener("pointerenter", enter);
            item.removeEventListener("pointerleave", leave);
            morph.kill();
            gsap.set(inner, { y: 0 });
          };
        });

        return () => teardowns.forEach((fn) => fn());
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
