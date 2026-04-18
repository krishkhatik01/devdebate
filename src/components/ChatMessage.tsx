'use client';

import { useState } from 'react';
import { Message } from '@/lib/types';
import { Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: Message;
  isLoading?: boolean;
}

export default function ChatMessage({ message, isLoading }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex gap-3">
        <div className="w-7 h-7 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center flex-shrink-0">
          <span className="text-[var(--accent-primary)] font-medium text-sm">D</span>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[16px_16px_16px_4px] px-4 py-3 max-w-[80%]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-bounce [animation-delay:0.1s]" />
            <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-bounce [animation-delay:0.2s]" />
          </div>
        </div>
      </div>
    );
  }

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="message-user max-w-[70%] px-4 py-3 text-sm font-medium">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 group">
      <div className="w-7 h-7 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center flex-shrink-0">
        <span className="text-[var(--accent-primary)] font-medium text-sm">D</span>
      </div>
      <div className="relative flex-1 max-w-[80%]">
        <div className="message-ai p-4">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown
              components={{
                code({ inline, children, ...props }: { inline?: boolean; children?: React.ReactNode }) {
                  return inline ? (
                    <code className="code-block px-1.5 py-0.5 rounded text-[var(--accent-primary)]" {...props}>
                      {children}
                    </code>
                  ) : (
                    <div className="relative my-3">
                      <pre className="code-block p-4 rounded-lg overflow-x-auto">
                        <code className="font-mono text-[13px] text-[var(--text-primary)]" {...props}>
                          {children}
                        </code>
                      </pre>
                    </div>
                  );
                },
                p: ({ children }) => <p className="mb-3 last:mb-0 text-[var(--text-primary)]">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-5 mb-3 text-[var(--text-primary)]">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 text-[var(--text-primary)]">{children}</ol>,
                li: ({ children }) => <li className="mb-1">{children}</li>,
                h1: ({ children }) => <h1 className="text-xl font-semibold mb-3 text-[var(--text-primary)]">{children}</h1>,
                h2: ({ children }) => <h2 className="text-lg font-semibold mb-3 text-[var(--text-primary)]">{children}</h2>,
                h3: ({ children }) => <h3 className="text-base font-semibold mb-2 text-[var(--text-primary)]">{children}</h3>,
                strong: ({ children }) => <strong className="font-semibold text-[var(--text-primary)]">{children}</strong>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--bg-secondary)] hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          {copied ? <Check size={14} className="text-[var(--accent-secondary)]" /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}
