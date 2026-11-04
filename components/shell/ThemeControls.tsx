"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { ACCENTS, theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

/**
 * A swatch in the header that opens the accent picker. It writes to
 * `theme`, which repaints the page.
 */
export default function ThemeControls() {
  const t = useSyncExternalStore(theme.subscribe, theme.get, theme.getServer);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const id = useId();

  // Close on a click outside or Escape, and hand focus back to the swatch.
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      box.current?.querySelector<HTMLButtonElement>("[data-swatch]")?.focus();
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div ref={box} className="relative flex items-center gap-1.5">
      <button
        type="button"
        data-swatch
        onClick={() => setOpen((o) => !o)}
        aria-label="Choose accent colour"
        aria-expanded={open}
        aria-controls={id}
        data-cursor="Colour"
        className="border-ink-faint hover:border-ink grid h-8 w-8 place-items-center rounded-full border transition-colors"
      >
        <span className="bg-accent h-3.5 w-3.5 rounded-full" />
      </button>

      <div
        id={id}
        role="radiogroup"
        aria-label="Accent colour"
        className={cn(
          "bg-paper-raised border-ink-faint absolute top-full right-0 mt-3 w-max rounded-2xl border p-3 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.45)] transition-[opacity,transform] duration-300 ease-[var(--ease-out-expo)]",
          open
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0",
        )}
        inert={!open}
      >
        <p className="label text-ink-muted mb-3 px-1">Accent</p>
        <div className="flex gap-2">
          {ACCENTS.map((a) => {
            const on = t.accent === a.id;
            return (
              <button
                key={a.id}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={a.label}
                title={a.label}
                onClick={() => theme.set({ accent: a.id })}
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-full border-2 transition-[border-color,transform] hover:scale-110",
                  on ? "border-ink" : "border-transparent",
                )}
              >
                <span
                  className="h-6 w-6 rounded-full"
                  style={{ background: a.color }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
