'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile, Paperclip, X, Search } from 'lucide-react';
import type { Message, TeamUser } from '@/lib/teams/types';
import { sanitizeInput } from '@/lib/teams/utils';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import dynamic from 'next/dynamic';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

interface ChatWindowProps {
  messages: Message[];
  currentUser: TeamUser;
  typingUsers: string[];
  onSendMessage: (text: string, replyTo?: Message | null) => void;
  onEditMessage: (messageId: string, newText: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onPinMessage: (messageId: string) => void;
  onReact: (messageId: string, emoji: string) => void;
}

export default function ChatWindow({
  messages,
  currentUser,
  typingUsers,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onPinMessage,
  onReact,
}: ChatWindowProps) {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(sanitizeInput(inputText), replyingTo);
    setInputText('');
    setReplyingTo(null);
    setShowEmojiPicker(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiClick = (emojiData: { emoji: string }) => {
    setInputText((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
    inputRef.current?.focus();
  };

  // Filter messages for search
  const filteredMessages = searchQuery
    ? messages.filter((m) =>
      m.text.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : messages;

  // Group messages by sender for avatar display
  const getShowAvatar = (index: number) => {
    if (index === 0) return true;
    return messages[index - 1].senderId !== messages[index].senderId;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden"
          >
            <div className="p-3 flex items-center gap-2">
              <Search className="w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
                autoFocus
              />
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                }}
                className="p-1 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredMessages.length === 0 && searchQuery && (
          <div className="text-center py-8 text-[var(--text-muted)]">
            No messages found matching &quot;{searchQuery}&quot;
          </div>
        )}

        {filteredMessages.length === 0 && !searchQuery && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">👋</span>
            </div>
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
              Welcome to the chat!
            </h3>
            <p className="text-[var(--text-muted)]">
              Start the conversation by sending a message
            </p>
          </div>
        )}

        {filteredMessages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            currentUser={currentUser}
            showAvatar={getShowAvatar(index)}
            onReply={handleReply}
            onEdit={onEditMessage}
            onDelete={onDeleteMessage}
            onPin={onPinMessage}
            onReact={onReact}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      <TypingIndicator names={typingUsers} />

      {/* Reply Preview */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 bg-[var(--bg-elevated)] border-t border-[var(--border)] flex items-center justify-between"
          >
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] overflow-hidden">
              <span className="text-[var(--accent-primary)] whitespace-nowrap">
                Replying to {replyingTo.senderName}:
              </span>
              <span className="truncate">{replyingTo.text}</span>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="p-1 rounded hover:bg-[var(--bg-card)] flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-secondary)]">
        <div className="flex items-end gap-2">
          <button className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>

          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... Use @AI for AI assistance"
              rows={1}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] resize-none min-h-[44px] max-h-[120px]"
              style={{ height: 'auto' }}
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] transition-colors"
            >
              <Smile className="w-5 h-5" />
            </button>

            {showEmojiPicker && (
              <div className="absolute bottom-full right-0 mb-2 z-50">
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg shadow-lg overflow-hidden">
                  <EmojiPicker onEmojiClick={handleEmojiClick} />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="p-2.5 rounded-xl bg-[var(--accent-primary)] text-[#0a0a0b] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
