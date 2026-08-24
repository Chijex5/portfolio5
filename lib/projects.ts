import type { Project } from "@/lib/types";

/**
 * The work. Order here is the order on the page and in the carousel, so lead with
 * the strongest piece.
 *
 * Covers are screenshots of the live deployments, captured by
 * `node scripts/capture-covers.mjs` — re-run it after a project gets a redesign.
 * `jobless` is the exception: it has no frontend yet, so it keeps the generated
 * abstract plate from scripts/make-covers.py.
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
      plate: "/images/work/dfootprint-plate.webp",
      alt: "The D'Footprint storefront: a pair of handmade leather slides photographed close up, the wordmark drawn in outline across them.",
      width: 2400,
      height: 1650,
    },
    live: "https://dfootprint.me",
    repo: "https://github.com/chijex5/nextjs-commerce",
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
      plate: "/images/work/jobless-plate.webp",
      alt: "A dot matrix thinning left to right, three dots picked out in vermilion.",
      width: 1600,
      height: 1100,
    },
    repo: "https://github.com/chijex5/ai-scraper",
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
      plate: "/images/work/wayframe-plate.webp",
      alt: "Wayframe's dark canvas: \u201cDescribe the app. Get the screen flow.\u201d beside a column of metrics and an empty flow canvas.",
      width: 2400,
      height: 1650,
    },
    live: "https://wayframe.vercel.app",
    repo: "https://github.com/chijex5/wayframe",
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
      plate: "/images/work/blog-plate.webp",
      alt: "The blog home: a serif headline reading \u201cThe real experience of learning tech as a student\u201d above a grid of article cards.",
      width: 2400,
      height: 1650,
    },
    live: "https://chijioke.app",
    repo: "https://github.com/chijex5/my-blog",
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
      plate: "/images/work/picpress-plate.webp",
      alt: "PicPress on warm paper: \u201cTwelve phone photos. A 248MB PDF.\u201d beside a before-and-after file-size readout.",
      width: 2400,
      height: 1650,
    },
    live: "https://benevolent-figolla-7f76d9.netlify.app",
    repo: "https://github.com/chijex5/picpress",
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
      plate: "/images/work/precious-and-emmanuel-plate.webp",
      alt: "Precious and Emmanuel's wedding site: the couple photographed under a floral arch, their names set over the picture in a high-contrast serif.",
      width: 2400,
      height: 1650,
    },
    live: "https://emmanuel-precious.vercel.app",
    repo: "https://github.com/chijex5/emmanuel-precious",
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
