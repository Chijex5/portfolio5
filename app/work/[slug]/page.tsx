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

/** Long-form body. Absent until the case studies are written (see §5). */
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
              Built with
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

            {project.live ? (
              <>
                <dt className="text-ink-muted mt-8 font-mono text-[0.6875rem] tracking-[0.2em] uppercase">
                  Live
                </dt>
                <dd className="mt-3">
                  <a
                    href={project.live}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="decoration-signal hover:text-signal text-base underline underline-offset-[0.2em] transition-colors duration-300 md:text-lg"
                  >
                    Visit the site{" "}
                    <span aria-hidden="true" className="inline-block">
                      &#8599;
                    </span>
                  </a>
                </dd>
              </>
            ) : null}

            {/* Source. Its own block rather than a second line under Live: not
                every project has both, and a `repo` with no `live` (jobless, which
                has no frontend yet) still needs a label of its own. */}
            {project.repo ? (
              <>
                <dt className="text-ink-muted mt-8 font-mono text-[0.6875rem] tracking-[0.2em] uppercase">
                  Source
                </dt>
                <dd className="mt-3">
                  <a
                    href={project.repo}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="decoration-signal hover:text-signal text-base underline underline-offset-[0.2em] transition-colors duration-300 md:text-lg"
                  >
                    View the code{" "}
                    <span aria-hidden="true" className="inline-block">
                      &#8599;
                    </span>
                  </a>
                </dd>
              </>
            ) : null}
          </dl>
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
