import type { SceneCopy } from "./types";

/**
 * Jobless — a morning's listings, cleaned, ranked and tracked.
 *
 * PLACEHOLDER DETAILS: the counts, roles, companies and scores were made up so
 * the scene reads. Swap in real ones.
 */
export const jobless = {
  steps: [
    {
      title: "Five boards, one inbox.",
      body: "Listings are scraped from every board overnight and land in one place.",
    },
    {
      title: "Most of it is noise.",
      body: "AI validation throws out duplicates, expired posts and roles that don't fit.",
    },
    {
      title: "Ranked against me.",
      body: "What's left is scored on skills, pay and remote, so the best ones float up.",
    },
    {
      title: "Tracked to signed.",
      body: "Saved, applied, interviewing, offer. Every application in one board.",
    },
  ],
  sources: ["LinkedIn", "Indeed", "Jobberman", "RemoteOK", "Wellfound"],
  scraped: 412,
  kept: 57,
  // In the order they arrive; the scene re-sorts the keepers by score.
  listings: [
    {
      role: "Full-stack Engineer",
      company: "Payments · Lagos",
      tag: "",
      score: 87,
    },
    {
      role: "React Developer",
      company: "Talent network",
      tag: "Duplicate",
      score: 0,
    },
    { role: "Software Engineer", company: "Bank · Remote", tag: "", score: 74 },
    {
      role: "Web Developer",
      company: "Agency · Abuja",
      tag: "Expired",
      score: 0,
    },
    {
      role: "Frontend Engineer",
      company: "Fintech · Remote",
      tag: "",
      score: 92,
    },
    {
      role: "Junior Dev (on-site)",
      company: "Unlisted",
      tag: "Not a fit",
      score: 0,
    },
  ],
  columns: ["Saved", "Applied", "Interview", "Offer"],
} as const satisfies SceneCopy & Record<string, unknown>;
