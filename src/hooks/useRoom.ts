'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, updateDoc, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Room, TeamUser } from '@/lib/teams/types';
import { storage } from '@/lib/teams/utils';

interface UseRoomReturn {
  room: Room | null;
  loading: boolean;
  error: string | null;
  leaveRoom: () => Promise<void>;
  updateRoomSettings: (settings: Partial<Room['settings']>) => Promise<void>;
  isOwner: boolean;
}

export function useRoom(roomId: string | null, currentUser: TeamUser | null): UseRoomReturn {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) {
      setRoom(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      doc(db, 'rooms', roomId),
      (doc) => {
        if (doc.exists()) {
          setRoom({ id: doc.id, ...doc.data() } as Room);
        } else {
          setError('Room not found');
          setRoom(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Room subscription error:', err);
        setError('Failed to load room');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [roomId]);

  const leaveRoom = useCallback(async () => {
    if (!roomId || !currentUser) return;

    try {
      const roomRef = doc(db, 'rooms', roomId);
      const roomSnap = await getDoc(roomRef);

      if (roomSnap.exists()) {
        const roomData = roomSnap.data();
        const member = roomData.members?.find((m: { userId: string }) => m.userId === currentUser.userId);

        if (member) {
          await updateDoc(roomRef, {
            members: arrayRemove(member),
            memberCount: Math.max(0, (roomData.memberCount || 1) - 1),
          });
        }
      }

      storage.removeJoinedRoom(roomId);
    } catch (err) {
      console.error('Error leaving room:', err);
      throw err;
    }
  }, [roomId, currentUser]);

  const updateRoomSettings = useCallback(async (settings: Partial<Room['settings']>) => {
    if (!roomId) return;

    try {
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, {
        settings: { ...room?.settings, ...settings },
      });
    } catch (err) {
      console.error('Error updating settings:', err);
      throw err;
    }
  }, [roomId, room?.settings]);

  const isOwner = room?.createdBy === currentUser?.userId;

  return {
    room,
    loading,
    error,
    leaveRoom,
    updateRoomSettings,
    isOwner,
  };
}
