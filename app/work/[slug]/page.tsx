import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import CaseScene from "@/components/case/CaseScene";
import CaseMotion from "@/components/case/CaseMotion";
import { CONTACT } from "@/lib/nav";
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

function Block({ block }: { block: CaseStudyBlock }) {
  if (block.kind === "image") {
    return (
      <figure
        data-rise
        className={cn(
          "relative mt-20 aspect-[16/10] overflow-hidden",
          block.wide && "md:-mx-[8vw]",
        )}
      >
        <Image
          src={block.src}
          alt={block.alt}
          fill
          sizes="(min-width: 768px) 80vw, 100vw"
          className="object-cover"
        />
      </figure>
    );
  }

  // The line a study turns on — set as display type, wider than the body.
  if (block.kind === "quote") {
    return (
      <p
        data-split
        className="display mt-20 max-w-[18ch] text-[clamp(2rem,4.6vw,4.5rem)] md:mt-28"
      >
        <span className="text-signal">“</span>
        {block.body}
        <span className="text-signal">”</span>
      </p>
    );
  }

  return (
    <div data-rise className="mt-10 max-w-[38rem] first:mt-0">
      {block.heading ? (
        <h2 className="display mb-4 text-[clamp(1.5rem,2.4vw,2rem)]">
          {block.heading}
        </h2>
      ) : null}
      <p className="text-bone/75 text-[1.125rem] leading-[1.6] tracking-[-0.01em] text-pretty md:text-xl">
        {block.body}
      </p>
    </div>
  );
}

function Outbound({
  href,
  label,
  title,
}: {
  href: string;
  label: string;
  title: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="group hover:text-signal inline-flex items-center gap-2 transition-colors"
    >
      {label}
      <span className="sr-only"> for {title}</span>
      <span
        aria-hidden="true"
        className="inline-block transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
      >
        ↗
      </span>
    </a>
  );
}

export default async function CaseStudy({ params }: Params) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const next = getNextProject(project.slug);
  const total = String(projects.length).padStart(2, "0");

  return (
    <main id="main" className="bg-ink relative z-10">
      <CaseScene
        slug={project.slug}
        index={project.index}
        label={project.category}
      />

      <CaseMotion>
        <article className="px-4 pt-10 pb-24 md:px-10 md:pt-16 md:pb-36">
          <p
            data-rise
            className="label text-bone-muted flex flex-wrap items-center gap-x-3 gap-y-1"
          >
            <span className="text-signal">
              ({project.index}/{total})
            </span>
            <span className="bg-bone-faint h-px w-8" />
            {project.category}
            <span className="bg-bone-faint h-px w-8" />
            {project.year}
          </p>

          <h1
            data-split
            data-now
            className="display mt-6 text-[clamp(3.2rem,11vw,12rem)]"
          >
            {project.title}
          </h1>

          <div className="mt-12 grid gap-12 md:mt-20 md:grid-cols-12 md:gap-10">
            <p
              data-split
              className="text-[clamp(1.35rem,2.4vw,2.25rem)] leading-[1.18] tracking-[-0.025em] md:col-span-7"
            >
              {project.blurb}
            </p>

            <div
              data-rise
              className="label flex flex-col gap-8 md:col-span-4 md:col-start-9"
            >
              <div>
                <p className="text-bone-muted mb-3">Built with</p>
                <ul className="flex flex-wrap gap-x-4 gap-y-2">
                  {project.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
              </div>
              {project.live || project.repo ? (
                <ul className="flex gap-8">
                  {project.live ? (
                    <li>
                      <Outbound
                        href={project.live}
                        label="Live site"
                        title={project.title}
                      />
                    </li>
                  ) : null}
                  {project.repo ? (
                    <li>
                      <Outbound
                        href={project.repo}
                        label="Source"
                        title={project.title}
                      />
                    </li>
                  ) : null}
                </ul>
              ) : null}
            </div>
          </div>

          <div className="mt-20 md:mt-32 md:ml-[calc(100%/12*4)]">
            {project.blocks?.map((block, i) => (
              <Block key={i} block={block} />
            ))}
          </div>

          {/* The real thing, after the story of it. */}
          {project.cover ? (
            <figure data-rise className="mt-24 md:mt-36">
              <figcaption className="label text-bone-muted mb-4 flex justify-between">
                <span>The live site</span>
                {project.live ? (
                  <a
                    href={project.live}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="hover:text-bone transition-colors"
                  >
                    Visit ↗
                  </a>
                ) : null}
              </figcaption>
              <div className="border-bone-faint relative aspect-[16/11] overflow-hidden rounded-[14px] border">
                <Image
                  src={project.cover.src}
                  alt={project.cover.alt}
                  fill
                  sizes="(min-width: 768px) 92vw, 100vw"
                  className="object-cover"
                />
              </div>
            </figure>
          ) : null}
        </article>

        {/* Next project */}
        <nav
          aria-label="Next project"
          className="border-bone-faint border-t px-4 pt-10 pb-28 md:px-10 md:pt-14 md:pb-32"
        >
          <div className="label text-bone-muted flex justify-between">
            <span>Next project</span>
            <Link href="/#work" className="hover:text-bone transition-colors">
              ← All work
            </Link>
          </div>
          <Link
            href={`/work/${next.slug}`}
            data-cursor="Next"
            className="group mt-8 flex items-end justify-between gap-6 md:mt-12"
          >
            <span
              data-split
              className="display group-hover:text-signal block text-[clamp(3rem,10vw,11rem)] transition-colors duration-500"
            >
              {next.title}
            </span>
            <span
              aria-hidden="true"
              className="display mb-[0.12em] hidden text-[clamp(2rem,5vw,5rem)] transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:translate-x-3 md:block"
            >
              →
            </span>
          </Link>
          <p className="label text-bone-muted mt-16 md:mt-24">
            <a
              href={`mailto:${CONTACT.email}`}
              className="hover:text-bone transition-colors"
            >
              {CONTACT.email}
            </a>
          </p>
        </nav>
      </CaseMotion>
    </main>
  );
}
