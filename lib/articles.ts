import type { Article } from "@/lib/types";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Entry 01 is real. Entries 02–05 are PLACEHOLDERS — REPLACE THEM.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * "Shipped." is written; the four below it are stand-ins kept so the section has
 * a list to be a list. Their titles and dates are invented.
 *
 * Five stand-in posts. They exist so the Writing section has believable rhythm
 * to animate against: a long title next to a short one, a mix of topics, dates
 * that fall in descending order, and read times that vary. Swap the objects for
 * real posts and nothing else needs to change — the section reads length, order
 * and `topic` off this array and derives everything else.
 *
 * Two things to keep when you replace them:
 *
 *   - `index` runs in display order ("01" first). It is editorial, not derived,
 *     so a post can be pinned out of date order without renumbering the rest.
 *   - The first entry is the featured one. Writing.tsx gives it the large
 *     treatment and shows its `standfirst`; the rest render as compact rows, so
 *     put the piece worth leading with first rather than the newest.
 *
 * `date` is ISO and formatted at render, so these never drift out of the format
 * the rest of the site uses.
 */
export const articles: readonly Article[] = [
  {
    slug: "shipped",
    index: "01",
    title: "Shipped.",
    standfirst: "My favourite projects are the ones that leave my laptop.",
    excerpt: [
      "The storefront collecting payments.",
      "The wedding website handling RSVPs.",
      "The tool saving somebody fifty minutes of repetitive work.",
      "Shipping changes how you think about software. Users don't care how elegant the architecture is if the email never arrives.",
    ],
    topic: "Engineering",
    date: "2026-07-18",
    minutes: 6,
    href: "https://chijioke.app",
  },
  {
    slug: "variable-fonts-as-motion",
    index: "02",
    title: "Variable fonts are an animation surface",
    standfirst:
      "Weight and optical size are numbers, and numbers can be scrubbed. Type becomes motion without a single image.",
    topic: "Craft",
    date: "2026-06-02",
    minutes: 6,
    href: "https://chijioke.app",
  },
  {
    slug: "the-cost-of-smooth-scroll",
    index: "03",
    title: "The real cost of smooth scroll",
    standfirst:
      "One scroll driver, or two systems quietly disagreeing about where the page is. There is no third option.",
    topic: "Performance",
    date: "2026-04-27",
    minutes: 7,
    href: "https://chijioke.app",
  },
  {
    slug: "postgres-before-you-need-it",
    index: "04",
    title: "Reach for Postgres before you think you need it",
    standfirst:
      "The migration you avoid on day one is the one that costs a fortnight in month six.",
    topic: "Backend",
    date: "2026-03-11",
    minutes: 5,
    href: "https://chijioke.app",
  },
  {
    slug: "studying-while-building",
    index: "05",
    title: "Building things while the term is still running",
    standfirst:
      "Statistics coursework and a shipping deadline want the same hours. What actually gave.",
    topic: "Personal",
    date: "2026-01-30",
    minutes: 4,
    href: "https://chijioke.app",
  },
];

/** The lead entry — rendered large, with its standfirst. */
export const featuredArticle = articles[0];

/** Everything after the lead, as compact rows. */
export const restArticles = articles.slice(1);

/**
 * "18 Jul 2026". Fixed to en-GB and UTC on purpose: the dates are plain calendar
 * days with no time component, so formatting them in the visitor's locale and
 * zone would render a post published on the 18th as the 17th for anyone west of
 * UTC, and would make the server and client markup disagree during hydration.
 */
export function formatArticleDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
