/**
 * The chapter the visitor is in, for the HUD's running label. Written by
 * whatever page owns the story (or a case study), read with
 * useSyncExternalStore.
 */
export type Chapter = { index: string; label: string };

let current: Chapter = { index: "00", label: "Intro" };
const listeners = new Set<() => void>();

export const chapter = {
  get: () => current,
  set(next: Chapter) {
    if (next.index === current.index && next.label === current.label) return;
    current = next;
    listeners.forEach((fn) => fn());
  },
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};
