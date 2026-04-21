'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Reply,
  Edit2,
  Trash2,
  Pin,
  Check,
  X,
  Smile,
  Copy
} from 'lucide-react';
import type { Message, TeamUser } from '@/lib/teams/types';
import { AI_MEMBER } from '@/lib/teams/types';
import { formatTime, sanitizeInput } from '@/lib/teams/utils';

interface MessageBubbleProps {
  message: Message;
  currentUser: TeamUser;
  onReply?: (message: Message) => void;
  onEdit?: (messageId: string, newText: string) => void;
  onDelete?: (messageId: string) => void;
  onPin?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  showAvatar?: boolean;
}

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '🎉', '🔥'];

export default function MessageBubble({
  message,
  currentUser,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onReact,
  showAvatar = true,
}: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const isMe = message.senderId === currentUser.userId;
  const isAI = message.isAI;

  const handleEdit = () => {
    if (!editText.trim() || editText === message.text) {
      setIsEditing(false);
      return;
    }
    onEdit?.(message.id, sanitizeInput(editText));
    setIsEditing(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
  };

  const hasReactions = Object.keys(message.reactions || {}).length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''} group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowEmojiPicker(false);
      }}
    >
      {/* Avatar */}
      {showAvatar ? (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm"
          style={{ backgroundColor: message.senderColor + '20' }}
        >
          {isAI ? AI_MEMBER.emoji : message.senderEmoji}
        </div>
      ) : (
        <div className="w-8 flex-shrink-0" />
      )}

      {/* Message Content */}
      <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
        {/* Sender Name & Time */}
        {showAvatar && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {isAI ? AI_MEMBER.name : message.senderName}
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">
              {formatTime(message.timestamp)}
            </span>
            {message.edited && (
              <span className="text-[10px] text-[var(--text-muted)]">(edited)</span>
            )}
            {message.pinned && (
              <Pin className="w-3 h-3 text-[var(--accent-primary)]" />
            )}
          </div>
        )}

        {/* Reply To */}
        {message.replyTo && (
          <div
            className="mb-1 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] text-xs text-[var(--text-muted)] border-l-2 border-[var(--accent-primary)] cursor-pointer hover:bg-[var(--bg-card)] transition-colors"
            onClick={() => { }}
          >
            <span className="font-medium text-[var(--accent-primary)]">{message.replyTo.senderName}:</span>
            <span className="ml-1 truncate">{message.replyTo.text.substring(0, 50)}...</span>
          </div>
        )}

        {/* Message Bubble */}
        <div className="relative">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEdit();
                  if (e.key === 'Escape') setIsEditing(false);
                }}
                className="px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--accent-primary)] text-[var(--text-primary)] text-sm focus:outline-none"
                autoFocus
              />
              <button onClick={handleEdit} className="p-1 rounded bg-green-500/20 text-green-500">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => setIsEditing(false)} className="p-1 rounded bg-red-500/20 text-red-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              className={`px-4 py-2 rounded-2xl ${isMe
                ? 'bg-[var(--accent-primary)] text-[#0a0a0b] rounded-br-md'
                : isAI
                  ? 'bg-purple-500/20 text-purple-100 border border-purple-500/30 rounded-bl-md'
                  : 'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)] rounded-bl-md'
                }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.text}</p>
            </div>
          )}

          {/* Actions Menu */}
          {!isEditing && (
            <AnimatePresence>
              {showActions && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`absolute ${isMe ? 'right-full mr-2' : 'left-full ml-2'} top-0 flex items-center gap-1`}
                >
                  {/* Emoji Picker Toggle */}
                  <div className="relative">
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-1.5 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-card)] text-[var(--text-muted)]"
                    >
                      <Smile className="w-4 h-4" />
                    </button>

                    {showEmojiPicker && (
                      <div className="absolute bottom-full mb-2 left-0 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-2 shadow-lg flex gap-1">
                        {REACTION_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => {
                              onReact?.(message.id, emoji);
                              setShowEmojiPicker(false);
                            }}
                            className="p-1 hover:bg-[var(--bg-elevated)] rounded text-lg"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => onReply?.(message)}
                    className="p-1.5 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-card)] text-[var(--text-muted)]"
                    title="Reply"
                  >
                    <Reply className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-card)] text-[var(--text-muted)]"
                    title="Copy"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  {(isMe || isAI) && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1.5 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-card)] text-[var(--text-muted)]"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}

                  {isMe && (
                    <button
                      onClick={() => onDelete?.(message.id)}
                      className="p-1.5 rounded-lg bg-[var(--bg-elevated)] hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-500"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => onPin?.(message.id)}
                    className={`p-1.5 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-card)] ${message.pinned ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'}`}
                    title={message.pinned ? 'Unpin' : 'Pin'}
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Reactions */}
        {hasReactions && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {Object.entries(message.reactions).map(([emoji, users]) => (
              users.length > 0 && (
                <button
                  key={emoji}
                  onClick={() => onReact?.(message.id, emoji)}
                  className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${users.includes(currentUser.userId)
                    ? 'bg-[var(--accent-primary)]/20 border-[var(--accent-primary)] text-[var(--accent-primary)]'
                    : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]'
                    }`}
                >
                  {emoji} {users.length}
                </button>
              )
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
