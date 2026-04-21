'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ref, onValue, set, onDisconnect, update } from 'firebase/database';
import { rtdb } from '@/lib/firebase';
import type { Presence, TeamUser } from '@/lib/teams/types';

interface UsePresenceReturn {
  members: Presence[];
  typingUsers: string[];
  setTyping: (typing: boolean) => void;
  updatePresence: () => void;
}

const TYPING_TIMEOUT = 3000; // 3 seconds

export function usePresence(roomId: string | null, currentUser: TeamUser | null): UsePresenceReturn {
  const [members, setMembers] = useState<Presence[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set up presence tracking
  useEffect(() => {
    if (!roomId || !currentUser) {
      setMembers([]);
      setTypingUsers([]);
      return;
    }

    const presenceRef = ref(rtdb, `rooms/${roomId}/presence/${currentUser.userId}`);
    const allPresenceRef = ref(rtdb, `rooms/${roomId}/presence`);

    // Set online status
    set(presenceRef, {
      userId: currentUser.userId,
      name: currentUser.name,
      emoji: currentUser.emoji,
      color: currentUser.color,
      role: currentUser.role,
      online: true,
      lastSeen: Date.now(),
      typing: false,
    });

    // Set offline on disconnect
    onDisconnect(presenceRef).update({
      online: false,
      lastSeen: Date.now(),
      typing: false,
    });

    // Subscribe to all presence
    const unsubscribe = onValue(allPresenceRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const presenceList = Object.values(data) as Presence[];
        setMembers(presenceList);

        // Get typing users (excluding current user)
        const typing = presenceList
          .filter((p) => p.typing && p.userId !== currentUser.userId)
          .map((p) => p.name);
        setTypingUsers(typing);
      } else {
        setMembers([]);
        setTypingUsers([]);
      }
    });

    return () => {
      unsubscribe();
      // Set offline when component unmounts
      update(presenceRef, {
        online: false,
        lastSeen: Date.now(),
        typing: false,
      });
    };
  }, [roomId, currentUser]);

  // Update presence periodically
  const updatePresence = useCallback(() => {
    if (!roomId || !currentUser) return;

    const presenceRef = ref(rtdb, `rooms/${roomId}/presence/${currentUser.userId}`);
    update(presenceRef, {
      lastSeen: Date.now(),
    });
  }, [roomId, currentUser]);

  // Set typing status
  const setTyping = useCallback((typing: boolean) => {
    if (!roomId || !currentUser) return;

    const presenceRef = ref(rtdb, `rooms/${roomId}/presence/${currentUser.userId}`);
    update(presenceRef, { typing });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Auto-clear typing after timeout
    if (typing) {
      typingTimeoutRef.current = setTimeout(() => {
        update(presenceRef, { typing: false });
      }, TYPING_TIMEOUT);
    }
  }, [roomId, currentUser]);

  // Periodic heartbeat to keep presence alive
  useEffect(() => {
    if (!roomId || !currentUser) return;

    const interval = setInterval(() => {
      updatePresence();
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [roomId, currentUser, updatePresence]);

  return {
    members,
    typingUsers,
    setTyping,
    updatePresence,
  };
}
