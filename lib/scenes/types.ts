/**
 * Copy for a project's scene: the steps the scene acts out, in order. Each
 * step is one beat of scroll on the home page and one beat of the loop on the
 * case study. The scene component owns the visuals; everything a person reads
 * lives in these files so it can be corrected without touching animation code.
 */
export type SceneStep = {
  /** Short, set large: "Pay with Paystack." */
  title: string;
  /** One sentence under it. */
  body: string;
};

export type SceneCopy = {
  steps: readonly SceneStep[];
};
