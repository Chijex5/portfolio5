import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/shared/Reveal";
import SplitReveal from "@/components/shared/SplitReveal";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * One project. Copy on one side, visual on the other, sides swapping down the
 * list to keep the editorial rhythm.
 *
 * The whole row links to the case study: the frame is the primary target, and the
 * title repeats the link so keyboard users get a labelled stop without two tab
 * stops fighting for the same destination (the frame's anchor is aria-hidden and
 * removed from the tab order — the title anchor carries the name).
 *
 * `data-work-card` marks the frame as the Flip source rect for the click-to-expand
 * transition (M9), which measures this element and animates a full-screen image
 * from it.
 */
export default function WorkRow({
  project,
  flip,
}: {
  project: Project;
  flip: boolean;
}) {
  const href = `/work/${project.slug}`;

  return (
    <li className="border-ink/10 border-b py-14 last:border-b-0 md:py-20">
      <article className="group grid items-center gap-8 md:grid-cols-12 md:gap-14">
        <Reveal
          className={cn("md:col-span-7", flip ? "md:order-2" : "md:order-1")}
        >
          <Link
            href={href}
            tabIndex={-1}
            aria-hidden="true"
            data-work-card={project.slug}
            className="border-ink/10 bg-ink/5 relative block aspect-[16/11] overflow-hidden border"
          >
            {project.cover ? (
              <Image
                src={project.cover.src}
                alt=""
                width={project.cover.width}
                height={project.cover.height}
                sizes="(min-width: 768px) 58vw, 100vw"
                className="size-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
              />
            ) : (
              /* No cover in the data yet: a plate that owns the project's numeral
                 reads as deliberate rather than as a broken <img>. */
              <span
                aria-hidden="true"
                className="font-display text-ink/10 absolute -right-4 -bottom-14 text-[13rem] leading-none tracking-tight select-none"
              >
                {project.index}
              </span>
            )}

            <span className="text-ink-muted absolute top-5 left-5 font-mono text-[0.6875rem] tracking-[0.2em] uppercase">
              {project.category}
            </span>
          </Link>
        </Reveal>

        <div
          className={cn(
            "md:col-span-5",
            flip ? "md:order-1 md:pr-4" : "md:order-2 md:pl-4",
          )}
        >
          <p className="text-ink-muted flex items-center gap-3 font-mono text-[0.6875rem] tracking-[0.2em] uppercase">
            {project.index}
            <span aria-hidden="true" className="bg-ink/20 h-px w-8" />
            {project.year}
          </p>

          <SplitReveal
            as="h3"
            stagger={0.06}
            className="font-display mt-5 text-[clamp(1.875rem,4.5vw,3.25rem)] leading-[1.02] tracking-[-0.01em]"
          >
            <Link
              href={href}
              className="decoration-signal hover:text-signal underline-offset-[0.18em] transition-colors duration-300 hover:underline"
            >
              {project.title}
              {/* Not aria-hidden: this is the part that tells a screen-reader
                  user the title is a link to something, since "D'Footprint"
                  alone doesn't say where it goes. */}
              <span className="sr-only"> — read the case study</span>
            </Link>
          </SplitReveal>

          <Reveal delay={0.1}>
            <p className="text-ink-muted mt-5 text-base leading-relaxed text-pretty md:text-lg">
              {project.blurb}
            </p>

            <ul className="mt-7 flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <li
                  key={tag}
                  className="border-ink/15 text-ink-muted rounded-full border px-3 py-1 font-mono text-[0.625rem] tracking-[0.12em] uppercase"
                >
                  {tag}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </article>
    </li>
  );
}
