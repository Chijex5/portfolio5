import Reveal from "@/components/shared/Reveal";
import SplitReveal from "@/components/shared/SplitReveal";

/** Where I am now, and where the background comes from. */
const FACTS = [
  { term: "Currently", detail: "EY Nigeria — Transfer pricing" },
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
              02 &mdash; About
            </h2>
            <p className="text-ink/30 mt-3 font-mono text-xs tracking-[0.2em] lowercase">
              (who)
            </p>
          </div>
        </div>

        <div className="md:col-span-8">
          <SplitReveal
            as="p"
            className="font-display text-[clamp(1.625rem,3.4vw,2.75rem)] leading-[1.12] tracking-[-0.01em]"
          >
            I like owning the whole picture — schema, API, and the interface on
            top.
          </SplitReveal>

          <div className="mt-12 grid gap-8 md:grid-cols-2 md:gap-10">
            <Reveal>
              <p className="text-ink-muted text-base leading-relaxed text-pretty md:text-lg">
                My work usually starts as a problem I actually have — a messy
                job hunt, a wedding site with a deadline, screens I forgot to
                design. I build the thing, then sand the edges until it&rsquo;s
                something I&rsquo;d hand a friend without a disclaimer.
              </p>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="text-ink-muted text-base leading-relaxed text-pretty md:text-lg">
                On the front I reach for React, Next.js, React Native and
                TypeScript; behind it, Python and FastAPI over PostgreSQL and
                MongoDB. I care about performance, honest copy, and interfaces
                that get out of the way.
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
        </div>
      </div>
    </section>
  );
}
