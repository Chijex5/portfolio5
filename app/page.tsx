import About from "@/components/about/About";
import Hero from "@/components/hero/Hero";
import ScrollProgress from "@/components/shared/ScrollProgress";
import StackStrip from "@/components/shared/StackStrip";
import KineticStatement from "@/components/type/KineticStatement";
import Work from "@/components/work/Work";

/**
 * The one page. Order is deliberate: the hero states the claim, the stack strip
 * answers "with what", the work proves it, the kinetic statement says how it
 * happens, About says who. Contact is the footer, which owns the #contact anchor.
 *
 * `data-elastic` is the site-wide liquid layer (ElasticProvider): each band shears
 * and lags by its own share of the shared scroll velocity. The numbers are chosen
 * to disagree — a uniform value would read as the whole page tilting, which looks
 * like a rendering fault. Bands deforming by *different* amounts is what reads as
 * depth, so the multipliers below are the composition, not a config:
 *
 *   hero 0.45      barely — it already has its own parallax planes, and the
 *                  headline is the one thing that must never look distorted
 *                  before it has been read.
 *   strip 1.7      the most, because it is a thin horizontal rule: shear is
 *                  legible on it at a glance and it has no body copy to bend.
 *   work 0.9       enough to feel; the carousel inside is already liquid, and
 *                  doubling up would fight it.
 *   statement 1.3  large type takes shear well.
 *   about 0.55     restrained: it carries the longest prose on the page, and it
 *                  is the one band with a sticky column inside it.
 */
export default function Home() {
  return (
    <main id="main">
      <ScrollProgress />

      <div data-elastic="0.45">
        <Hero />
      </div>
      <div data-elastic="1.7">
        <StackStrip />
      </div>
      <div data-elastic="0.9">
        <Work />
      </div>
      <div data-elastic="1.3">
        <KineticStatement />
      </div>
      <div data-elastic="0.55">
        <About />
      </div>
    </main>
  );
}
