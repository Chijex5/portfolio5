import Reveal from "@/components/shared/Reveal";
import SplitReveal from "@/components/shared/SplitReveal";

/** Where I am now, and where the background comes from. */
const FACTS = [
  { term: "Currently", detail: "Optiplex — Full-Stack Developer" },
  {
    term: "Studying",
    detail: "Statistics — University of Nigeria, Nsukka",
  },
] as const;

/**
 * About: sticky label column beside the copy (plan §6, M4).
 *
 * The label sticks while the body scrolls past it, which is what makes the split
 * feel intentional rather than like a two-column paragraph. Sticky is CSS-only —
 * no ScrollTrigger pin, so nothing to keep in sync with Lenis.
 */
export default function About() {
  return (
    <section id="about" className="px-6 py-24 md:px-10 md:py-32">
      <div className="grid gap-10 md:grid-cols-12 md:gap-14">
        <div className="md:col-span-4">
          <div className="md:sticky md:top-32">
            <h2 className="text-ink-muted font-mono text-xs tracking-[0.2em] uppercase">
              04 &mdash; About
            </h2>
            <p className="text-ink/30 mt-3 font-mono text-xs tracking-[0.2em] lowercase">
              (who)
            </p>
          </div>
        </div>

        <div className="md:col-span-8">
          <SplitReveal
            as="p"
            // Thin and text-like when it enters, display-weight by the time it
            // leaves — the default start/end span this block's whole pass through
            // the viewport, so the morph *is* the scroll transition.
            kinetic={{
              wght: [300, 640],
              opsz: [24, 144],
              soft: [0, 80],
              tracking: [-0.01, -0.04],
            }}
            className="font-display text-[clamp(1.625rem,3.4vw,2.75rem)] leading-[1.12] tracking-[-0.01em]"
          >
            I like understanding the entire system.
          </SplitReveal>

          {/* The qualifier, set as three beats rather than a sentence — the way it
              is written is the point. */}
          <Reveal delay={0.08}>
            <p className="text-ink-muted mt-6 max-w-lg text-lg leading-relaxed text-pretty md:text-xl">
              Not just the interface. Not just the API. The whole thing.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-8 md:grid-cols-2 md:gap-10">
            <Reveal>
              <p className="text-ink-muted text-base leading-relaxed text-pretty md:text-lg">
                Most of my projects begin with a problem I&rsquo;ve personally
                run into. A frustrating job search. A missing workflow. A
                process that feels more complicated than it should be.
              </p>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="text-ink-muted text-base leading-relaxed text-pretty md:text-lg">
                I build a version that solves the problem, use it myself, then
                keep refining it until it feels finished. On the frontend I
                mostly reach for React, Next.js, React Native and TypeScript; on
                the backend it&rsquo;s usually Python, FastAPI, PostgreSQL and
                MongoDB.
              </p>
            </Reveal>
          </div>

          <Reveal delay={0.1}>
            <dl className="border-ink/10 mt-16 grid gap-8 border-t pt-8 sm:grid-cols-2">
              {FACTS.map((fact) => (
                <div key={fact.term}>
                  <dt className="text-ink-muted font-mono text-[0.6875rem] tracking-[0.2em] uppercase">
                    {fact.term}
                  </dt>
                  <dd className="mt-3 text-base text-pretty md:text-lg">
                    {fact.detail}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal delay={0.14}>
            <p className="text-ink-muted mt-10 max-w-xl text-base leading-relaxed text-pretty md:text-lg">
              The statistics side probably explains why I enjoy building systems
              that collect data almost as much as the systems themselves.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
