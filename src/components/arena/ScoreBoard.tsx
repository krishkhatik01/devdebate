'use client';

import { useEffect, useState } from 'react';
import { Trophy, CheckCircle, XCircle } from 'lucide-react';

interface ScoreBoardProps {
  forScore: number;
  againstScore: number;
  forName: string;
  againstName: string;
  isAnimating?: boolean;
}

export default function ScoreBoard({
  forScore,
  againstScore,
  forName,
  againstName,
  isAnimating = false,
}: ScoreBoardProps) {
  const [displayForScore, setDisplayForScore] = useState(0);
  const [displayAgainstScore, setDisplayAgainstScore] = useState(0);

  useEffect(() => {
    if (isAnimating) {
      const duration = 1500;
      const steps = 30;
      const interval = duration / steps;
      let step = 0;

      const timer = setInterval(() => {
        step++;
        const progress = step / steps;
        setDisplayForScore(Math.round(forScore * progress));
        setDisplayAgainstScore(Math.round(againstScore * progress));

        if (step >= steps) {
          clearInterval(timer);
          setDisplayForScore(forScore);
          setDisplayAgainstScore(againstScore);
        }
      }, interval);

      return () => clearInterval(timer);
    } else {
      setDisplayForScore(forScore);
      setDisplayAgainstScore(againstScore);
    }
  }, [forScore, againstScore, isAnimating]);

  const winner = forScore > againstScore ? 'for' : againstScore > forScore ? 'against' : 'draw';

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--accent-secondary)]/20 mb-2">
            <CheckCircle className="w-6 h-6 text-[var(--accent-secondary)]" />
          </div>
          <h3 className="font-display font-semibold text-[var(--accent-secondary)]">FOR</h3>
          <p className="text-[var(--text-secondary)] text-sm truncate max-w-[120px] mx-auto">{forName}</p>
        </div>

        <div className="px-6">
          <div className="flex items-center gap-4">
            <span className="text-4xl font-display font-bold text-[var(--accent-secondary)]">
              {displayForScore}
            </span>
            <span className="text-2xl text-[var(--text-muted)]">:</span>
            <span className="text-4xl font-display font-bold text-[var(--accent-danger)]">
              {displayAgainstScore}
            </span>
          </div>
          {winner !== 'draw' && (
            <div className="flex justify-center mt-2">
              <Trophy
                className={`w-6 h-6 ${winner === 'for' ? 'text-[var(--accent-secondary)]' : 'text-[var(--accent-danger)]'
                  }`}
              />
            </div>
          )}
        </div>

        <div className="flex-1 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--accent-danger)]/20 mb-2">
            <XCircle className="w-6 h-6 text-[var(--accent-danger)]" />
          </div>
          <h3 className="font-display font-semibold text-[var(--accent-danger)]">AGAINST</h3>
          <p className="text-[var(--text-secondary)] text-sm truncate max-w-[120px] mx-auto">{againstName}</p>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1">
            <span>FOR</span>
            <span>{forScore}/10</span>
          </div>
          <div className="h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent-secondary)] rounded-full transition-all duration-1000"
              style={{ width: `${(forScore / 10) * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1">
            <span>AGAINST</span>
            <span>{againstScore}/10</span>
          </div>
          <div className="h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent-danger)] rounded-full transition-all duration-1000"
              style={{ width: `${(againstScore / 10) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
