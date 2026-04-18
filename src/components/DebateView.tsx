'use client';

import { useState } from 'react';
import { DebateResult } from '@/lib/types';
import { Copy, Check, Save, CheckCircle, XCircle, Scale } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface DebateViewProps {
  result: DebateResult | null;
  isLoading: boolean;
  onSave?: () => void;
}

export default function DebateView({ result, isLoading, onSave }: DebateViewProps) {
  const [copiedFor, setCopiedFor] = useState(false);
  const [copiedAgainst, setCopiedAgainst] = useState(false);
  const [copiedVerdict, setCopiedVerdict] = useState(false);

  const handleCopy = async (text: string, type: 'for' | 'against' | 'verdict') => {
    await navigator.clipboard.writeText(text);
    if (type === 'for') {
      setCopiedFor(true);
      setTimeout(() => setCopiedFor(false), 2000);
    } else if (type === 'against') {
      setCopiedAgainst(true);
      setTimeout(() => setCopiedAgainst(false), 2000);
    } else {
      setCopiedVerdict(true);
      setTimeout(() => setCopiedVerdict(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-4 border-[var(--accent-secondary)]/20 border-t-[var(--accent-secondary)] rounded-full animate-spin" />
            <div className="w-10 h-10 border-4 border-[var(--accent-danger)]/20 border-t-[var(--accent-danger)] rounded-full animate-spin [animation-delay:0.1s]" />
            <div className="w-10 h-10 border-4 border-[var(--accent-primary)]/20 border-t-[var(--accent-primary)] rounded-full animate-spin [animation-delay:0.2s]" />
          </div>
          <p className="text-[var(--text-secondary)] animate-pulse">Generating debate arguments...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center mb-6">
          <Scale className="w-8 h-8 text-[var(--accent-primary)]" />
        </div>
        <h3 className="font-display text-xl font-semibold text-[var(--text-primary)] mb-2">
          Ready to Debate
        </h3>
        <p className="text-[var(--text-secondary)] max-w-md mb-6">
          Enter a tech topic and our AI will argue both sides with a final verdict.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {['REST vs GraphQL', 'Tabs vs Spaces', 'Microservices vs Monolith'].map((topic) => (
            <button
              key={topic}
              className="px-3 py-1.5 rounded-full bg-[var(--bg-elevated)] text-[var(--text-secondary)] text-sm hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)] transition-colors border border-[var(--border)]"
            >
              {topic}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Split View - FOR vs AGAINST */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* FOR Panel */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="bg-[rgba(0,255,136,0.08)] px-4 py-3 border-b-2 border-[var(--accent-secondary)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[var(--accent-secondary)]" />
              <h3 className="font-display font-semibold text-[var(--accent-secondary)]">FOR</h3>
            </div>
            <button
              onClick={() => handleCopy(result.for, 'for')}
              className="p-1.5 rounded-md hover:bg-[var(--bg-elevated)] transition-colors"
            >
              {copiedFor ? (
                <Check className="w-4 h-4 text-[var(--accent-secondary)]" />
              ) : (
                <Copy className="w-4 h-4 text-[var(--accent-secondary)]/70" />
              )}
            </button>
          </div>
          <div className="p-4 prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown
              components={{
                code({ inline, children, ...props }: { inline?: boolean; children?: React.ReactNode }) {
                  return inline ? (
                    <code className="code-block px-1.5 py-0.5 rounded text-[var(--accent-secondary)]" {...props}>
                      {children}
                    </code>
                  ) : (
                    <pre className="code-block p-3 rounded-lg overflow-x-auto my-3">
                      <code className="font-mono text-[13px] text-[var(--text-primary)]" {...props}>
                        {children}
                      </code>
                    </pre>
                  );
                },
              }}
            >
              {result.for}
            </ReactMarkdown>
          </div>
        </div>

        {/* AGAINST Panel */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="bg-[rgba(255,68,68,0.08)] px-4 py-3 border-b-2 border-[var(--accent-danger)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-[var(--accent-danger)]" />
              <h3 className="font-display font-semibold text-[var(--accent-danger)]">AGAINST</h3>
            </div>
            <button
              onClick={() => handleCopy(result.against, 'against')}
              className="p-1.5 rounded-md hover:bg-[var(--bg-elevated)] transition-colors"
            >
              {copiedAgainst ? (
                <Check className="w-4 h-4 text-[var(--accent-danger)]" />
              ) : (
                <Copy className="w-4 h-4 text-[var(--accent-danger)]/70" />
              )}
            </button>
          </div>
          <div className="p-4 prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown
              components={{
                code({ inline, children, ...props }: { inline?: boolean; children?: React.ReactNode }) {
                  return inline ? (
                    <code className="code-block px-1.5 py-0.5 rounded text-[var(--accent-danger)]" {...props}>
                      {children}
                    </code>
                  ) : (
                    <pre className="code-block p-3 rounded-lg overflow-x-auto my-3">
                      <code className="font-mono text-[13px] text-[var(--text-primary)]" {...props}>
                        {children}
                      </code>
                    </pre>
                  );
                },
              }}
            >
              {result.against}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      {/* Verdict Panel */}
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-strong)] border-t-[3px] border-t-[var(--accent-primary)] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-[var(--accent-primary)]" />
            <h3 className="font-display font-semibold text-[var(--text-primary)]">FINAL VERDICT</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(result.verdict, 'verdict')}
              className="p-1.5 rounded-md hover:bg-[var(--bg-card)] transition-colors"
            >
              {copiedVerdict ? (
                <Check className="w-4 h-4 text-[var(--accent-primary)]" />
              ) : (
                <Copy className="w-4 h-4 text-[var(--text-secondary)]" />
              )}
            </button>
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
        </div>
        <div className="p-4 prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown
            components={{
              code({ inline, children, ...props }: { inline?: boolean; children?: React.ReactNode }) {
                return inline ? (
                  <code className="code-block px-1.5 py-0.5 rounded text-[var(--accent-primary)]" {...props}>
                    {children}
                  </code>
                ) : (
                  <pre className="code-block p-3 rounded-lg overflow-x-auto my-3">
                    <code className="font-mono text-[13px] text-[var(--text-primary)]" {...props}>
                      {children}
                    </code>
                  </pre>
                );
              },
            }}
          >
            {result.verdict}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
