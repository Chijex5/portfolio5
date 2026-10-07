/**
 * Content types — see portfolio-build-plan.md §5.
 *
 * `cover` is optional: the work list falls back to a typographic plate when a
 * project has no image, so covers stay a data-only change.
 */

export type CaseStudyBlock =
  | { kind: "text"; heading?: string; body: string }
  /**
   * A line that carries the whole point of a case study and should not be read as
   * another paragraph — "Which jobs are actually worth my time?", "Just a smaller
   * PDF." Its own kind rather than a `text` block with a flag, so the renderer
   * cannot accidentally give it a heading and so the intent is legible in the data.
   */
  | { kind: "quote"; body: string }
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
  /**
   * The annoyance the project answers, in one short line. The home page's proof
   * chapter shows this and nothing else, so it has to stand on its own.
   */
  line: string;
  tags: readonly string[];
  cover?: {
    /**
     * The master, 2400x1650 (16:11). Everything that goes through next/image
     * reads this: the case-study cover, the OG card.
     */
    src: string;
    /**
     * The same picture at 1240x850. The particle stage samples this one: it only
     * needs a few hundred pixels across, and decoding the master would cost a
     * 2400px decode per project during the preloader.
     */
    plate?: string;
    alt: string;
    width: number;
    height: number;
  };
  /** Live deployment, when there is one to link. */
  live?: string;
  /** Public source. Absent means the repo is private, not that it doesn't exist. */
  repo?: string;
  blocks?: CaseStudyBlock[];
}
