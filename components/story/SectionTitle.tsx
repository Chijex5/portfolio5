/**
 * A section's name, set huge, with two outlined echoes stacked behind it that
 * fan out downward as the section scrolls in (driven by `[data-echo]` in
 * Story.tsx). The eyebrow above it carries the running index.
 */
export default function SectionTitle({
  word,
  index,
  label,
  id,
}: {
  word: string;
  index?: string;
  label?: string;
  /** For `aria-labelledby` on the section. */
  id?: string;
}) {
  return (
    <div data-title className="relative pb-[0.5em]">
      {index && (
        <p data-fade className="label mb-5 flex items-center md:mb-7">
          <span className="text-accent">({index})</span>
          {label && (
            <>
              <span className="bg-ink-faint mx-3 h-px w-8" />
              <span className="text-ink-muted">{label}</span>
            </>
          )}
        </p>
      )}
      <div className="relative text-[clamp(4.5rem,15vw,15rem)]">
        {[2, 1].map((k) => (
          <span
            key={k}
            data-echo={k}
            aria-hidden="true"
            className="display outline-text absolute inset-x-0 top-0 block select-none"
          >
            {word}
          </span>
        ))}
        <h2 id={id} data-chars className="display relative block">
          {word}
        </h2>
      </div>
    </div>
  );
}
