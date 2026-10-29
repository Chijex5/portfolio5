import { SOCIAL_LINKS } from "@/lib/nav";
import type { Activity as Data } from "@/lib/github";

const SHADES = [
  "bg-ink-faint opacity-60",
  "bg-jollof/30",
  "bg-jollof/55",
  "bg-jollof/80",
  "bg-jollof",
] as const;

const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");

/**
 * A year of commits as a grid of squares — one column per week, Sunday at the
 * top — inked in jollof by how busy the day was.
 */
export default function Activity({ data }: { data: Data }) {
  // Pad the first week so every column starts on a Sunday.
  const lead = new Date(`${data.days[0].date}T00:00:00Z`).getUTCDay();
  const cells: (Data["days"][number] | null)[] = [
    ...Array<null>(lead).fill(null),
    ...data.days,
  ];
  const weeks: (typeof cells)[] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  // A month label over the first week that starts in it — except a partial
  // month at the very start, whose label would collide with the next one.
  const labels = weeks.map((w, i) => {
    const first = w.find(Boolean);
    if (!first) return "";
    const m = Number(first.date.slice(5, 7)) - 1;
    const prev = weeks[i - 1]?.find(Boolean);
    if (prev && Number(prev.date.slice(5, 7)) - 1 === m) return "";
    const next = weeks[i + 2]?.find(Boolean);
    if (i === 0 && next && Number(next.date.slice(5, 7)) - 1 !== m) return "";
    return MONTHS[m];
  });
  const github = SOCIAL_LINKS.find((l) => l.label === "GitHub");

  return (
    <figure>
      <figcaption className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
        <span className="label text-ink-muted">GitHub activity</span>
        <span className="text-[1.05rem] tracking-[-0.01em]">
          <span className="font-semibold tabular-nums">
            {data.total.toLocaleString("en")}
          </span>{" "}
          contributions in the last year
        </span>
      </figcaption>
      {/* Fills the width on desktop; scrolls sideways on a phone rather than
          shrinking the squares to specks. */}
      <div className="overflow-x-auto pb-2">
        <div
          role="img"
          aria-label={`${data.total} GitHub contributions in the last year`}
          className="grid max-w-[1000px] min-w-[720px] grid-flow-col gap-[3px]"
          style={{
            gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))`,
            gridTemplateRows: "auto repeat(7, auto)",
          }}
        >
          {weeks.map((w, i) => (
            <div key={i} className="contents">
              <span className="label text-ink-muted h-6 overflow-visible text-[9px] whitespace-nowrap">
                {labels[i]}
              </span>
              {Array.from({ length: 7 }, (_, d) => {
                const day = w[d];
                return (
                  <span
                    key={d}
                    title={day ? `${day.count} on ${day.date}` : undefined}
                    className={`aspect-square rounded-[2px] ${day ? SHADES[day.level] : ""}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {github && (
        <a
          href={github.href}
          target="_blank"
          rel="noreferrer noopener"
          className="label text-ink-muted hover:text-jollof mt-4 inline-block transition-colors"
        >
          github.com/chijex5 ↗
        </a>
      )}
    </figure>
  );
}
