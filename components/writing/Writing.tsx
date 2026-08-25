"use client";

import { useRef } from "react";
import Reveal from "@/components/shared/Reveal";
import SplitReveal from "@/components/shared/SplitReveal";
import {
  articles,
  featuredArticle,
  formatArticleDate,
  restArticles,
} from "@/lib/articles";
import { gsap, useGSAP } from "@/lib/gsap";
import { attachKineticHover } from "@/lib/kinetic";
import { DURATION, EASE_GSAP, HOVER_OK, MOTION_OK, REVEAL } from "@/lib/tokens";

/**
 * Featured writing.
 *
 * Two treatments from one array: the lead article gets the display headline, its
 * standfirst and a plate, the rest are compact rows. That asymmetry is the whole
 * layout idea — a uniform list of five titles has no subject, and five equally
 * large ones have five.
 *
 * The plate is the fix for what this section looked like without it. The lead's
 * metadata is four short mono strings, and hanging them in a 4-column rail left
 * roughly a third of the section as blank paper with nothing to balance the
 * headline against. So the rail now holds the same object the work rows use — a
 * bordered plate with the entry's numeral as a watermark — and the metadata sits
 * inside it. Same vocabulary as Work, no invented artwork, and the section reads
 * as composed rather than as a list that ran out of content.
 *
 * The animation carries the lead/row distinction:
 *
 *   - the lead's title is a SplitReveal (line masks) whose axes morph as the
 *     section opens, so it behaves like the hero headline;
 *   - its numeral drifts against the plate on scroll, which is the one bit of
 *     parallax in the section and is what stops the plate reading as a static box;
 *   - each row's title thickens and slides right under the cursor while its index
 *     goes accent, its arrow travels and a rule wipes across, so the row being
 *     pointed at is unambiguous without a hover background;
 *   - rows stagger in on entry, index first, which reads as a list being set
 *     rather than a block appearing.
 *
 * Entry 01 is written; 02–05 are still placeholders — see lib/articles.ts.
 */
export default function Writing() {
  const root = useRef<HTMLElement>(null);
  const count = String(articles.length).padStart(2, "0");

  useGSAP(
    () => {
      const section = root.current;
      if (!section) return;

      const mm = gsap.matchMedia();

      mm.add(MOTION_OK, () => {
        // The plate's numeral drifts against its frame as the section passes.
        // Scoped to the plate as trigger rather than the section, so the travel is
        // spent while the plate is actually on screen.
        const numeral = section.querySelector<HTMLElement>(
          "[data-plate-numeral]",
        );
        const plate = section.querySelector<HTMLElement>("[data-plate]");
        if (numeral && plate) {
          gsap.to(numeral, {
            yPercent: -14,
            ease: "none",
            scrollTrigger: {
              trigger: plate,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          });
        }

        // Rows assemble on entry: index, then title, then the meta cluster.
        const rows = gsap.utils.toArray<HTMLElement>("[data-row]", section);
        for (const row of rows) {
          const parts = gsap.utils.toArray<HTMLElement>("[data-row-mask]", row);
          gsap.from(parts, {
            yPercent: 115,
            duration: DURATION.slow,
            ease: EASE_GSAP,
            stagger: 0.06,
            scrollTrigger: { trigger: row, start: REVEAL.start, once: true },
          });
        }
      });

      mm.add(HOVER_OK, () => {
        const rows = gsap.utils.toArray<HTMLElement>("[data-row]", section);

        const teardowns = rows.map((row) => {
          const title = row.querySelector<HTMLElement>("[data-row-title]");
          const arrow = row.querySelector<HTMLElement>("[data-row-arrow]");
          const rule = row.querySelector<HTMLElement>("[data-row-rule]");
          if (!title) return () => {};

          const morph = attachKineticHover(
            title,
            { wght: [420, 760], opsz: [64, 144], soft: [0, 40] },
            DURATION.base,
          );
          const slide = gsap.quickTo(title, "x", {
            duration: DURATION.base,
            ease: EASE_GSAP,
          });
          const travel = arrow
            ? gsap.quickTo(arrow, "x", {
                duration: DURATION.base,
                ease: EASE_GSAP,
              })
            : null;
          // scaleX from 0 rather than width: transforms don't touch layout, so a
          // row can't reflow the list while the cursor moves down it.
          const wipe = rule
            ? gsap.quickTo(rule, "scaleX", {
                duration: DURATION.base,
                ease: EASE_GSAP,
              })
            : null;

          const enter = () => {
            morph.play();
            slide(14);
            travel?.(8);
            wipe?.(1);
          };
          const leave = () => {
            morph.reverse();
            slide(0);
            travel?.(0);
            wipe?.(0);
          };

          // focusin/out as well as pointer: the rows are links, so a keyboard
          // visitor gets the same signal about where they are.
          row.addEventListener("pointerenter", enter);
          row.addEventListener("pointerleave", leave);
          row.addEventListener("focusin", enter);
          row.addEventListener("focusout", leave);

          return () => {
            row.removeEventListener("pointerenter", enter);
            row.removeEventListener("pointerleave", leave);
            row.removeEventListener("focusin", enter);
            row.removeEventListener("focusout", leave);
            morph.kill();
            gsap.set(title, { x: 0 });
            if (arrow) gsap.set(arrow, { x: 0 });
            if (rule) gsap.set(rule, { scaleX: 0 });
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
      id="writing"
      className="px-6 pt-24 md:px-10 md:pt-32"
      aria-labelledby="writing-heading"
    >
      <header className="border-ink/10 flex items-baseline justify-between gap-4 border-b pb-6">
        <h2
          id="writing-heading"
          className="text-ink-muted font-mono text-xs tracking-[0.2em] uppercase"
        >
          03 &mdash; Writing
        </h2>
        <p
          className="text-ink-muted font-mono text-xs tracking-[0.2em] uppercase"
          aria-label={`${articles.length} articles`}
        >
          ({count})
        </p>
      </header>

      {/* Lead article */}
      <article className="border-ink/10 border-b py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-12 md:gap-14">
          <div className="md:col-span-7">
            <p className="text-ink-muted flex items-center gap-3 font-mono text-[0.6875rem] tracking-[0.2em] uppercase">
              {featuredArticle.index}
              <span aria-hidden="true" className="bg-ink/20 h-px w-8" />
              {featuredArticle.topic}
            </p>

            <a
              href={featuredArticle.href}
              target="_blank"
              rel="noreferrer noopener"
              data-lead
              className="group mt-5 block"
            >
              <SplitReveal
                as="h3"
                stagger={0.07}
                // Same language as the hero headline: thin and open on the way in,
                // heavier and tighter once it has been read. Bounded to the
                // section's own pass so it isn't already mid-morph on arrival.
                kinetic={{
                  wght: [300, 620],
                  opsz: [32, 144],
                  soft: [0, 30],
                  tracking: [0.004, -0.018],
                  start: "top 90%",
                  end: "bottom 55%",
                }}
                className="font-display group-hover:text-signal text-[clamp(1.875rem,4.6vw,3.25rem)] leading-[1.06] tracking-[-0.015em] transition-colors duration-300"
              >
                {featuredArticle.title}
              </SplitReveal>
            </a>

            <Reveal delay={0.1}>
              <p className="text-ink mt-6 max-w-xl text-lg leading-relaxed text-pretty md:text-xl">
                {featuredArticle.standfirst}
              </p>
            </Reveal>

            {/* The lines from the piece itself. Stacked, because they are written
                as separate beats rather than as a paragraph — see Article.excerpt.
                Guarded, so the four placeholder rows below are unaffected. */}
            {featuredArticle.excerpt ? (
              <Reveal delay={0.14}>
                <div className="mt-6 max-w-xl space-y-2">
                  {featuredArticle.excerpt.map((line) => (
                    <p
                      key={line}
                      className="text-ink-muted text-base leading-relaxed text-pretty md:text-lg"
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </Reveal>
            ) : null}

            <Reveal delay={0.2}>
              <a
                href={featuredArticle.href}
                target="_blank"
                rel="noreferrer noopener"
                className="group text-ink hover:text-signal mt-8 inline-flex items-center gap-3 font-mono text-xs tracking-[0.2em] uppercase transition-colors duration-300"
              >
                Read the piece
                <span
                  aria-hidden="true"
                  className="inline-block transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1"
                >
                  &#8599;
                </span>
              </a>
            </Reveal>
          </div>

          {/* The plate. Same object as a work row's: bordered frame, the entry's
              numeral as a watermark, metadata over it. `md:col-start-9` leaves a
              deliberate empty column between it and the copy — the gutter is what
              stops the two blocks reading as one wide box.

              Sized to its own content, with no fixed aspect ratio. A `3/4` plate
              in a 4-column rail came out ~550px tall against a ~320px copy
              column, which did not fill the dead space so much as move it inside
              a border and stretch the grid row to match. Content height plus a
              floor keeps the two columns in the same register. */}
          <Reveal delay={0.12} className="md:col-span-4 md:col-start-9">
            <div
              data-plate
              className="border-ink/10 bg-ink/[0.03] relative flex min-h-[17rem] flex-col justify-end overflow-hidden border p-6 md:min-h-[19rem] md:p-7"
            >
              {/* Fully inside the frame. Bled off the corner it read as a
                  cropping accident rather than a watermark — half the glyph was
                  outside the box. */}
              <span
                aria-hidden="true"
                data-plate-numeral
                className="font-display text-ink/[0.07] absolute top-3 right-5 text-[6rem] leading-[0.8] tracking-tight will-change-transform select-none md:text-[7rem]"
              >
                {featuredArticle.index}
              </span>

              {/* Crosshair, the same hairline detail the work plates carry. */}
              <span
                aria-hidden="true"
                className="bg-ink/10 absolute top-6 left-6 h-px w-10 md:top-7 md:left-7"
              />

              {/* Two across, then one: three stacked pairs made the plate taller
                  than the copy beside it for no gain in legibility. */}
              <dl className="relative grid grid-cols-2 gap-x-4 gap-y-5 font-mono text-[0.6875rem] tracking-[0.2em] uppercase">
                <div>
                  <dt className="text-ink-muted">Published</dt>
                  <dd className="text-ink mt-2 text-sm tracking-normal normal-case">
                    <time dateTime={featuredArticle.date}>
                      {formatArticleDate(featuredArticle.date)}
                    </time>
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-muted">Read</dt>
                  <dd className="text-ink mt-2 text-sm tracking-normal normal-case">
                    {featuredArticle.minutes} min
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-ink-muted">Topic</dt>
                  <dd className="text-ink mt-2 text-sm tracking-normal normal-case">
                    {featuredArticle.topic}
                  </dd>
                </div>
              </dl>
            </div>
          </Reveal>
        </div>
      </article>

      {/* The rest */}
      <ul>
        {restArticles.map((article) => (
          <li
            key={article.slug}
            className="border-ink/10 border-b last:border-b-0"
          >
            <a
              href={article.href}
              target="_blank"
              rel="noreferrer noopener"
              data-row
              className="group/row relative block py-7 md:py-8"
            >
              {/* Wipes across under the row on hover — origin-left so it draws in
                  the reading direction. */}
              <span
                aria-hidden="true"
                data-row-rule
                className="bg-signal absolute inset-x-0 bottom-0 h-px origin-left scale-x-0"
              />

              <div className="flex items-baseline gap-4 md:gap-8">
                <span className="overflow-hidden pb-[0.12em]">
                  <span
                    data-row-mask
                    className="text-ink-muted group-hover/row:text-signal block font-mono text-[0.6875rem] tracking-[0.2em] tabular-nums transition-colors duration-300"
                  >
                    {article.index}
                  </span>
                </span>

                <span className="min-w-0 flex-1 overflow-hidden pb-[0.12em]">
                  <span data-row-mask className="block">
                    <span
                      data-row-title
                      className="kinetic font-display block text-[clamp(1.25rem,2.6vw,1.875rem)] leading-[1.14] tracking-[-0.01em] will-change-transform"
                    >
                      {article.title}
                    </span>
                  </span>
                </span>

                {/* One cluster, not two floating labels: topic and read time are
                    both "how much of a commitment is this", so they read as a unit
                    at the end of the row instead of being spread across it. */}
                <span className="shrink-0 overflow-hidden pb-[0.12em]">
                  <span
                    data-row-mask
                    className="text-ink-muted flex items-center gap-2 font-mono text-[0.6875rem] tracking-[0.2em] whitespace-nowrap uppercase"
                  >
                    <span className="hidden sm:inline">{article.topic}</span>
                    <span aria-hidden="true" className="hidden sm:inline">
                      &middot;
                    </span>
                    <span className="tabular-nums">{article.minutes} min</span>
                  </span>
                </span>

                <span
                  aria-hidden="true"
                  data-row-arrow
                  className="text-ink-muted inline-block shrink-0 will-change-transform"
                >
                  &#8599;
                </span>
              </div>
            </a>
          </li>
        ))}
      </ul>

      <Reveal delay={0.08}>
        <p className="mt-10">
          <a
            href="https://chijioke.app"
            target="_blank"
            rel="noreferrer noopener"
            className="group text-ink-muted hover:text-ink inline-flex items-center gap-2 font-mono text-xs tracking-[0.2em] uppercase transition-colors duration-300"
          >
            All writing
            <span
              aria-hidden="true"
              className="inline-block transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1"
            >
              &#8599;
            </span>
          </a>
        </p>
      </Reveal>
    </section>
  );
}
