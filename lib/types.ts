/**
 * Content types — see portfolio-build-plan.md §5.
 *
 * `cover` is optional for now: the work list renders a typographic plate when a
 * project has no image yet, so adding real covers later is a data-only change.
 * Long-form case-study `blocks` land with the /work/[slug] routes (M5).
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
  cover?: { src: string; alt: string; width: number; height: number };
  /** Live deployment, when there is one to link. */
  live?: string;
  blocks?: CaseStudyBlock[];
}
