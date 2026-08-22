/**
 * Content types — see portfolio-build-plan.md §5.
 *
 * `cover` is optional: the work list falls back to a typographic plate when a
 * project has no image, so covers stay a data-only change.
 */

export type CaseStudyBlock =
  | { kind: "text"; heading?: string; body: string }
  | { kind: "image"; src: string; alt: string; wide?: boolean };

export interface Project {
  /** URL segment: /work/[slug] */
  slug: string;
  /** Editorial index — "01".."06", drives the plate numeral. */
  index: string;
  title: string;
  /** "E-commerce", "AI tooling", … */
  category: string;
  year: number;
  /** One paragraph. Doubles as the case-study meta description. */
  blurb: string;
  tags: readonly string[];
  cover?: {
    /**
     * The master, 2400x1650 (16:11). Everything that goes through next/image
     * reads this: the case-study cover, the work-row plate, the OG card.
     */
    src: string;
    /**
     * The same picture at 1240x850, for the WebGL carousel only — and this is a
     * correctness field, not an optimisation. CarouselScene loads its textures
     * with THREE.TextureLoader, which bypasses next/image entirely: the file is
     * fetched at full size and the GPU holds it *uncompressed*. At 2400x1650
     * that is ~15.8 MB per plate before mipmaps, and the ring draws six or more.
     * measureTrack caps a plate at 620 CSS px, so 1240 is already 2x the largest
     * size it can ever be drawn at and the master buys nothing on screen.
     *
     * Falls back to `src` when absent.
     */
    plate?: string;
    alt: string;
    width: number;
    height: number;
  };
  /** Live deployment, when there is one to link. */
  live?: string;
  blocks?: CaseStudyBlock[];
}

/**
 * A writing entry for the featured-articles section.
 *
 * PLACEHOLDER CONTENT — lib/articles.ts ships five stand-ins so the section has
 * real rhythm to animate against. Swap them for actual posts; nothing outside
 * that one file needs to change.
 */
export interface Article {
  /** Stable key. Also the fragment used if these ever become local routes. */
  slug: string;
  /** Editorial index — "01".."05". */
  index: string;
  title: string;
  /** One line. Sits under the title on the featured entry only. */
  standfirst: string;
  /** "Engineering", "Craft", … — the mono label. */
  topic: string;
  /** ISO date. Rendered via toLocaleDateString, so no pre-formatted strings. */
  date: string;
  /** Whole minutes. Rendered as "6 min". */
  minutes: number;
  /** Where it lives. External for now, since the blog is its own deployment. */
  href: string;
}
