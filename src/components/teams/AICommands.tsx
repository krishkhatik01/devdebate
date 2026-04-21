'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Code, FileText, ListTodo, HelpCircle, X } from 'lucide-react';

interface AICommand {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  command: string;
}

const COMMANDS: AICommand[] = [
  {
    id: 'summarize',
    label: 'Summarize',
    icon: <FileText className="w-4 h-4" />,
    description: 'Summarize recent conversation',
    command: '@ai summarize',
  },
  {
    id: 'review',
    label: 'Review Code',
    icon: <Code className="w-4 h-4" />,
    description: 'Review code for issues',
    command: '@ai review',
  },
  {
    id: 'tasks',
    label: 'Extract Tasks',
    icon: <ListTodo className="w-4 h-4" />,
    description: 'Extract tasks from chat',
    command: '@ai extract tasks',
  },
  {
    id: 'help',
    label: 'Help',
    icon: <HelpCircle className="w-4 h-4" />,
    description: 'Show available commands',
    command: '@ai help',
  },
];

interface AICommandsProps {
  isVisible: boolean;
  onSelect: (command: string) => void;
  onClose: () => void;
  filter?: string;
}

export default function AICommands({ isVisible, onSelect, onClose, filter = '' }: AICommandsProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredCommands = filter
    ? COMMANDS.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(filter.toLowerCase()) ||
        cmd.description.toLowerCase().includes(filter.toLowerCase())
    )
    : COMMANDS;

  const handleSelect = useCallback(
    (command: string) => {
      onSelect(command);
      onClose();
    },
    [onSelect, onClose]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev === 0 ? filteredCommands.length - 1 : prev - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          handleSelect(filteredCommands[selectedIndex].command);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    },
    [filteredCommands, selectedIndex, handleSelect, onClose]
  );

  if (!isVisible || filteredCommands.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        onKeyDown={handleKeyDown}
        className="absolute bottom-full left-0 mb-2 w-80 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden z-50"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
            <span className="text-xs font-medium text-[var(--text-primary)]">AI Commands</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Commands List */}
        <div className="p-1">
          {filteredCommands.map((cmd, index) => (
            <button
              key={cmd.id}
              onClick={() => handleSelect(cmd.command)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${index === selectedIndex
                ? 'bg-[var(--accent-primary)]/10'
                : 'hover:bg-[var(--bg-elevated)]'
                }`}
            >
              <div
                className={`p-1.5 rounded ${index === selectedIndex
                  ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'
                  }`}
              >
                {cmd.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${index === selectedIndex
                    ? 'text-[var(--accent-primary)]'
                    : 'text-[var(--text-primary)]'
                    }`}
                >
                  {cmd.label}
                </p>
                <p className="text-xs text-[var(--text-muted)] truncate">{cmd.description}</p>
              </div>
              <code className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                {cmd.command}
              </code>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-[var(--border)] bg-[var(--bg-secondary)]">
          <p className="text-[10px] text-[var(--text-muted)]">
            Use <kbd className="px-1 rounded bg-[var(--bg-card)]">↑</kbd>{' '}
            <kbd className="px-1 rounded bg-[var(--bg-card)]">↓</kbd> to navigate,{' '}
            <kbd className="px-1 rounded bg-[var(--bg-card)]">Enter</kbd> to select
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
