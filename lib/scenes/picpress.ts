import type { SceneCopy } from "./types";

/**
 * PicPress — twelve phone photos to one small PDF, without leaving the device.
 *
 * The 248 MB → 4.1 MB figures come from the PicPress site's own example;
 * the per-photo sizes are rounded to match.
 */
export const picpress = {
  steps: [
    {
      title: "Twelve photos. 248 MB.",
      body: "A friend sends phone photos. Turned straight into a PDF, the file is too big to send anywhere.",
    },
    {
      title: "Shrunk on the device.",
      body: "Each photo is compressed in the browser the moment it's added. Nothing is uploaded.",
    },
    {
      title: "Laid out as pages.",
      body: "Drag them into order; they flow onto pages.",
    },
    {
      title: "One small PDF.",
      body: "Sharp, readable, and finally small enough to send.",
    },
  ],
  photos: 12,
  before: { each: "20.6 MB", total: 248 },
  after: { each: "340 KB", total: 4.1 },
  file: "photos.pdf",
} as const satisfies SceneCopy & Record<string, unknown>;
