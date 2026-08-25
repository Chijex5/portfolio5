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
    note: "The part people see and complain about when it breaks.",
    items: ["React", "Next.js", "React Native", "TypeScript", "Tailwind"],
  },
  {
    label: "Motion",
    note: "Just enough movement to make things feel alive. Not enough to make people dizzy.",
    items: ["GSAP", "Three.js", "WebGL / GLSL", "Lenis"],
  },
  {
    label: "Services",
    note: "The backend, the automation, the scheduled jobs, and all the boring bits that make the product actually work.",
    items: ["Python", "FastAPI", "Node.js", "REST APIs"],
  },
  {
    label: "Data",
    note: "I spend an unhealthy amount of time thinking about schemas before writing features.",
    items: ["PostgreSQL", "MongoDB", "Drizzle ORM", "Prisma"],
  },
];

/** Total tools across every group — drives the hero's "in rotation" stat. */
export const CAPABILITY_COUNT = CAPABILITIES.reduce(
  (total, group) => total + group.items.length,
  0,
);
