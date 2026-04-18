'use client';

import { useState } from 'react';
import { RoastResult } from '@/lib/types';
import { Copy, Check, Save, Flame, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

type Intensity = 'mild' | 'medium' | 'nuclear';

interface CodeRoastViewProps {
  result: RoastResult | null;
  isLoading: boolean;
  intensity: Intensity;
  onIntensityChange: (intensity: Intensity) => void;
  onSave?: () => void;
}

const intensityConfig: Record<Intensity, { label: string; emoji: string; color: string; bgColor: string }> = {
  mild: {
    label: 'Mild',
    emoji: '😅',
    color: 'text-[var(--accent-secondary)]',
    bgColor: 'bg-[var(--accent-secondary)]/10 border-[var(--accent-secondary)]/30'
  },
  medium: {
    label: 'Medium',
    emoji: '🔥',
    color: 'text-[var(--accent-warning)]',
    bgColor: 'bg-[var(--accent-warning)]/10 border-[var(--accent-warning)]/30'
  },
  nuclear: {
    label: 'Nuclear',
    emoji: '☢️',
    color: 'text-[var(--accent-danger)]',
    bgColor: 'bg-[var(--accent-danger)]/10 border-[var(--accent-danger)]/30'
  },
};

export default function CodeRoastView({
  result,
  isLoading,
  intensity,
  onIntensityChange,
  onSave,
}: CodeRoastViewProps) {
  const [copiedRoast, setCopiedRoast] = useState(false);
  const [copiedFixed, setCopiedFixed] = useState(false);
  const [activeTab, setActiveTab] = useState<'roast' | 'fixed'>('roast');

  const handleCopy = async (text: string, type: 'roast' | 'fixed') => {
    await navigator.clipboard.writeText(text);
    if (type === 'roast') {
      setCopiedRoast(true);
      setTimeout(() => setCopiedRoast(false), 2000);
    } else {
      setCopiedFixed(true);
      setTimeout(() => setCopiedFixed(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Flame className="w-16 h-16 text-[var(--accent-danger)] animate-pulse" />
            <div className="absolute inset-0 bg-[var(--accent-danger)]/20 blur-xl rounded-full animate-pulse" />
          </div>
          <p className="text-[var(--text-secondary)] animate-pulse">Roasting your code...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 rounded-xl bg-[var(--accent-danger)]/10 flex items-center justify-center mb-6">
          <Flame className="w-8 h-8 text-[var(--accent-danger)]" />
        </div>
        <h3 className="font-display text-xl font-semibold text-[var(--text-primary)] mb-2">
          Ready to Roast
        </h3>
        <p className="text-[var(--text-secondary)] max-w-md mb-6 text-sm">
          Paste your code and select your roast intensity. Our AI senior engineer
          will give you brutally honest feedback with a fixed version.
        </p>

        {/* Intensity Selector */}
        <div className="flex items-center gap-2">
          {(Object.keys(intensityConfig) as Intensity[]).map((level) => (
            <button
              key={level}
              onClick={() => onIntensityChange(level)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${intensity === level
                  ? intensityConfig[level].bgColor + ' ' + intensityConfig[level].color
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/30'
                }`}
            >
              <span>{intensityConfig[level].emoji}</span>
              <span className="text-sm font-medium">{intensityConfig[level].label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const currentContent = activeTab === 'roast' ? result.roast : result.fixed;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Intensity Display */}
      <div className="flex items-center justify-between mb-6">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${intensityConfig[intensity].bgColor} ${intensityConfig[intensity].color}`}>
          <Flame className="w-4 h-4" />
          <span className="text-sm font-medium">
            {intensityConfig[intensity].emoji} {intensityConfig[intensity].label} Roast
          </span>
        </div>
        {onSave && (
          <button
            onClick={onSave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] text-sm font-medium hover:bg-[var(--accent-primary)]/30 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setActiveTab('roast')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'roast'
              ? 'bg-[var(--accent-danger)]/20 text-[var(--accent-danger)]'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
            }`}
        >
          <Flame className="w-4 h-4" />
          The Roast
        </button>
        <button
          onClick={() => setActiveTab('fixed')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'fixed'
              ? 'bg-[var(--accent-secondary)]/20 text-[var(--accent-secondary)]'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
            }`}
        >
          <Sparkles className="w-4 h-4" />
          Fixed Version
        </button>
      </div>

      {/* Content */}
      <div className={`bg-[var(--bg-card)] border rounded-xl overflow-hidden ${activeTab === 'roast' ? 'border-[var(--accent-danger)]/30' : 'border-[var(--accent-secondary)]/30'
        }`}>
        <div className={`px-4 py-3 border-b flex items-center justify-between ${activeTab === 'roast'
            ? 'bg-[var(--accent-danger)]/10 border-[var(--accent-danger)]/30'
            : 'bg-[var(--accent-secondary)]/10 border-[var(--accent-secondary)]/30'
          }`}>
          <h3 className={`font-display font-semibold ${activeTab === 'roast' ? 'text-[var(--accent-danger)]' : 'text-[var(--accent-secondary)]'
            }`}>
            {activeTab === 'roast' ? '🔥 The Roast' : '✨ Fixed Version'}
          </h3>
          <button
            onClick={() => handleCopy(currentContent, activeTab)}
            className={`p-2 rounded-lg transition-colors ${activeTab === 'roast' ? 'hover:bg-[var(--accent-danger)]/10' : 'hover:bg-[var(--accent-secondary)]/10'
              }`}
          >
            {(activeTab === 'roast' ? copiedRoast : copiedFixed) ? (
              <Check className={`w-4 h-4 ${activeTab === 'roast' ? 'text-[var(--accent-danger)]' : 'text-[var(--accent-secondary)]'}`} />
            ) : (
              <Copy className={`w-4 h-4 ${activeTab === 'roast' ? 'text-[var(--accent-danger)]/70' : 'text-[var(--accent-secondary)]/70'}`} />
            )}
          </button>
        </div>
        <div className="p-4">
          {activeTab === 'fixed' ? (
            <pre className="code-block p-4 rounded-lg overflow-x-auto">
              <code className="font-mono text-[13px] text-[var(--text-primary)]">{result.fixed}</code>
            </pre>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown
                components={{
                  code({ inline, children, ...props }: { inline?: boolean; children?: React.ReactNode }) {
                    return inline ? (
                      <code className="code-block px-1.5 py-0.5 rounded text-[var(--accent-danger)]" {...props}>
                        {children}
                      </code>
                    ) : (
                      <pre className="code-block p-4 rounded-lg overflow-x-auto my-3">
                        <code className="font-mono text-[13px] text-[var(--text-primary)]" {...props}>
                          {children}
                        </code>
                      </pre>
                    );
                  },
                }}
              >
                {result.roast}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
