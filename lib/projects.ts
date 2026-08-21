import type { Project } from "@/lib/types";

/**
 * The work. Order here is the order on the page and in the carousel (M6+), so
 * lead with the strongest piece.
 */
export const projects: readonly Project[] = [
  {
    slug: "dfootprint",
    index: "01",
    title: "D'Footprint",
    category: "E-commerce",
    year: 2026,
    blurb:
      "A storefront for my sister's handmade-footwear brand. Customers browse the catalogue, order made-to-measure pairs, and follow each one from the workshop bench to their doorstep.",
    tags: ["Next.js", "Tailwind", "Paystack", "PostgreSQL"],
    cover: {
      src: "/images/work/dfootprint.webp",
      alt: "Concentric arcs traced by a single vermilion curve.",
      width: 1600,
      height: 1100,
    },
  },
  {
    slug: "jobless",
    index: "02",
    title: "Jobless",
    category: "Tooling",
    year: 2026,
    blurb:
      "Scrapes listings across the web, scores each role against your skills and taste, then tracks every application from saved to signed.",
    tags: ["Python", "AI validation", "Scraper", "MongoDB"],
    cover: {
      src: "/images/work/jobless.webp",
      alt: "A dot matrix thinning left to right, three dots picked out in vermilion.",
      width: 1600,
      height: 1100,
    },
  },
  {
    slug: "wayframe",
    index: "03",
    title: "Wayframe",
    category: "AI tooling",
    year: 2026,
    blurb:
      "Turns a plain-language description of a screen flow into an editable diagram, checks it against a library of real app patterns, and flags the screens you forgot to design.",
    tags: ["Next.js", "TypeScript", "LLM", "React Flow"],
    cover: {
      src: "/images/work/wayframe.webp",
      alt: "Six wireframe screens wired into a graph, one framed in vermilion.",
      width: 1600,
      height: 1100,
    },
  },
  {
    slug: "blog",
    index: "04",
    title: "Blog",
    category: "Publishing",
    year: 2026,
    blurb:
      "A personal publishing platform end to end — admin dashboard, rich-text editor, and an email pipeline — built around one writer instead of an editorial team.",
    tags: ["Next.js", "PostgreSQL", "TipTap", "Resend"],
    cover: {
      src: "/images/work/blog.webp",
      alt: "Stacked blocks of text set as tone, under a vermilion rule.",
      width: 1600,
      height: 1100,
    },
  },
  {
    slug: "picpress",
    index: "05",
    title: "PicPress",
    category: "Utility",
    year: 2026,
    blurb:
      "Compresses phone photos on the spot and stitches them into a lightweight PDF. No account, no upload wall, just a file you can send.",
    tags: ["React", "Next.js", "Client-side", "PDF"],
    cover: {
      src: "/images/work/picpress.webp",
      alt: "Nested frames collapsing inward onto a vermilion bar.",
      width: 1600,
      height: 1100,
    },
  },
  {
    slug: "precious-and-emmanuel",
    index: "06",
    title: "Precious & Emmanuel",
    category: "Client site",
    year: 2026,
    blurb:
      "A wedding site with a real deadline — RSVP tracking, guest details, and a countdown — built for two people who aren't developers.",
    tags: ["Next.js", "Backend", "RSVP system"],
    cover: {
      src: "/images/work/precious-and-emmanuel.webp",
      alt: "Two interlocking rings, their overlap drawn in vermilion.",
      width: 1600,
      height: 1100,
    },
  },
];

/** Case-study lookup. Returns undefined so the route can call notFound(). */
export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

/**
 * The project after `slug`, wrapping at the end — drives "next project" at the
 * foot of a case study. Derived from array order rather than stored on each
 * project, so reordering the list can't leave a stale pointer behind.
 */
export function getNextProject(slug: string): Project {
  const i = projects.findIndex((p) => p.slug === slug);
  return projects[(i + 1) % projects.length];
}
