import About from "@/components/about/About";
import Capabilities from "@/components/capabilities/Capabilities";
import Hero from "@/components/hero/Hero";
import ScrollProgress from "@/components/shared/ScrollProgress";
import KineticStatement from "@/components/type/KineticStatement";
import Work from "@/components/work/Work";
import Writing from "@/components/writing/Writing";

/**
 * The one page. Order is deliberate: the hero states the claim, Capabilities
 * answers "with what", the work proves it, the kinetic statement says how it
 * happens, the writing shows the thinking, About says who. Contact is the footer,
 * which owns the #contact anchor.
 *
 * Section numbering (01–04) is editorial and lives in each component's own
 * header, so it has to be kept in step with this order by hand — Capabilities 01,
 * Work 02, Writing 03, About 04. KineticStatement is deliberately unnumbered: it
 * is an interstitial, not a section you would link someone to.
 *
 * `data-elastic` is the site-wide liquid layer (ElasticProvider): each band shears
 * and lags by its own share of the shared scroll velocity. The numbers are chosen
 * to disagree — a uniform value would read as the whole page tilting, which looks
 * like a rendering fault. Bands deforming by *different* amounts is what reads as
 * depth, so the multipliers below are the composition, not a config:
 *
 *   hero 0.45        barely — it already has its own parallax planes, and the
 *                    headline is the one thing that must never look distorted
 *                    before it has been read.
 *   capabilities 1.2 large type in short rows takes shear well, and the drawn
 *                    rules between groups make the lag legible.
 *   work 0.9         enough to feel; the carousel inside is already liquid, and
 *                    doubling up would fight it.
 *   statement 1.3    large type takes shear well.
 *   writing 0.75     restrained: the row list is dense, and shearing a stack of
 *                    thin rules turns into moiré rather than depth.
 *   about 0.55       restrained: it carries the longest prose on the page, and it
 *                    is the one band with a sticky column inside it.
 */
export default function Home() {
  return (
    <main id="main">
      <ScrollProgress />

      <div data-elastic="0.45">
        <Hero />
      </div>
      <div data-elastic="1.2">
        <Capabilities />
      </div>
      <div data-elastic="0.9">
        <Work />
      </div>
      <div data-elastic="1.3">
        <KineticStatement />
      </div>
      <div data-elastic="0.75">
        <Writing />
      </div>
      <div data-elastic="0.55">
        <About />
      </div>
    </main>
  );
}
