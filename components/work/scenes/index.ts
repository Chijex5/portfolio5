import type { ComponentType } from "react";
import type { SceneCopy } from "@/lib/scenes/types";
import { dfootprint } from "@/lib/scenes/dfootprint";
import DfootprintScene from "./Dfootprint";
import type { SceneProps } from "./types";

export type Scene = { Component: ComponentType<SceneProps>; copy: SceneCopy };

/** Project slug → its scene. A project without one here has no scene yet. */
export const SCENES: Partial<Record<string, Scene>> = {
  dfootprint: { Component: DfootprintScene, copy: dfootprint },
};
