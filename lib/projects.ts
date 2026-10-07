import type { Project } from "@/lib/types";

/**
 * The work. Order here is the order of the proof chapter, so lead with
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
    line: "My sister's brand deserved a storefront she controls.",
    blurb:
      "Built for my sister's footwear brand after I got tired of seeing small businesses settle for storefronts they couldn't really control.",
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
    blocks: [
      {
        kind: "text",
        body: "I started with the Next.js Commerce template, then replaced the Shopify backend entirely with my own PostgreSQL setup, custom schema, migrations, and payment flow. Customers can browse products, place real orders through Paystack, and track them from production to delivery.",
      },
      {
        kind: "text",
        body: "One of my longest-running projects so far, with hundreds of commits and way more iterations than I originally planned.",
      },
    ],
  },
  {
    slug: "jobless",
    index: "02",
    title: "Jobless",
    category: "Tooling",
    year: 2026,
    line: "Five job boards a day was four too many.",
    blurb:
      "Job hunting is already frustrating. Looking across five different job boards every day makes it worse.",
    tags: ["Python", "AI Validation", "Web Scraping", "MongoDB"],
    cover: {
      src: "/images/work/jobless.webp",
      plate: "/images/work/jobless-plate.webp",
      alt: "A dot matrix thinning left to right, three dots picked out in vermilion.",
      width: 1600,
      height: 1100,
    },
    repo: "https://github.com/chijex5/ai-scraper",
    blocks: [
      {
        kind: "text",
        body: "Jobless pulls listings from multiple sources, validates them with AI, and ranks them using a weighted scoring system so the best opportunities don't get buried under noise.",
      },
      {
        kind: "text",
        body: "Instead of showing every listing equally, it tries to answer a simple question:",
      },
      {
        kind: "quote",
        body: "Which jobs are actually worth my time?",
      },
    ],
  },
  {
    slug: "wayframe",
    index: "03",
    title: "Wayframe",
    category: "AI tooling",
    year: 2026,
    line: "I kept forgetting to design screens.",
    blurb: "This exists because I kept forgetting screens.",
    tags: ["Next.js", "TypeScript", "LLMs", "React Flow"],
    cover: {
      src: "/images/work/wayframe.webp",
      plate: "/images/work/wayframe-plate.webp",
      alt: "Wayframe's dark canvas: \u201cDescribe the app. Get the screen flow.\u201d beside a column of metrics and an empty flow canvas.",
      width: 2400,
      height: 1650,
    },
    live: "https://wayframe.vercel.app",
    repo: "https://github.com/chijex5/wayframe",
    blocks: [
      {
        kind: "text",
        body: "I'd start building an app, get halfway through, and suddenly realize I never designed something important like password recovery, onboarding, or address collection.",
      },
      {
        kind: "text",
        body: "Wayframe lets me describe an application in plain English and turns it into an editable flow diagram. It also compares the flow against patterns from similar products and points out screens I probably missed.",
      },
      {
        kind: "quote",
        body: "The best feature isn't the generation. It's catching mistakes before they become rewrites.",
      },
    ],
  },
  {
    slug: "blog",
    index: "04",
    title: "Blog",
    category: "Publishing",
    year: 2026,
    line: "Blogging platforms are built for teams. I'm one person.",
    blurb:
      "Most blogging platforms are built for teams. I wanted one built for me.",
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
    blocks: [
      {
        kind: "text",
        body: "This is a custom publishing platform with its own admin dashboard, rich-text editor, database, and email pipeline. Everything is designed around my writing process rather than trying to be a general-purpose CMS.",
      },
      {
        kind: "quote",
        body: "I use it because it fits how I work.",
      },
    ],
  },
  {
    slug: "picpress",
    index: "05",
    title: "PicPress",
    category: "Utility",
    year: 2026,
    line: "Twenty photos shouldn't make a 300MB PDF.",
    blurb:
      "A friend sends twenty iPhone photos. You turn them into a PDF. The PDF is somehow 300MB. That's the entire reason this project exists.",
    tags: ["React", "Next.js", "Client-side Processing", "PDF Generation"],
    cover: {
      src: "/images/work/picpress.webp",
      plate: "/images/work/picpress-plate.webp",
      alt: "PicPress on warm paper: \u201cTwelve phone photos. A 248MB PDF.\u201d beside a before-and-after file-size readout.",
      width: 2400,
      height: 1650,
    },
    live: "https://benevolent-figolla-7f76d9.netlify.app",
    repo: "https://github.com/chijex5/picpress",
    blocks: [
      {
        kind: "text",
        body: "PicPress compresses images directly in the browser, lets users arrange them into pages, and exports a PDF without uploading anything to a server.",
      },
      {
        kind: "text",
        body: "No account. No setup. No unnecessary steps.",
      },
      {
        kind: "quote",
        body: "Just a smaller PDF.",
      },
    ],
  },
  {
    slug: "precious-and-emmanuel",
    index: "06",
    title: "Precious & Emmanuel",
    category: "Client project",
    year: 2026,
    line: "A wedding, real guests, and a date that wouldn't move.",
    blurb:
      "A wedding website comes with something most side projects don't: an immovable deadline.",
    tags: ["Next.js", "PostgreSQL", "RSVP System", "Ticket Generation"],
    cover: {
      src: "/images/work/precious-and-emmanuel.webp",
      plate: "/images/work/precious-and-emmanuel-plate.webp",
      alt: "Precious and Emmanuel's wedding site: the couple photographed under a floral arch, their names set over the picture in a high-contrast serif.",
      width: 2400,
      height: 1650,
    },
    live: "https://emmanuel-precious.vercel.app",
    repo: "https://github.com/chijex5/emmanuel-precious",
    blocks: [
      {
        kind: "text",
        body: "This redesign includes guest management, RSVP tracking, digital invitations, and ticket-style confirmations. The goal was simple: make it easy for guests to respond, keep everything organized, and give the experience a little more personality than a typical event page.",
      },
      {
        kind: "text",
        body: "It needed to work for real guests, real families, and a real date on the calendar.",
      },
      {
        kind: "quote",
        body: "Those are always the most interesting projects.",
      },
    ],
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
