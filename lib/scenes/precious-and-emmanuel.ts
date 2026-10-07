import type { SceneCopy } from "./types";

/**
 * Precious & Emmanuel — a wedding site that had to work for real guests by a
 * real date.
 *
 * PLACEHOLDER DETAILS: the date, guest names, table, gate and counts were made
 * up so the scene reads. Swap in real ones.
 */
export const preciousAndEmmanuel = {
  steps: [
    {
      title: "A date that won't move.",
      body: "Two people who aren't developers, and a deadline no sprint can push.",
    },
    {
      title: "Guests RSVP in a minute.",
      body: "Name, yes or no, plus-one. Built for aunties on old phones, not for developers.",
    },
    {
      title: "Everyone gets a ticket.",
      body: "A ticket-style confirmation with a code for the door, so the day runs on a list, not memory.",
    },
    {
      title: "The room fills up.",
      body: "The couple watch the responses come in, without asking anyone to check a spreadsheet.",
    },
  ],
  couple: ["Precious", "Emmanuel"],
  date: "Saturday, 14 November 2026",
  countdown: { days: 42, time: "06:12:09" },
  guest: { name: "Ada Okafor", plusOne: "Chidi Okafor" },
  ticket: { table: "Table 7", gate: "Gate B", code: "PE-0214" },
  attending: { now: 214, capacity: 250 },
  recent: ["Ada Okafor +1", "Tunde Bello", "Ngozi Eze +1", "Ifeanyi Obi"],
} as const satisfies SceneCopy & Record<string, unknown>;
