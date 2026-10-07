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

/**
 * Home → case study hand-off. The home page sets the slug just before it
 * navigates; the case study's cover reads it to know the particles are holding
 * its picture and it should fade in over them rather than play its own reveal.
 */
let pending: string | null = null;
export const handoff = {
  /** Called by the home page just before it navigates. */
  begin(slug: string) {
    pending = slug;
  },
  /** Is a hand-off to `slug` in flight? Clears it either way. */
  take(slug: string) {
    const hit = pending === slug;
    pending = null;
    return hit;
  },
  get active() {
    return pending !== null;
  },
};
