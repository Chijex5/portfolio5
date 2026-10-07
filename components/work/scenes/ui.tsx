import type { HTMLAttributes } from "react";
import type { gsap } from "@/lib/gsap";
import { cn } from "@/lib/utils";

/**
 * The small vocabulary every scene is built from, so the six read as one set:
 * the same panel surface, the same pointer, the same press and the same way a
 * number counts.
 */

/** A floating surface — a window, a sheet, a card. Absolutely placed. */
export function Panel({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border-bone-faint absolute rounded-[14px] border bg-[#161514] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]",
        className,
      )}
      {...rest}
    />
  );
}

/** Browser chrome: three dots and an address. */
export function Chrome({ url }: { url: string }) {
  return (
    <div className="border-bone-faint flex h-[30px] items-center gap-1.5 border-b px-3">
      <span className="bg-bone-faint h-2 w-2 rounded-full" />
      <span className="bg-bone-faint h-2 w-2 rounded-full" />
      <span className="bg-bone-faint h-2 w-2 rounded-full" />
      <span className="label text-bone-muted mx-auto text-[9px]">{url}</span>
    </div>
  );
}

/** The scene's pointer. Tween it by `[data-cursor]`; its origin is its centre. */
export function Pointer() {
  return (
    <span
      data-cursor
      className="border-ink bg-bone pointer-events-none absolute top-0 left-0 z-20 block h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-[0_2px_10px_rgba(0,0,0,0.6)]"
    />
  );
}

/** A click: the target dips and springs back. */
export function press(
  tl: gsap.core.Timeline,
  target: gsap.TweenTarget,
  at: number,
) {
  tl.to(target, { scale: 0.85, duration: 0.03, yoyo: true, repeat: 1 }, at);
}

/**
 * A number that counts while the timeline plays — and back down when scroll
 * reverses it, since the tween re-renders in both directions.
 */
export function count(
  tl: gsap.core.Timeline,
  el: Element | undefined,
  from: number,
  to: number,
  at: number,
  duration: number,
  format: (v: number) => string = (v) => String(Math.round(v)),
) {
  if (!el) return;
  const box = { v: from };
  tl.fromTo(
    box,
    { v: from },
    {
      v: to,
      duration,
      ease: "power1.inOut",
      onUpdate: () => {
        el.textContent = format(box.v);
      },
    },
    at,
  );
}

/**
 * Text typed out: reveal a single line left to right in `chars` steps, so it
 * reads as keystrokes rather than a wipe.
 */
export function type(
  tl: gsap.core.Timeline,
  target: gsap.TweenTarget,
  chars: number,
  at: number,
  duration: number,
) {
  tl.fromTo(
    target,
    { clipPath: "inset(0 100% 0 0)" },
    {
      clipPath: "inset(0 0% 0 0)",
      duration,
      ease: `steps(${Math.max(1, chars)})`,
    },
    at,
  );
}
