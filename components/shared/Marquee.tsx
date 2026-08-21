import { cn } from "@/lib/utils";

type MarqueeProps = {
  children: React.ReactNode;
  /** Seconds for one full loop. Higher = slower. */
  speed?: number;
  reverse?: boolean;
  className?: string;
};

/**
 * Seamless CSS marquee — no JS, so this stays a server component.
 *
 * The track holds two identical copies of `children` and slides by exactly -50%,
 * which lands the second copy where the first started. The duplicate is
 * aria-hidden so screen readers and search engines see the text once.
 *
 * Motion lives in `.marquee-track` (globals.css), which also stops the animation
 * under prefers-reduced-motion.
 *
 * TODO(M7): optional velocity-reactive speed once velocityStore exists.
 */
export default function Marquee({
  children,
  speed = 28,
  reverse = false,
  className,
}: MarqueeProps) {
  return (
    <div className={cn("overflow-hidden", className)}>
      <div
        className="marquee-track flex w-max"
        style={
          {
            "--marquee-duration": `${speed}s`,
            animationDirection: reverse ? "reverse" : "normal",
          } as React.CSSProperties
        }
      >
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
