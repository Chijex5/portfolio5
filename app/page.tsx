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
 */
export default function Home() {
  return (
    <main id="main">
      <ScrollProgress />
      <Hero />
      <StackStrip />
      <Work />
      <KineticStatement />
      <About />
    </main>
  );
}
