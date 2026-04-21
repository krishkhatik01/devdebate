'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Hash, Users, Lock, Clock, LogOut } from 'lucide-react';
import type { Room } from '@/lib/teams/types';
import { storage, formatLastSeen } from '@/lib/teams/utils';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface RoomListProps {
  onRoomSelect?: (roomId: string) => void;
  selectedRoomId?: string;
}

export default function RoomList({ onRoomSelect, selectedRoomId }: RoomListProps) {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const roomIds = storage.getJoinedRooms();

    // Subscribe to all joined rooms
    const unsubscribes: (() => void)[] = [];

    roomIds.forEach((roomId: string) => {
      const unsubscribe = onSnapshot(
        doc(db, 'rooms', roomId),
        (doc) => {
          if (doc.exists()) {
            setRooms((prev) => {
              const existingIndex = prev.findIndex((r) => r.id === roomId);
              const newRoom = { id: doc.id, ...doc.data() } as Room;

              if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = newRoom;
                return updated;
              } else {
                return [...prev, newRoom];
              }
            });
          }
        },
        (error) => {
          console.error(`Error loading room ${roomId}:`, error);
        }
      );
      unsubscribes.push(unsubscribe);
    });

    setLoading(false);

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, []);

  const handleRoomClick = (roomId: string) => {
    if (onRoomSelect) {
      onRoomSelect(roomId);
    } else {
      router.push(`/teams/${roomId}`);
    }
  };

  const handleLeaveRoom = (e: React.MouseEvent, roomId: string) => {
    e.stopPropagation();
    storage.removeJoinedRoom(roomId);
    setRooms((prev) => prev.filter((r) => r.id !== roomId));
  };

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-[var(--bg-elevated)] animate-pulse" />
        ))}
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mx-auto mb-4">
          <Hash className="w-8 h-8 text-[var(--text-muted)]" />
        </div>
        <p className="text-[var(--text-muted)]">No rooms joined yet</p>
        <p className="text-sm text-[var(--text-muted)] mt-1">Create or join a room to get started</p>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-1">
      {rooms.map((room) => {
        const isSelected = selectedRoomId === room.id;
        const isExpired = room.expiresAt < Date.now();

        return (
          <motion.button
            key={room.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleRoomClick(room.id)}
            className={`w-full p-3 rounded-xl text-left transition-all group relative ${isSelected
              ? 'bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30'
              : 'bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--accent-primary)]/30'
              }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-[var(--accent-primary)]/20' : 'bg-[var(--bg-elevated)]'
                }`}>
                <Hash className={`w-5 h-5 ${isSelected ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={`font-medium truncate ${isSelected ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}>
                    {room.name}
                  </h3>
                  {room.password && <Lock className="w-3 h-3 text-[var(--text-muted)]" />}
                </div>

                <p className="text-xs text-[var(--text-muted)] truncate">{room.description}</p>

                <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-muted)]">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {room.memberCount || 0}
                  </span>

                  {isExpired ? (
                    <span className="text-red-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Expired
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Expires {formatLastSeen(room.expiresAt).replace(' ago', '')}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={(e) => handleLeaveRoom(e, room.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-all"
                title="Leave room"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
