/**
 * The load gate — the one signal that says "the page is ready, open the site".
 *
 * The hero's opening cannot start on its own mount. Mount means "React
 * hydrated", which is a different moment from "the webfont has swapped, the
 * covers have decoded and the chunks have landed" — and starting the reveal on
 * the first of those is why the old intro uncovered a half-assembled page. So
 * the preloader owns the wait and publishes one event here; everything that used
 * to start on mount now starts on that event instead.
 *
 * Deliberately not React state or context, for the reasons lib/velocity.ts sets
 * out: the subscribers are GSAP timelines, not renders. A context would make the
 * reveal a re-render of the entire tree at the exact moment the frame budget is
 * tightest, whereas a module singleton read imperatively costs nothing.
 */

declare global {
  interface Window {
    /**
     * The last-resort timer armed by the blocking inline script in
     * app/layout.tsx, which un-hides the hero if the reveal never comes.
     * Cleared here the moment it does.
     */
    __introFailsafe?: ReturnType<typeof setTimeout>;
  }
}

const KEY = "intro-played";

/** A one-way door: once the reveal is open it never closes, not even on revert. */
let started = false;
const waiting = new Set<() => void>();

/**
 * Has this tab already played the intro?
 *
 * Reads sessionStorage rather than the `data-intro-seen` attribute the inline
 * script sets. The attribute exists so CSS can hide the preloader *before first
 * paint*, which storage cannot do — but React's dev-mode remount resets <html>
 * to only the attributes JSX manages, so the attribute is not something JS can
 * trust. Storage is.
 */
export function introSeen(): boolean {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    // Private mode, or storage disabled. Playing the intro twice is a far
    // smaller problem than throwing on the way into it.
    return false;
  }
}

/**
 * Remember the intro for the rest of the tab.
 *
 * Called when the gate *resolves*, not when the sequence finishes: a reload
 * partway through the exit is still a visit that has seen the opening, and
 * writing it at the end meant a reload at 1s replayed the whole thing.
 */
export function markIntroSeen(): void {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {
    /* see above — nothing to do */
  }
}

/** Cheap synchronous read, for a subscriber that needs to know it is late. */
export function revealStarted(): boolean {
  return started;
}

/**
 * Run `fn` when the site opens.
 *
 * Fires *immediately* if the reveal has already started, so a component that
 * mounts late — a client-side navigation back to `/`, a dev StrictMode remount,
 * a SplitText re-split — is never left waiting for a signal that has already
 * passed. Returns an unsubscribe for the GSAP context to call on revert.
 */
export function onRevealStart(fn: () => void): () => void {
  if (started) {
    fn();
    return () => {};
  }
  waiting.add(fn);
  return () => {
    waiting.delete(fn);
  };
}

/**
 * Open the site. Called by the preloader as its panels begin to part.
 *
 * Idempotent, which is what makes a replay harmless: `.intro-done` is a raw
 * class on the section and therefore invisible to GSAP's context, so a revert
 * (dev StrictMode, a matchMedia change) can re-enter the hero's setup with the
 * reveal already finished. Every gated animation asks here first.
 */
export function beginReveal(): void {
  if (started) return;
  started = true;

  // The reveal happening is precisely what the failsafe was insurance against.
  if (typeof window !== "undefined") {
    clearTimeout(window.__introFailsafe);
    window.__introFailsafe = undefined;
  }

  // Snapshot before running: a subscriber is free to unsubscribe another (a
  // re-split does exactly that), and mutating the set mid-iteration is how that
  // turns into a skipped animation.
  const fns = [...waiting];
  waiting.clear();
  for (const fn of fns) fn();
}
