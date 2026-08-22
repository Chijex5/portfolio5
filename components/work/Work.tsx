import WorkRow from "@/components/work/WorkRow";
import WorkShowreel from "@/components/work/WorkShowreel";
import { projects } from "@/lib/projects";

/**
 * Selected work (plan §6, M5).
 *
 * A static, server-rendered list — this is the layout the WebGL carousel enhances
 * on top of, and the one that keeps working for reduced-motion, no-JS and no-WebGL
 * visitors. Content lives in lib/projects.ts.
 *
 * The showreel band goes above the list, not instead of it: the carousel is the
 * flourish, the numbered rows are the record.
 */
export default function Work() {
  const count = String(projects.length).padStart(2, "0");

  return (
    <section id="work" className="px-6 pt-24 md:px-10 md:pt-32">
      <header className="border-ink/10 flex items-baseline justify-between gap-4 border-b pb-6">
        <h2 className="text-ink-muted font-mono text-xs tracking-[0.2em] uppercase">
          02 &mdash; Selected work
        </h2>
        <p
          className="text-ink-muted font-mono text-xs tracking-[0.2em] uppercase"
          aria-label={`${projects.length} projects`}
        >
          ({count})
        </p>
      </header>

      <WorkShowreel projects={projects} />

      <ol>
        {projects.map((project, i) => (
          <WorkRow key={project.slug} project={project} flip={i % 2 === 1} />
        ))}
      </ol>
    </section>
  );
}
