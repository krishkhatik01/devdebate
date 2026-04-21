'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Loader2 } from 'lucide-react';
import type { Message } from '@/lib/teams/types';
import { AI_MEMBER } from '@/lib/teams/types';

interface AIMemberProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  onSendMessage: (text: string) => void;
}

const SUGGESTED_COMMANDS = [
  { label: 'Summarize chat', command: '@ai summarize' },
  { label: 'Review code', command: '@ai review my code' },
  { label: 'Create tasks', command: '@ai extract tasks' },
  { label: 'Help', command: '@ai help' },
];

export default function AIMember({ isOpen, onClose, messages, onSendMessage }: AIMemberProps) {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = useCallback(async () => {
    if (!input.trim()) return;

    onSendMessage(input);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking
    setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  }, [input, onSendMessage]);

  const handleCommandClick = (command: string) => {
    setInput(command);
  };

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
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* AI Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-96 bg-[var(--bg-card)] border-l border-[var(--border)] z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: AI_MEMBER.color + '20' }}
                >
                  <span className="text-xl">{AI_MEMBER.emoji}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)]">{AI_MEMBER.name}</h3>
                  <p className="text-xs text-green-500 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Always online
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Welcome Message */}
              <div className="mb-6">
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  Hi! I&apos;m {AI_MEMBER.name}, your AI teammate. I can help you with:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-[var(--text-muted)]">
                  <li>• Summarizing conversations</li>
                  <li>• Reviewing code</li>
                  <li>• Extracting tasks from chat</li>
                  <li>• Answering technical questions</li>
                  <li>• Generating meeting summaries</li>
                </ul>
              </div>

              {/* Quick Commands */}
              <div className="mb-6">
                <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
                  Quick Commands
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {SUGGESTED_COMMANDS.map((cmd) => (
                    <button
                      key={cmd.command}
                      onClick={() => handleCommandClick(cmd.command)}
                      className="p-3 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-secondary)] text-left transition-colors group"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-3 h-3 text-[var(--accent-primary)]" />
                        <span className="text-xs font-medium text-[var(--text-primary)]">
                          {cmd.label}
                        </span>
                      </div>
                      <code className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-card)] px-1.5 py-0.5 rounded">
                        {cmd.command}
                      </code>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              {messages.filter((m) => m.isAI).length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
                    Recent Activity
                  </h4>
                  <div className="space-y-2">
                    {messages
                      .filter((m) => m.isAI)
                      .slice(-3)
                      .map((msg, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-[var(--bg-elevated)] text-sm text-[var(--text-secondary)]"
                        >
                          {msg.text.substring(0, 100)}
                          {msg.text.length > 100 && '...'}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-[var(--border)]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask me anything..."
                  className="flex-1 px-4 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="p-2 rounded-lg bg-[var(--accent-primary)] text-[#0a0a0b] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isTyping ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-2">
                Type @ai in chat or use commands above
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
