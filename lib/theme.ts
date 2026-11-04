/**
 * The visitor's accent colour. The site has one look (dark); the accent is
 * the only thing a visitor chooses.
 *
 * Stored on <html> as `data-accent`, which globals.css turns into the
 * `--accent` token. An inline script in the layout applies the saved choice
 * before first paint (see `THEME_SCRIPT`), so it never flashes; this module
 * takes over once React is running.
 */

export const ACCENTS = [
  { id: "iris", label: "Iris", color: "#a9b1f5" },
  { id: "sage", label: "Sage", color: "#a9c9a1" },
  { id: "clay", label: "Clay", color: "#d99a7f" },
  { id: "sand", label: "Sand", color: "#d9c294" },
  { id: "bone", label: "Bone", color: "#e9e5dd" },
] as const;

export type AccentId = (typeof ACCENTS)[number]["id"];
export type Theme = { accent: AccentId };

const KEY = "accent";
const DEFAULT_ACCENT: AccentId = "iris";
const IDS = ACCENTS.map((a) => a.id).join("|");

/**
 * Runs in <head> before the page paints. Kept dependency-free and tiny; it
 * must agree with `read()` below on the storage format.
 */
export const THEME_SCRIPT = `(function(){try{var a=localStorage.getItem("${KEY}");if(/^(${IDS})$/.test(a||""))document.documentElement.setAttribute("data-accent",a)}catch(e){}})();`;

function read(): Theme {
  const a = document.documentElement.getAttribute("data-accent");
  const accent = ACCENTS.some((x) => x.id === a)
    ? (a as AccentId)
    : DEFAULT_ACCENT;
  return { accent };
}

let current: Theme | null = null;
const SERVER: Theme = { accent: DEFAULT_ACCENT };
const listeners = new Set<() => void>();

export const theme = {
  default: DEFAULT_ACCENT,
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
    window.setTimeout(() => d.classList.remove("theme-anim"), 600);
    d.setAttribute("data-accent", t.accent);
    try {
      localStorage.setItem(KEY, t.accent);
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
