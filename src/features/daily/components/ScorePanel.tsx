import type { ScoreSummary } from "../../../game";

interface ScorePanelProps {
  scoreSummary: ScoreSummary;
}

export function ScorePanel({ scoreSummary }: ScorePanelProps) {
  return (
    <aside className="rounded-lg border border-border bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black text-primary-text">Session</h2>
      <dl className="mt-4 grid gap-3">
        <Stat label="Score" value={String(scoreSummary.score)} />
        <Stat label="Rank" value={scoreSummary.rank.name} />
        <Stat label="Words" value={String(scoreSummary.foundCount)} />
      </dl>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-background">
        <div
          className="h-full rounded-full bg-success transition-all"
          style={{ width: `${String(getRankProgress(scoreSummary.score))}%` }}
        />
      </div>
      <p className="mt-4 text-sm leading-6 text-secondary-text">
        Build words from the seven letters. Every accepted English word adds to
        your open-ended score.
      </p>
    </aside>
  );
}

interface StatProps {
  label: string;
  value: string;
}

function Stat({ label, value }: StatProps) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-3">
      <dt className="text-secondary-text">{label}</dt>
      <dd className="text-right font-black text-primary-text">{value}</dd>
    </div>
  );
}

function getRankProgress(score: number): number {
  return Math.min(100, Math.max(8, Math.round((score / 140) * 100)));
}
