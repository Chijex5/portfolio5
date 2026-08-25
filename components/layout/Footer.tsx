import Link from "next/link";
import BackToTop from "@/components/shared/BackToTop";
import MagneticButton from "@/components/shared/MagneticButton";
import Reveal from "@/components/shared/Reveal";
import SmoothLink from "@/components/shared/SmoothLink";
import SplitReveal from "@/components/shared/SplitReveal";
import { CONTACT, NAV_LINKS, SOCIAL_LINKS } from "@/lib/nav";

/**
 * Contact footer — the "#contact" target for the primary nav.
 *
 * Leads with the ask instead of a marquee: the marquee technique now lives in the
 * stack strip under the hero, and two of them on one page dilutes both.
 *
 * Stays a server component; the client behaviour is inside MagneticButton,
 * SplitReveal, SmoothLink and BackToTop.
 */
export default function Footer() {
  // Baked at build time. Fine for a statically generated site.
  const year = new Date().getFullYear();

  return (
    <footer
      // The last elastic band (see app/page.tsx for the composition). Moderate:
      // the footer is where the page comes to rest, so it should settle, not whip.
      data-elastic="0.8"
      id="contact"
      className="border-ink/10 border-t px-6 pt-24 pb-10 md:px-10 md:pt-32"
    >
      <div className="grid gap-14 md:grid-cols-12 md:gap-14">
        {/* The ask */}
        <div className="md:col-span-7">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-ink-muted font-mono text-xs tracking-[0.2em] uppercase">
              05 &mdash; Contact
            </h2>
            <p className="text-ink/30 font-mono text-xs tracking-[0.2em] lowercase md:hidden">
              (let&rsquo;s talk)
            </p>
          </div>

          <Reveal>
            <p className="text-ink-muted mt-8 max-w-md text-base leading-relaxed text-pretty md:text-lg">
              Most of my best projects started with a sentence like:
            </p>
          </Reveal>

          {/* The two openers are the headline. They are the memorable part of the
              section, and quoting them at display size says more about how I like
              to work than a rhetorical question would. */}
          <SplitReveal
            as="p"
            className="font-display mt-6 text-[clamp(1.75rem,4.6vw,3.5rem)] leading-[1.06] tracking-[-0.02em]"
          >
            <span className="block">&ldquo;Quick question&hellip;&rdquo;</span>
            <span className="text-ink-muted block text-[0.5em]">or</span>
            <span className="block">
              &ldquo;This might be a{" "}
              <em className="text-signal not-italic">stupid idea</em>,
              but&hellip;&rdquo;
            </span>
          </SplitReveal>

          <Reveal delay={0.1}>
            <p className="text-ink-muted mt-8 max-w-lg text-base leading-relaxed text-pretty md:text-lg">
              Turns out those are usually the fun ones. If you&rsquo;re building
              something interesting, stuck on something annoying, or just want
              to talk through an idea before it becomes a real project, send me
              a message.
            </p>
          </Reveal>

          <MagneticButton className="mt-10">
            <a
              href={`mailto:${CONTACT.email}`}
              className="bg-ink text-paper hover:bg-signal group inline-flex items-center gap-3 rounded-full px-6 py-3.5 text-base transition-colors duration-300 md:px-7 md:py-4 md:text-lg"
            >
              {CONTACT.email}
              <span
                aria-hidden="true"
                className="inline-block transition-transform duration-300 group-hover:translate-x-1"
              >
                &#8594;
              </span>
            </a>
          </MagneticButton>

          <Reveal delay={0.06}>
            <p className="text-ink-muted mt-8 text-base text-pretty md:text-lg">
              Let&rsquo;s see where the conversation goes.
            </p>
          </Reveal>

          {CONTACT.available ? (
            <p className="text-ink-muted mt-6 flex items-center gap-2 font-mono text-xs tracking-[0.16em] uppercase">
              <span
                className="status-dot bg-signal size-1.5 rounded-full"
                aria-hidden="true"
              />
              Available for work
            </p>
          ) : null}
        </div>

        {/* Link columns */}
        <nav
          aria-label="Footer"
          className="grid grid-cols-2 gap-8 md:col-span-5 md:justify-items-end"
        >
          <div>
            <h3 className="text-ink-muted font-mono text-[0.6875rem] tracking-[0.2em] uppercase">
              Navigate
            </h3>
            <ul className="mt-5 space-y-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <SmoothLink
                    href={link.href}
                    className="hover:text-signal text-lg transition-colors duration-200"
                  >
                    {link.label}
                  </SmoothLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-ink-muted font-mono text-[0.6875rem] tracking-[0.2em] uppercase">
              Elsewhere
            </h3>
            <ul className="mt-5 space-y-2">
              {SOCIAL_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="hover:text-signal group inline-flex items-center gap-1.5 text-lg transition-colors duration-200"
                  >
                    {link.label}
                    <span
                      aria-hidden="true"
                      className="text-ink-muted inline-block text-xs transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    >
                      &#8599;
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>

      {/* Meta row */}
      <div className="text-ink-muted border-ink/10 mt-20 flex flex-col gap-4 border-t pt-8 font-mono text-xs tracking-[0.16em] uppercase sm:flex-row sm:items-center sm:justify-between">
        <p>
          &copy; {year} {CONTACT.name}
        </p>
        <p>{CONTACT.location} &mdash; Remote</p>
        <BackToTop className="hover:text-signal flex items-center gap-2 uppercase transition-colors duration-200" />
      </div>
    </footer>
  );
}
