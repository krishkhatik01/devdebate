'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Share2, Sparkles, Copy, Maximize2, Code2 } from 'lucide-react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  initialCode?: string;
  initialLanguage?: string;
  onClose?: () => void;
  onShare?: (code: string, language: string) => void;
  onAIReview?: (code: string, language: string) => void;
}

const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript' },
  { id: 'typescript', name: 'TypeScript' },
  { id: 'python', name: 'Python' },
  { id: 'java', name: 'Java' },
  { id: 'cpp', name: 'C++' },
  { id: 'csharp', name: 'C#' },
  { id: 'go', name: 'Go' },
  { id: 'rust', name: 'Rust' },
  { id: 'php', name: 'PHP' },
  { id: 'ruby', name: 'Ruby' },
  { id: 'swift', name: 'Swift' },
  { id: 'kotlin', name: 'Kotlin' },
  { id: 'html', name: 'HTML' },
  { id: 'css', name: 'CSS' },
  { id: 'json', name: 'JSON' },
  { id: 'sql', name: 'SQL' },
  { id: 'bash', name: 'Bash' },
  { id: 'yaml', name: 'YAML' },
  { id: 'markdown', name: 'Markdown' },
];

const DEFAULT_CODE = `// Write your code here
function example() {
  console.log("Hello, DevDebate Teams!");
  return "Ready to collaborate";
}

// Click "AI Review" to get feedback
// Click "Share" to send to chat`;

export default function CodeEditor({
  initialCode = DEFAULT_CODE,
  initialLanguage = 'javascript',
  onClose,
  onShare,
  onAIReview,
}: CodeEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [language, setLanguage] = useState(initialLanguage);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
  };

  const handleAIReview = async () => {
    setIsReviewing(true);
    try {
      await onAIReview?.(code, language);
    } finally {
      setIsReviewing(false);
    }
  };

  const handleShare = () => {
    onShare?.(code, language);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden flex flex-col ${isFullscreen ? 'fixed inset-4 z-50' : 'h-[500px]'
        }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center">
            <Code2 className="w-4 h-4 text-[var(--accent-primary)]" />
          </div>
          <div>
            <h3 className="font-medium text-[var(--text-primary)]">Code Editor</h3>
            <p className="text-xs text-[var(--text-muted)]">Write and share code with your team</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleCopy}
            className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] transition-colors"
            title="Copy code"
          >
            <Copy className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={(value) => setCode(value || '')}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: false,
            automaticLayout: true,
            padding: { top: 16 },
            fontFamily: 'JetBrains Mono, Fira Code, monospace',
          }}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)] bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <span>{code.split('\n').length} lines</span>
          <span>•</span>
          <span>{code.length} characters</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAIReview}
            disabled={isReviewing || !code.trim()}
            className="px-4 py-2 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Sparkles className={`w-4 h-4 ${isReviewing ? 'animate-spin' : ''}`} />
            {isReviewing ? 'Reviewing...' : 'AI Review'}
          </button>

          <button
            onClick={handleShare}
            disabled={!code.trim()}
            className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-[#0a0a0b] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share to Chat
          </button>
        </div>
      </div>
    </motion.div>
  );
}
