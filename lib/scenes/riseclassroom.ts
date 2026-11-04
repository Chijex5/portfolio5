import type { SceneCopy } from "./types";

/**
 * Rise Classroom — one cohort's first weeks, from the invite link to the
 * assignment deadline. Names and numbers are demo data, not a real cohort.
 */
export const riseclassroom = {
  steps: [
    {
      title: "A cohort starts.",
      body: "One invite link. Thirty-two students onboard themselves; nobody is added by hand.",
    },
    {
      title: "Mentors get their people.",
      body: "Every mentor sees their own group, and you see every mentor.",
    },
    {
      title: "Someone goes quiet.",
      body: "Rise flags who hasn't shown up in days, so you can ask what's wrong before they drop out.",
    },
    {
      title: "Attendance and work, one place.",
      body: "Classes attended and assignments submitted, tracked where the cohort already lives.",
    },
  ],
  cohort: "Frontend · Cohort 4",
  students: 32,
  mentors: ["Uche", "Amaka", "Tobi", "Zainab"],
  /** Seat numbers (0–31) of the students who go quiet in step 3. */
  quiet: [
    { seat: 6, name: "Kelechi O.", days: 6 },
    { seat: 19, name: "Bisi A.", days: 5 },
    { seat: 27, name: "Femi D.", days: 4 },
  ],
  attendance: [94, 88, 91, 72, 97],
  assignment: { title: "Build a landing page", submitted: 27 },
} as const satisfies SceneCopy & Record<string, unknown>;
