import type { ComponentType } from "react";
import { dfootprint } from "@/lib/scenes/dfootprint";
import { jobless } from "@/lib/scenes/jobless";
import { picpress } from "@/lib/scenes/picpress";
import { preciousAndEmmanuel } from "@/lib/scenes/precious-and-emmanuel";
import type { SceneCopy } from "@/lib/scenes/types";
import { voltiq } from "@/lib/scenes/voltiq";
import { wayframe } from "@/lib/scenes/wayframe";
import DfootprintScene from "./Dfootprint";
import JoblessScene from "./Jobless";
import PicpressScene from "./Picpress";
import PreciousEmmanuelScene from "./PreciousEmmanuel";
import type { SceneProps } from "./types";
import VoltiqScene from "./Voltiq";
import WayframeScene from "./Wayframe";

export type Scene = { Component: ComponentType<SceneProps>; copy: SceneCopy };

/** Project slug → its scene. Every project in lib/projects.ts has one. */
export const SCENES: Partial<Record<string, Scene>> = {
  dfootprint: { Component: DfootprintScene, copy: dfootprint },
  voltiq: { Component: VoltiqScene, copy: voltiq },
  wayframe: { Component: WayframeScene, copy: wayframe },
  jobless: { Component: JoblessScene, copy: jobless },
  picpress: { Component: PicpressScene, copy: picpress },
  "precious-and-emmanuel": {
    Component: PreciousEmmanuelScene,
    copy: preciousAndEmmanuel,
  },
};
