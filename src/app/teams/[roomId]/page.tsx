'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hash,
  Send,
  Smile,
  Paperclip,
  Phone,
  Video,
  PanelRight,
  X
} from 'lucide-react';
import { db, rtdb } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import {
  ref,
  onValue,
  push,
  set,
  onDisconnect,
  remove
} from 'firebase/database';
import { toast } from 'react-hot-toast';
import type { Room, Message, TeamUser, Presence } from '@/lib/teams/types';
import { AI_MEMBER } from '@/lib/teams/types';
import { storage, formatTime, sanitizeInput } from '@/lib/teams/utils';
import dynamic from 'next/dynamic';

// Dynamic imports for heavy components
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

export default function RoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;

  const [user, setUser] = useState<TeamUser | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Presence[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMembers, setShowMembers] = useState(true);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize user
  useEffect(() => {
    let storedUser = storage.getUser();
    if (!storedUser) {
      storedUser = {
        userId: 'user_' + Math.random().toString(36).substring(2, 15),
        name: 'Guest ' + Math.floor(Math.random() * 1000),
        emoji: ['🚀', '⭐', '🔥', '💎'][Math.floor(Math.random() * 4)],
        color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'][Math.floor(Math.random() * 4)],
        role: 'member',
      };
      storage.setUser(storedUser);
    }
    setUser(storedUser);
    storage.addJoinedRoom(roomId);
  }, [roomId]);

  // Subscribe to room data
  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = onSnapshot(doc(db, 'rooms', roomId), (doc) => {
      if (doc.exists()) {
        setRoom({ id: doc.id, ...doc.data() } as Room);
      } else {
        toast.error('Room not found');
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  // Subscribe to messages
  useEffect(() => {
    if (!roomId) return;

    const messagesRef = ref(rtdb, `rooms/${roomId}/messages`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messagesArray = Object.entries(data).map(([id, msg]) => ({
          id,
          ...(msg as object),
        })) as Message[];
        messagesArray.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(messagesArray);
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  // Subscribe to presence
  useEffect(() => {
    if (!roomId || !user) return;

    const presenceRef = ref(rtdb, `rooms/${roomId}/presence/${user.userId}`);
    const typingRef = ref(rtdb, `rooms/${roomId}/typing/${user.userId}`);

    // Set online status
    set(presenceRef, {
      userId: user.userId,
      name: user.name,
      emoji: user.emoji,
      color: user.color,
      online: true,
      lastSeen: Date.now(),
      typing: false,
    });

    // Handle disconnect
    onDisconnect(presenceRef).update({
      online: false,
      lastSeen: Date.now(),
      typing: false,
    });

    // Cleanup typing on disconnect
    onDisconnect(typingRef).remove();

    // Subscribe to all presence
    const allPresenceRef = ref(rtdb, `rooms/${roomId}/presence`);
    const unsubscribe = onValue(allPresenceRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const membersArray = Object.values(data) as Presence[];
        setMembers(membersArray);

        // Get typing users
        const typing = membersArray
          .filter(m => m.typing && m.userId !== user.userId)
          .map(m => m.name);
        setTypingUsers(typing);
      }
    });

    return () => {
      unsubscribe();
      set(presenceRef, {
        userId: user.userId,
        name: user.name,
        emoji: user.emoji,
        color: user.color,
        online: false,
        lastSeen: Date.now(),
        typing: false,
      });
    };
  }, [roomId, user]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !user || !roomId) return;

    const sanitizedText = sanitizeInput(inputMessage);
    const newMessage: Omit<Message, 'id'> = {
      text: sanitizedText,
      senderId: user.userId,
      senderName: user.name,
      senderColor: user.color,
      senderEmoji: user.emoji,
      timestamp: Date.now(),
      isAI: false,
      type: 'text',
      replyTo: replyingTo ? {
        messageId: replyingTo.id,
        text: replyingTo.text,
        senderName: replyingTo.senderName,
      } : null,
      reactions: {},
      edited: false,
      editedAt: null,
      pinned: false,
    };

    try {
      const messagesRef = ref(rtdb, `rooms/${roomId}/messages`);
      await push(messagesRef, newMessage);
      setInputMessage('');
      setReplyingTo(null);
      setShowEmojiPicker(false);

      // Clear typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      const typingRef = ref(rtdb, `rooms/${roomId}/typing/${user.userId}`);
      remove(typingRef);
    } catch {
      toast.error('Failed to send message');
    }
  };

  const handleTyping = () => {
    if (!user || !roomId) return;

    const typingRef = ref(rtdb, `rooms/${roomId}/typing/${user.userId}`);
    set(typingRef, true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      remove(typingRef);
    }, 3000);
  };

  const handleEmojiClick = (emojiData: { emoji: string }) => {
    setInputMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const onlineMembers = members.filter(m => m.online);
  const offlineMembers = members.filter(m => !m.online);

  if (!room || !user) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-[var(--bg-primary)] flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-[var(--border)] bg-[var(--bg-secondary)] flex items-center px-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center">
            <Hash className="w-5 h-5 text-[var(--accent-primary)]" />
          </div>
          <div>
            <h1 className="font-semibold text-[var(--text-primary)]">{room.name}</h1>
            <p className="text-xs text-[var(--text-muted)]">{room.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]">
            <Video className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowMembers(!showMembers)}
            className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] lg:hidden"
          >
            <PanelRight className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">👋</span>
                </div>
                <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">Welcome to {room.name}!</h3>
                <p className="text-[var(--text-muted)]">Start the conversation by sending a message</p>
              </div>
            )}

            {messages.map((message, index) => {
              const isMe = message.senderId === user.userId;
              const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  {showAvatar ? (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm"
                      style={{ backgroundColor: message.senderColor + '20' }}
                    >
                      {message.isAI ? '🤖' : message.senderEmoji}
                    </div>
                  ) : (
                    <div className="w-8 flex-shrink-0" />
                  )}

                  {/* Message Content */}
                  <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                    {showAvatar && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-[var(--text-secondary)]">
                          {message.isAI ? 'DevBot' : message.senderName}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)]">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                    )}

                    {/* Reply indicator */}
                    {message.replyTo && (
                      <div className="mb-1 px-3 py-1 rounded-lg bg-[var(--bg-elevated)] text-xs text-[var(--text-muted)] border-l-2 border-[var(--accent-primary)]">
                        <span className="font-medium">{message.replyTo.senderName}:</span> {message.replyTo.text.substring(0, 50)}...
                      </div>
                    )}

                    <div
                      className={`px-4 py-2 rounded-2xl ${isMe
                        ? 'bg-[var(--accent-primary)] text-[#0a0a0b] rounded-br-md'
                        : message.isAI
                          ? 'bg-purple-500/20 text-purple-100 border border-purple-500/30 rounded-bl-md'
                          : 'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)] rounded-bl-md'
                        }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      {message.edited && (
                        <span className="text-[10px] opacity-60 ml-1">(edited)</span>
                      )}
                    </div>

                    {/* Reactions */}
                    {Object.keys(message.reactions || {}).length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {Object.entries(message.reactions).map(([emoji, users]) => (
                          users.length > 0 && (
                            <button
                              key={emoji}
                              className="px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] text-xs border border-[var(--border)] hover:bg-[var(--bg-card)]"
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
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <div className="px-4 py-2 text-xs text-[var(--text-muted)]">
              {typingUsers.length === 1
                ? `${typingUsers[0]} is typing...`
                : `${typingUsers.join(', ')} are typing...`}
            </div>
          )}

          {/* Reply Preview */}
          {replyingTo && (
            <div className="px-4 py-2 bg-[var(--bg-elevated)] border-t border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <span className="text-[var(--accent-primary)]">Replying to {replyingTo.senderName}:</span>
                <span className="truncate max-w-md">{replyingTo.text}</span>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="p-1 rounded hover:bg-[var(--bg-card)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-secondary)]">
            <div className="flex items-end gap-2">
              <button className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                <Paperclip className="w-5 h-5" />
              </button>

              <div className="flex-1 relative">
                <textarea
                  value={inputMessage}
                  onChange={(e) => {
                    setInputMessage(e.target.value);
                    handleTyping();
                  }}
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
                  className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]"
                >
                  <Smile className="w-5 h-5" />
                </button>

                {showEmojiPicker && (
                  <div className="absolute bottom-full right-0 mb-2 z-50">
                    <EmojiPicker onEmojiClick={handleEmojiClick} />
                  </div>
                )}
              </div>

              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className="p-2.5 rounded-xl bg-[var(--accent-primary)] text-[#0a0a0b] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Members Sidebar */}
        <AnimatePresence>
          {showMembers && (
            <motion.div
              initial={{ width: 0, opacity: 0, x: 20 }}
              animate={{ width: 260, opacity: 1, x: 0 }}
              exit={{ width: 0, opacity: 0, x: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="border-l border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden fixed right-0 top-16 bottom-0 z-30 lg:relative lg:top-0 lg:right-auto shadow-2xl lg:shadow-none"
            >
              <div className="p-4 border-b border-[var(--border)]">
                <h3 className="font-semibold text-[var(--text-primary)]">Members</h3>
                <p className="text-xs text-[var(--text-muted)]">{onlineMembers.length} online</p>
              </div>

              <div className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-200px)]">
                {/* AI Member */}
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-elevated)]">
                  <div className="relative">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                      style={{ backgroundColor: AI_MEMBER.color + '20' }}
                    >
                      {AI_MEMBER.emoji}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[var(--bg-secondary)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{AI_MEMBER.name}</p>
                    <p className="text-xs text-green-500">Always online</p>
                  </div>
                </div>

                {/* Online Members */}
                {onlineMembers.filter(m => m.userId !== user.userId).map((member) => (
                  <div key={member.userId} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-elevated)]">
                    <div className="relative">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                        style={{ backgroundColor: member.color + '20' }}
                      >
                        {member.emoji}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[var(--bg-secondary)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{member.name}</p>
                      <p className="text-xs text-green-500">Online</p>
                    </div>
                  </div>
                ))}

                {/* Offline Members */}
                {offlineMembers.map((member) => (
                  <div key={member.userId} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-elevated)] opacity-60">
                    <div className="relative">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                        style={{ backgroundColor: member.color + '20' }}
                      >
                        {member.emoji}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-gray-500 border-2 border-[var(--bg-secondary)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{member.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">Offline</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
