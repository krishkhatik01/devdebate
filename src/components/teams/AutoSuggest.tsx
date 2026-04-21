'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, MessageSquare, Code2, Lightbulb } from 'lucide-react';

interface Suggestion {
  id: string;
  type: 'completion' | 'command' | 'code' | 'idea';
  text: string;
  icon: React.ReactNode;
}

interface AutoSuggestProps {
  input: string;
  context?: string;
  onSelect: (suggestion: string) => void;
  isVisible: boolean;
}

export default function AutoSuggest({ input, onSelect, isVisible }: Omit<AutoSuggestProps, 'context'>) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!input.trim() || !isVisible) {
      setSuggestions([]);
      return;
    }

    // Generate contextual suggestions
    const newSuggestions: Suggestion[] = [];

    // Command suggestions based on input
    if (input.startsWith('@')) {
      if ('@ai'.startsWith(input.toLowerCase())) {
        newSuggestions.push({
          id: 'ai',
          type: 'command',
          text: '@ai',
          icon: <Sparkles className="w-4 h-4" />,
        });
      }
    }

    // Code suggestions
    if (input.includes('function') || input.includes('const') || input.includes('let')) {
      newSuggestions.push({
        id: 'code-review',
        type: 'code',
        text: '@ai review this code',
        icon: <Code2 className="w-4 h-4" />,
      });
    }

    // Common responses
    const commonResponses = [
      { text: "I'll look into it", icon: <Zap className="w-4 h-4" /> },
      { text: 'Thanks for sharing!', icon: <MessageSquare className="w-4 h-4" /> },
      { text: 'Good point!', icon: <Lightbulb className="w-4 h-4" /> },
    ];

    if (input.length > 3) {
      commonResponses.forEach((resp, idx) => {
        newSuggestions.push({
          id: `response-${idx}`,
          type: 'completion',
          text: resp.text,
          icon: resp.icon,
        });
      });
    }

    setSuggestions(newSuggestions);
    setSelectedIndex(0);
  }, [input, isVisible]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev === 0 ? suggestions.length - 1 : prev - 1
        );
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          onSelect(suggestions[selectedIndex].text);
        }
      }
    },
    [suggestions, selectedIndex, onSelect]
  );

  if (!isVisible || suggestions.length === 0) return null;

  const getTypeColor = (type: Suggestion['type']) => {
    switch (type) {
      case 'command':
        return 'text-purple-400 bg-purple-500/10';
      case 'code':
        return 'text-blue-400 bg-blue-500/10';
      case 'idea':
        return 'text-yellow-400 bg-yellow-500/10';
      default:
        return 'text-[var(--text-muted)] bg-[var(--bg-elevated)]';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        onKeyDown={handleKeyDown}
        className="absolute bottom-full left-0 mb-2 w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden z-50"
      >
        <div className="p-1">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              onClick={() => onSelect(suggestion.text)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${index === selectedIndex
                ? 'bg-[var(--accent-primary)]/10'
                : 'hover:bg-[var(--bg-elevated)]'
                }`}
            >
              <div
                className={`p-1.5 rounded ${index === selectedIndex
                  ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'
                  : getTypeColor(suggestion.type)
                  }`}
              >
                {suggestion.icon}
              </div>
              <span
                className={`text-sm ${index === selectedIndex
                  ? 'text-[var(--accent-primary)]'
                  : 'text-[var(--text-primary)]'
                  }`}
              >
                {suggestion.text}
              </span>
              {suggestion.type === 'command' && (
                <span className="ml-auto text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                  AI
                </span>
              )}
            </button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
