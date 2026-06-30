interface FoundWordsProps {
  foundWords: readonly string[];
}

export function FoundWords({ foundWords }: FoundWordsProps) {
  return (
    <section className="rounded-lg border border-border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-black text-primary-text">Found Words</h2>
        <span className="text-sm font-bold text-secondary-text">
          {foundWords.length}
        </span>
      </div>
      {foundWords.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-border bg-background p-4 text-sm text-secondary-text">
          Your words will collect here.
        </p>
      ) : (
        <ul className="mt-4 grid max-h-72 gap-2 overflow-auto pr-1 sm:grid-cols-2">
          {foundWords.map((word) => (
            <li
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-primary-text"
              key={word}
            >
              {word}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
