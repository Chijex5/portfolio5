import Marquee from "@/components/shared/Marquee";
import { STACK } from "@/lib/nav";

/** Two passes of the stack per track: enough to fill a wide viewport. */
const PASSES = 2;

/**
 * Full-bleed capability strip between the hero and the work.
 *
 * Server component — the scroll it does is a CSS animation, and the plan's
 * velocity-reactive version arrives with the shared velocity store in M7.
 */
export default function StackStrip() {
  return (
    <section
      aria-label="Stack"
      className="border-ink/10 bg-ink/[0.02] border-y py-5"
    >
      <Marquee speed={38}>
        {Array.from({ length: PASSES }, (_, pass) =>
          STACK.map((item) => (
            <span key={`${pass}-${item}`} className="flex items-center">
              <span className="text-ink-muted px-6 font-mono text-xs tracking-[0.2em] whitespace-nowrap uppercase">
                {item}
              </span>
              <span
                aria-hidden="true"
                className="bg-signal/50 size-1 shrink-0 rounded-full"
              />
            </span>
          )),
        )}
      </Marquee>
    </section>
  );
}
