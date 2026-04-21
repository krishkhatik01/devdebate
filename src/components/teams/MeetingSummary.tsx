'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, X, Download, Copy, Check, Sparkles, Clock, Users } from 'lucide-react';
import type { Message } from '@/lib/teams/types';
import { formatDate, formatTime } from '@/lib/teams/utils';

interface MeetingSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  roomName: string;
}

export default function MeetingSummary({ isOpen, onClose, messages, roomName }: MeetingSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateSummary = async () => {
    if (messages.length === 0) return;

    setLoading(true);
    try {
      const response = await fetch('/api/teams/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, type: 'meeting' }),
      });

      const data = await response.json();
      setSummary(data.summary);
    } catch (error) {
      console.error('Error generating summary:', error);
      setSummary('Failed to generate summary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!summary) return;

    const blob = new Blob([summary], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-summary-${roomName}-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get meeting stats
  const userMessages = messages.filter((m) => !m.isAI);
  const participants = Array.from(new Set(userMessages.map((m) => m.senderName)));
  const startTime = messages.length > 0 ? messages[0].timestamp : null;
  const endTime = messages.length > 0 ? messages[messages.length - 1].timestamp : null;
  const duration = startTime && endTime ? endTime - startTime : 0;
  const durationMinutes = Math.floor(duration / 60000);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl md:max-h-[80vh] bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[var(--accent-primary)]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)]">Meeting Summary</h3>
                  <p className="text-xs text-[var(--text-muted)]">{roomName}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 p-4 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[var(--text-muted)]" />
                <div>
                  <p className="text-xs text-[var(--text-muted)]">Participants</p>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {participants.length}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[var(--text-muted)]" />
                <div>
                  <p className="text-xs text-[var(--text-muted)]">Messages</p>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {userMessages.length}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--text-muted)]" />
                <div>
                  <p className="text-xs text-[var(--text-muted)]">Duration</p>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {durationMinutes}m
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {!summary && !loading && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-[var(--accent-primary)]" />
                  </div>
                  <h4 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                    Generate Meeting Summary
                  </h4>
                  <p className="text-sm text-[var(--text-muted)] mb-6 max-w-sm mx-auto">
                    AI will analyze the conversation and create a structured summary with key points,
                    decisions, and action items.
                  </p>
                  <button
                    onClick={generateSummary}
                    disabled={messages.length === 0}
                    className="px-6 py-2.5 rounded-lg bg-[var(--accent-primary)] text-[#0a0a0b] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 mx-auto"
                  >
                    <Sparkles className="w-4 h-4" />
                    Generate Summary
                  </button>
                </div>
              )}

              {loading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 rounded-full border-2 border-[var(--accent-primary)] border-t-transparent animate-spin mb-4" />
                  <p className="text-[var(--text-muted)]">Analyzing conversation...</p>
                </div>
              )}

              {summary && !loading && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-[var(--text-primary)]">Summary</h4>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopy}
                        className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] transition-colors"
                        title="Copy to clipboard"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={handleDownload}
                        className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] transition-colors"
                        title="Download as markdown"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-[var(--text-secondary)] leading-relaxed">
                      {summary}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {summary && (
              <div className="p-4 border-t border-[var(--border)] flex justify-between items-center">
                <p className="text-xs text-[var(--text-muted)]">
                  Generated on {formatDate(Date.now())} at {formatTime(Date.now())}
                </p>
                <button
                  onClick={generateSummary}
                  className="text-sm text-[var(--accent-primary)] hover:underline"
                >
                  Regenerate
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
