import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Reveal from "@/components/shared/Reveal";
import SmoothLink from "@/components/shared/SmoothLink";
import SplitReveal from "@/components/shared/SplitReveal";
import { getNextProject, getProject, projects } from "@/lib/projects";
import type { CaseStudyBlock } from "@/lib/types";
import { cn } from "@/lib/utils";

type Params = { params: Promise<{ slug: string }> };

/** Every case study is known at build time, so all six prerender. */
export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

/** Anything outside that set is a 404 rather than an on-demand render. */
export const dynamicParams = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};

  return {
    title: project.title,
    description: project.blurb,
    alternates: { canonical: `/work/${project.slug}` },
    openGraph: {
      type: "article",
      title: `${project.title} — Chijioke Uzodinma`,
      description: project.blurb,
      url: `/work/${project.slug}`,
      images: project.cover
        ? [
            {
              url: project.cover.src,
              width: project.cover.width,
              height: project.cover.height,
              alt: project.cover.alt,
            },
          ]
        : undefined,
    },
    twitter: { card: project.cover ? "summary_large_image" : "summary" },
  };
}

/** Long-form body: paragraphs, the line a study turns on, and figures. */
function Block({ block }: { block: CaseStudyBlock }) {
  if (block.kind === "image") {
    return (
      <Reveal className={cn("mt-16", block.wide && "md:-mx-[8vw]")}>
        <figure className="border-ink/10 bg-ink/5 relative aspect-[16/10] overflow-hidden border">
          <Image
            src={block.src}
            alt={block.alt}
            fill
            sizes="(min-width: 768px) 80vw, 100vw"
            className="object-cover"
          />
        </figure>
      </Reveal>
    );
  }

  // The line the case study turns on — "Just a smaller PDF.", "Which jobs are
  // actually worth my time?" Set as display type against a signal hairline, and
  // wider than the body column, so it reads as the conclusion rather than as one
  // more paragraph that happens to be short.
  if (block.kind === "quote") {
    return (
      <div className="mt-16 max-w-3xl">
        <span
          aria-hidden="true"
          className="bg-signal mb-7 block h-px w-12 origin-left"
        />
        <SplitReveal
          as="p"
          stagger={0.07}
          className="font-display text-[clamp(1.5rem,3.4vw,2.5rem)] leading-[1.14] tracking-[-0.015em]"
        >
          {block.body}
        </SplitReveal>
      </div>
    );
  }

  return (
    <div className="mt-16 max-w-2xl">
      {block.heading ? (
        <SplitReveal
          as="h2"
          className="font-display text-[clamp(1.5rem,2.6vw,2rem)] leading-[1.1] tracking-[-0.01em]"
        >
          {block.heading}
        </SplitReveal>
      ) : null}
      <Reveal delay={0.08}>
        <p
          className={cn(
            "text-ink-muted text-base leading-relaxed text-pretty md:text-lg",
            block.heading && "mt-5",
          )}
        >
          {block.body}
        </p>
      </Reveal>
    </div>
  );
}

export default async function CaseStudy({ params }: Params) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const next = getNextProject(project.slug);

  return (
    <main id="main">
      <article className="px-6 pt-32 pb-24 md:px-10 md:pt-40 md:pb-32">
        {/* Meta row */}
        <div className="text-ink-muted flex items-baseline justify-between gap-4 font-mono text-xs tracking-[0.2em] uppercase">
          <p className="flex items-center gap-3">
            {project.index}
            <span aria-hidden="true" className="bg-ink/20 h-px w-8" />
            {project.category}
          </p>
          <p>{project.year}</p>
        </div>

        <SplitReveal
          as="h1"
          immediate
          stagger={0.08}
          className="font-display mt-8 max-w-[16ch] text-[clamp(2.25rem,8vw,7rem)] leading-[0.96] tracking-[-0.02em]"
        >
          {project.title}
        </SplitReveal>

        <div className="mt-12 grid gap-10 md:grid-cols-12 md:gap-14">
          <div className="md:col-span-7">
            <p className="text-ink-muted max-w-2xl text-lg leading-relaxed text-pretty md:text-xl">
              {project.blurb}
            </p>
          </div>

          <dl className="md:col-span-4 md:col-start-9">
            <dt className="text-ink-muted font-mono text-[0.6875rem] tracking-[0.2em] uppercase">
              Tech
            </dt>
            <dd className="mt-4 flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="border-ink/15 text-ink-muted rounded-full border px-3 py-1 font-mono text-[0.625rem] tracking-[0.12em] uppercase"
                >
                  {tag}
                </span>
              ))}
            </dd>
          </dl>

          {/* Outbound links, outside the <dl>.
              They were dt/dd pairs, which read as "Live: Live ↗" once the link
              text was aligned to the deck — a label and a value saying the same
              word. They are not term/definition pairs anyway: each is a single
              destination, so a plain list is both honest markup and what the deck
              shows. `sr-only` carries the project name, since "Live ↗" on its own
              tells a screen-reader user nothing about where it goes. */}
          {project.live || project.repo ? (
            <ul className="flex flex-wrap items-center gap-x-8 gap-y-3 md:col-span-4 md:col-start-9 md:-mt-2">
              {project.live ? (
                <li>
                  <a
                    href={project.live}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="group text-ink hover:text-signal inline-flex items-center gap-2 font-mono text-xs tracking-[0.2em] uppercase transition-colors duration-300"
                  >
                    Live
                    <span className="sr-only"> site for {project.title}</span>
                    <span
                      aria-hidden="true"
                      className="inline-block transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5"
                    >
                      &#8599;
                    </span>
                  </a>
                </li>
              ) : null}
              {project.repo ? (
                <li>
                  <a
                    href={project.repo}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="group text-ink hover:text-signal inline-flex items-center gap-2 font-mono text-xs tracking-[0.2em] uppercase transition-colors duration-300"
                  >
                    Source
                    <span className="sr-only"> code for {project.title}</span>
                    <span
                      aria-hidden="true"
                      className="inline-block transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5"
                    >
                      &#8599;
                    </span>
                  </a>
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>

        {/* Cover. `loading="eager"` rather than `preload`: the headline above is
            the likely LCP element, so a <head> preload link would only compete
            with the fonts. (`priority` is deprecated as of Next 16.) */}
        {project.cover ? (
          <figure className="border-ink/10 bg-ink/5 relative mt-16 aspect-[16/11] overflow-hidden border md:mt-20">
            <Image
              src={project.cover.src}
              alt={project.cover.alt}
              fill
              loading="eager"
              sizes="(min-width: 768px) 92vw, 100vw"
              className="object-cover"
            />
          </figure>
        ) : null}

        {project.blocks?.map((block, i) => (
          <Block key={i} block={block} />
        ))}
      </article>

      {/* Next project */}
      <nav
        aria-label="Next project"
        className="border-ink/10 border-t px-6 py-16 md:px-10 md:py-24"
      >
        <p className="text-ink-muted font-mono text-xs tracking-[0.2em] uppercase">
          Next
        </p>
        <SplitReveal
          as="h2"
          className="font-display mt-5 text-[clamp(2rem,6vw,4.5rem)] leading-[1] tracking-[-0.02em]"
        >
          <SmoothLink
            href={`/work/${next.slug}`}
            className="hover:text-signal transition-colors duration-300"
          >
            {next.title}
          </SmoothLink>
        </SplitReveal>
        <p className="mt-10">
          <SmoothLink
            href="/#work"
            className="text-ink-muted hover:text-ink font-mono text-xs tracking-[0.2em] uppercase transition-colors duration-300"
          >
            &#8592; All work
          </SmoothLink>
        </p>
      </nav>
    </main>
  );
}
