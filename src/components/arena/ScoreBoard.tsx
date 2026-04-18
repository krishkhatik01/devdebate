"use client";

interface ScoreBoardProps {
  forScore: number;
  againstScore: number;
  forName?: string;
  againstName?: string;
}

export default function ScoreBoard({
  forScore,
  againstScore,
  forName = "FOR",
  againstName = "AGAINST"
}: ScoreBoardProps) {
  const total = forScore + againstScore;
  const forPercent = total > 0 ? (forScore / total) * 100 : 50;
  const againstPercent = total > 0 ? (againstScore / total) * 100 : 50;

  return (
    <div className="mb-8 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-green-400">{forName}</span>
        <span className="text-xs text-[var(--text-muted)]">Score Distribution</span>
        <span className="text-sm font-medium text-red-400">{againstName}</span>
      </div>

      {/* Progress Bar */}
      <div className="h-4 rounded-full overflow-hidden bg-[var(--bg-elevated)] flex">
        <div
          className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-1000"
          style={{ width: `${forPercent}%` }}
        />
        <div
          className="h-full bg-gradient-to-l from-red-500 to-red-400 transition-all duration-1000"
          style={{ width: `${againstPercent}%` }}
        />
      </div>

      {/* Scores */}
      <div className="flex items-center justify-between mt-3">
        <span className="text-2xl font-bold text-green-400">{forScore}</span>
        <span className="text-xs text-[var(--text-muted)]">Total Points</span>
        <span className="text-2xl font-bold text-red-400">{againstScore}</span>
      </div>
    </div>
  );
}
