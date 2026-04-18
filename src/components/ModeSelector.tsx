'use client';

import { MODES, ModeType } from '@/lib/types';
import {
  MessageSquare,
  Swords,
  Flame,
  Brain,
  Search,
  Zap,
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  MessageSquare,
  Swords,
  Flame,
  Brain,
  Search,
  Zap,
};

const colorMap: Record<string, string> = {
  cyan: 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/30',
  purple: 'bg-accent-purple/10 text-accent-purple border-accent-purple/30',
  red: 'bg-accent-red/10 text-accent-red border-accent-red/30',
  green: 'bg-accent-green/10 text-accent-green border-accent-green/30',
  amber: 'bg-accent-amber/10 text-accent-amber border-accent-amber/30',
};

interface ModeSelectorProps {
  currentMode: ModeType;
  onModeChange: (mode: ModeType) => void;
}

export default function ModeSelector({ currentMode, onModeChange }: ModeSelectorProps) {
  const currentModeConfig = MODES.find((m) => m.id === currentMode);

  return (
    <div className="flex items-center gap-2">
      <div className="relative group">
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg glass border border-border hover:border-accent-cyan/30 transition-colors">
          {currentModeConfig && (
            <>
              {(() => {
                const Icon = iconMap[currentModeConfig.icon];
                return <Icon className="w-4 h-4" />;
              })()}
              <span className="text-sm font-medium text-text-primary">
                {currentModeConfig.label}
              </span>
            </>
          )}
        </button>

        {/* Dropdown */}
        <div className="absolute top-full left-0 mt-2 w-64 glass rounded-xl border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
          <div className="p-2 space-y-1">
            {MODES.map((mode) => {
              const Icon = iconMap[mode.icon];
              const isActive = currentMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => onModeChange(mode.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${isActive
                      ? colorMap[mode.color]
                      : 'hover:bg-bg-elevated text-text-secondary hover:text-text-primary'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{mode.label}</p>
                    <p className="text-xs opacity-70">{mode.description}</p>
                  </div>
                  {mode.id === 'debate' && (
                    <span className="text-xs bg-accent-purple/20 text-accent-purple px-2 py-0.5 rounded-full">
                      Featured
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
