'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface RoundTimerProps {
  duration: number;
  isActive: boolean;
  onTimeUp: () => void;
}

export default function RoundTimer({ duration, isActive, onTimeUp }: RoundTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const progress = (timeLeft / duration) * 100;

  let timerColor = 'text-[var(--accent-secondary)]';
  let barColor = 'bg-[var(--accent-secondary)]';

  if (timeLeft <= 10) {
    timerColor = 'text-[var(--accent-danger)] animate-pulse';
    barColor = 'bg-[var(--accent-danger)]';
  } else if (timeLeft <= 30) {
    timerColor = 'text-[var(--accent-warning)]';
    barColor = 'bg-[var(--accent-warning)]';
  }

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
          <Clock size={18} />
          <span className="text-sm font-medium">Time Remaining</span>
        </div>
        <div className={`text-3xl font-display font-bold ${timerColor}`}>
          {formattedTime}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-1000`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
