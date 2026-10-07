import type Lenis from "lenis";

/**
 * The page's Lenis instance, for code outside React that has to pause or jump
 * the scroll — the preloader and the page transition. Set by
 * SmoothScrollProvider; null under reduced motion, where native scroll is used.
 */
let instance: Lenis | null = null;

export function setLenis(l: Lenis | null) {
  instance = l;
}

export function getLenis() {
  return instance;
}

/** Stop or resume user scrolling, whichever scroller is active. */
export function lockScroll(locked: boolean) {
  if (instance) {
    if (locked) instance.stop();
    else instance.start();
  }
  document.documentElement.classList.toggle("is-locked", locked);
}

/**
 * Where the story was when a project was opened, so the browser's back button
 * returns to that project instead of wherever the case study was scrolled to.
 * Only restored on history navigation (popstate) — a fresh visit to "/" starts
 * at the top.
 */
let poppedAt = 0;
if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    poppedAt = performance.now();
  });
}

const KEY = "story-y";

export function rememberStory() {
  try {
    sessionStorage.setItem(KEY, String(window.scrollY));
  } catch {}
}

/** The saved story position if we arrived by Back, else null. */
export function recallStory(): number | null {
  if (performance.now() - poppedAt > 2000) return null;
  try {
    const v = sessionStorage.getItem(KEY);
    return v === null ? null : Number(v);
  } catch {
    return null;
  }
}
