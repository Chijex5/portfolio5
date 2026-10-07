import type { SceneCopy } from "./types";

/**
 * Wayframe — one sentence becomes a screen flow, then the pattern check finds
 * the screens that were forgotten.
 *
 * PLACEHOLDER DETAILS: the prompt, screen names and "214 apps" count were made
 * up so the scene reads. Swap in real ones.
 */
export const wayframe = {
  steps: [
    {
      title: "Describe the app.",
      body: "One plain-English sentence. No boxes to drag, no arrows to draw.",
    },
    {
      title: "Get the flow.",
      body: "Every screen becomes a node and every way between them an edge, laid out and editable.",
    },
    {
      title: "See what you forgot.",
      body: "The flow is checked against real apps like it, and the missing screens light up.",
    },
    {
      title: "Fix it before it's code.",
      body: "Accept the suggestions and the flow is whole — before a single route exists.",
    },
  ],
  prompt: "A marketplace for second-hand textbooks.",
  screens: ["Home", "Search", "Listing", "Cart", "Checkout", "Order placed"],
  missing: ["No results", "Sign in", "Password reset"],
  compared: 214,
} as const satisfies SceneCopy & Record<string, unknown>;
