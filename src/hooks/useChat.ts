'use client';

import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, push, set, update, remove, query, limitToLast } from 'firebase/database';
import { rtdb } from '@/lib/firebase';
import type { Message, TeamUser } from '@/lib/teams/types';


interface UseChatReturn {
  messages: Message[];
  loading: boolean;
  sendMessage: (text: string, replyTo?: Message | null) => Promise<void>;
  editMessage: (messageId: string, newText: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  pinMessage: (messageId: string, pinned: boolean) => Promise<void>;
  addReaction: (messageId: string, emoji: string, userId: string) => Promise<void>;
  pinnedMessages: Message[];
}

const MESSAGES_LIMIT = 100;

export function useChat(roomId: string | null, currentUser: TeamUser | null): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const messagesRef = query(ref(rtdb, `rooms/${roomId}/messages`), limitToLast(MESSAGES_LIMIT));

    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messagesArray = Object.entries(data).map(([id, msg]) => ({
          id,
          ...(msg as object),
        })) as Message[];

        // Sort by timestamp
        messagesArray.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(messagesArray);
      } else {
        setMessages([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [roomId]);

  const sendMessage = useCallback(async (text: string, replyTo?: Message | null) => {
    if (!roomId || !currentUser || !text.trim()) return;

    const messagesRef = ref(rtdb, `rooms/${roomId}/messages`);
    const newMessageRef = push(messagesRef);

    const messageData: Omit<Message, 'id'> = {
      text: text.trim(),
      senderId: currentUser.userId,
      senderName: currentUser.name,
      senderEmoji: currentUser.emoji,
      senderColor: currentUser.color,
      timestamp: Date.now(),
      edited: false,
      editedAt: null,
      pinned: false,
      reactions: {},
      isAI: false,
      type: 'text',
      replyTo: replyTo ? {
        messageId: replyTo.id,
        text: replyTo.text,
        senderName: replyTo.senderName,
      } : null,
    };

    await set(newMessageRef, messageData);
  }, [roomId, currentUser]);

  const editMessage = useCallback(async (messageId: string, newText: string) => {
    if (!roomId || !newText.trim()) return;

    const messageRef = ref(rtdb, `rooms/${roomId}/messages/${messageId}`);
    await update(messageRef, {
      text: newText.trim(),
      edited: true,
      editedAt: Date.now(),
    });
  }, [roomId]);

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!roomId) return;

    const messageRef = ref(rtdb, `rooms/${roomId}/messages/${messageId}`);
    await remove(messageRef);
  }, [roomId]);

  const pinMessage = useCallback(async (messageId: string, pinned: boolean) => {
    if (!roomId) return;

    const messageRef = ref(rtdb, `rooms/${roomId}/messages/${messageId}`);
    await update(messageRef, { pinned });
  }, [roomId]);

  const addReaction = useCallback(async (messageId: string, emoji: string, userId: string) => {
    if (!roomId) return;

    const reactionRef = ref(rtdb, `rooms/${roomId}/messages/${messageId}/reactions/${emoji}`);

    // Get current reactions using get instead of onValue
    const { get } = await import('firebase/database');
    const snapshot = await get(ref(rtdb, `rooms/${roomId}/messages/${messageId}/reactions`));
    const currentReactions: Record<string, string[]> = snapshot.val() || {};
    const users = currentReactions[emoji] || [];

    if (users.includes(userId)) {
      // Remove reaction
      const updatedUsers = users.filter((id: string) => id !== userId);
      if (updatedUsers.length === 0) {
        await remove(reactionRef);
      } else {
        await set(reactionRef, updatedUsers);
      }
    } else {
      // Add reaction
      await set(reactionRef, [...users, userId]);
    }
  }, [roomId]);

  const pinnedMessages = messages.filter((m) => m.pinned);

  return {
    messages,
    loading,
    sendMessage,
    editMessage,
    deleteMessage,
    pinMessage,
    addReaction,
    pinnedMessages,
  };
}
