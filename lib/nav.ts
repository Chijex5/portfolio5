/**
 * Site-wide identity, navigation and the stack strip.
 * Single source for anything that appears in more than one place.
 */

export type NavLink = { href: string; label: string };

export const NAV_LINKS: readonly NavLink[] = [
  { href: "/#work", label: "Work" },
  { href: "/#about", label: "About" },
  { href: "/#contact", label: "Contact" },
];

export const SOCIAL_LINKS: readonly NavLink[] = [
  { href: "https://github.com/chijex5", label: "GitHub" },
  {
    href: "https://linkedin.com/in/chijioke-uzodinma-34389b267",
    label: "LinkedIn",
  },
  { href: "https://x.com/chijex5", label: "X" },
];

export const CONTACT = {
  name: "Chijioke Uzodinma",
  /** Wordmark and first-person copy. */
  shortName: "Chijioke",
  role: "Full-stack developer",
  email: "embroconnect3@gmail.com",
  location: "Lagos",
  /** Drives the header/hero local clock. */
  timeZone: "Africa/Lagos",
  available: true,
} as const;

/**
 * Capabilities, grouped by where they sit in a build.
 *
 * Replaces the flat marquee list: a strip scrolling past says "here are some
 * words", whereas four named groups say what is actually owned end to end, which
 * is the claim the hero makes. Order matters — it runs front to back, the same
 * order as the KineticStatement pipeline.
 *
 * `note` is the one-line "what I do with it" the Capabilities section reveals
 * under each group heading. Keep them short; they are set as body copy beside
 * large type and a second line unbalances the row.
 */
export type CapabilityGroup = {
  /** Mono label, uppercased by CSS. */
  label: string;
  note: string;
  items: readonly string[];
};

export const CAPABILITIES: readonly CapabilityGroup[] = [
  {
    label: "Interface",
    note: "The part people actually touch — built to survive real use, not just a demo.",
    items: ["React", "Next.js", "React Native", "TypeScript", "Tailwind"],
  },
  {
    label: "Motion",
    note: "Animation as structure rather than decoration: scroll, type and WebGL on one clock.",
    items: ["GSAP", "WebGL / GLSL", "Three.js", "Lenis"],
  },
  {
    label: "Services",
    note: "The API and the jobs behind it, including the unglamorous scraping and scoring.",
    items: ["Python", "FastAPI", "Node", "REST"],
  },
  {
    label: "Data",
    note: "Schema first. The model decides how much the next six months cost.",
    items: ["PostgreSQL", "MongoDB", "Prisma"],
  },
];

/** Total tools across every group — drives the hero's "in rotation" stat. */
export const CAPABILITY_COUNT = CAPABILITIES.reduce(
  (total, group) => total + group.items.length,
  0,
);
