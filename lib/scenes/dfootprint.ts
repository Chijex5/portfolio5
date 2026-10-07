import type { SceneCopy } from "./types";

/**
 * D'Footprint — one made-to-measure order, from picking a pair to the doorstep.
 *
 * PLACEHOLDER DETAILS: the product name, price, foot length, card digits, order
 * number and times below were made up so the scene reads. Swap in real ones.
 */
export const dfootprint = {
  steps: [
    {
      title: "Pick a pair.",
      body: "Every pair is cut to the customer's foot. They choose a style and give a measurement, not a size.",
    },
    {
      title: "Pay with Paystack.",
      body: "Real orders, real money, settled in naira on my own checkout.",
    },
    {
      title: "Watch it get made.",
      body: "The order moves across the workshop bench one step at a time, and the customer sees every step.",
    },
    {
      title: "At the door.",
      body: "Dispatched, tracked, delivered. Nobody has to ask where their order is.",
    },
  ],
  product: {
    name: "Leather slide",
    variant: "Tan, hand-stitched",
    price: "₦28,500",
    sizes: ["40", "41", "42", "43"],
    custom: "Made to measure",
    footLength: "26.4 cm",
  },
  payment: { card: "•••• 4081" },
  order: {
    id: "DF-0142",
    steps: [
      { label: "Cut", time: "Mon 09:40" },
      { label: "Stitched", time: "Tue 14:05" },
      { label: "Finished", time: "Wed 11:30" },
      { label: "Dispatched", time: "Thu 08:15" },
      { label: "Delivered", time: "Thu 16:50" },
    ],
  },
  notification: {
    title: "Your pair is on its way",
    body: "Arriving today, Lekki. Tap to track.",
  },
} as const satisfies SceneCopy & Record<string, unknown>;
