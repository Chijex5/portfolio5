import type { SceneCopy } from "./types";

/**
 * VoltIq — one night of an outage in Nsukka, from the bang to the forecast.
 *
 * The neighbourhoods, counts and times follow the VoltIq site's own demo story
 * (Odenigwe, 47 reports, Crew Bravo, Odim Gate at 78%). They are demo data
 * there too, not live EEDC figures.
 */
export const voltiq = {
  steps: [
    {
      title: "The light goes.",
      body: "A transformer near the UNN gate blows. About 610 homes in Odenigwe go dark at once.",
    },
    {
      title: "Neighbours report it.",
      body: "One tap each. Every report lands on the same live map, so nobody wonders if it's just their house.",
    },
    {
      title: "A crew is already moving.",
      body: "EEDC sees the fault ranked by homes affected, and the nearest crew is one tap away.",
    },
    {
      title: "Next time, a warning first.",
      body: "Light restored, everyone who reported is told. Then the forecast flags the next street before it happens.",
    },
  ],
  times: ["9:47 PM", "9:49 PM", "10:02 PM", "Tomorrow, 4:00 PM"],
  outage: { area: "Odenigwe", homes: 610 },
  reports: 47,
  crew: { name: "Crew Bravo", distance: "3 km" },
  forecast: { area: "Odim Gate", chance: "78%", window: "7–10 PM" },
} as const satisfies SceneCopy & Record<string, unknown>;
