/**
 * The visitor's theme: light or dark, and an accent colour.
 *
 * Stored on <html> as `data-theme` and `data-accent`, which globals.css turns
 * into tokens. An inline script in the layout applies the saved choice before
 * first paint (see `THEME_SCRIPT`), so there is no flash of the wrong theme;
 * this module takes over once React is running.
 */

export type Mode = "light" | "dark";

export const ACCENTS = [
  { id: "jollof", label: "Jollof", light: "#b8321a", dark: "#ff5a36" },
  { id: "plantain", label: "Plantain", light: "#9a6106", dark: "#f2b13c" },
  { id: "indigo", label: "Indigo", light: "#4338ca", dark: "#a094ff" },
  { id: "forest", label: "Forest", light: "#1d7048", dark: "#4cc98c" },
  { id: "mono", label: "Mono", light: "#1a120d", dark: "#f3eadb" },
] as const;

export type AccentId = (typeof ACCENTS)[number]["id"];
export type Theme = { mode: Mode; accent: AccentId };

const KEY = "theme";
const DEFAULT_ACCENT: AccentId = "jollof";

/**
 * Runs in <head> before the page paints. Kept dependency-free and tiny; it
 * must agree with `read()` below on the storage format.
 */
export const THEME_SCRIPT = `(function(){var d=document.documentElement,t={};try{t=JSON.parse(localStorage.getItem("${KEY}")||"{}")}catch(e){}var m=t.mode==="dark"||t.mode==="light"?t.mode:(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");d.setAttribute("data-theme",m);d.setAttribute("data-accent",t.accent||"${DEFAULT_ACCENT}")})();`;

function read(): Theme {
  const d = document.documentElement;
  const mode = d.getAttribute("data-theme") === "dark" ? "dark" : "light";
  const a = d.getAttribute("data-accent");
  const accent = ACCENTS.some((x) => x.id === a)
    ? (a as AccentId)
    : DEFAULT_ACCENT;
  return { mode, accent };
}

let current: Theme | null = null;
const SERVER: Theme = { mode: "light", accent: DEFAULT_ACCENT };
const listeners = new Set<() => void>();

export const theme = {
  get(): Theme {
    if (!current) current = read();
    return current;
  },
  /** For useSyncExternalStore on the server: the markup is themed by CSS. */
  getServer(): Theme {
    return SERVER;
  },
  set(next: Partial<Theme>) {
    const t = { ...theme.get(), ...next };
    current = t;
    const d = document.documentElement;
    // Colours ease over for the length of the switch only — a permanent
    // transition would also animate every hover and the first paint.
    d.classList.add("theme-anim");
    d.setAttribute("data-theme", t.mode);
    d.setAttribute("data-accent", t.accent);
    window.setTimeout(() => d.classList.remove("theme-anim"), 600);
    try {
      localStorage.setItem(KEY, JSON.stringify(t));
    } catch {}
    listeners.forEach((fn) => fn());
  },
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};
