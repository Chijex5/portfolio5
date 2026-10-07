/**
 * First-load sequencing, shared by the preloader and whatever page is under it.
 *
 *   loading   the preloader is up
 *   reveal    it is leaving; the page should play its entrance now
 *
 * A page that mounts after the intro (client navigation) sees `reveal` straight
 * away and should show itself without waiting.
 */
type Phase = "loading" | "reveal";

let phase: Phase = "loading";
const listeners = new Set<() => void>();

export const intro = {
  get phase() {
    return phase;
  },
  reveal() {
    if (phase === "reveal") return;
    phase = "reveal";
    document.documentElement.setAttribute("data-intro-done", "");
    listeners.forEach((fn) => fn());
  },
  /** Run `fn` once the reveal starts — immediately if it already has. */
  onReveal(fn: () => void) {
    if (phase === "reveal") {
      fn();
      return () => {};
    }
    const once = () => {
      listeners.delete(once);
      fn();
    };
    listeners.add(once);
    return () => {
      listeners.delete(once);
    };
  },
};
