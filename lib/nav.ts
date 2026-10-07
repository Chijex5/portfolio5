/**
 * Site-wide identity and navigation.
 * Single source for anything that appears in more than one place.
 */

export type NavLink = { href: string; label: string };

export const NAV_LINKS: readonly NavLink[] = [
  { href: "/#work", label: "Work" },
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
  /** "Currently" and "studied" — the only CV the home page carries. */
  current: "Transfer pricing, EY Nigeria",
  studied: "Statistics, University of Nigeria",
  writing: "https://chijioke.app",
} as const;
