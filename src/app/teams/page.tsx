'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Users,
  Plus,
  LogIn,
  Copy,
  ArrowRight,
  Hash,
  Lock,
  Clock,
  MessageSquare
} from 'lucide-react';
import { storage, generateRoomId, getRandomColor, getRandomEmoji, generateUserId } from '@/lib/teams/utils';
import type { TeamUser, Room } from '@/lib/teams/types';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

export default function TeamsPage() {
  const router = useRouter();
  const [user, setUser] = useState<TeamUser | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinedRooms, setJoinedRooms] = useState<string[]>([]);
  const [roomDetails, setRoomDetails] = useState<Room[]>([]);

  // Create room form
  const [roomName, setRoomName] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  // Join room form
  const [joinRoomId, setJoinRoomId] = useState('');
  const [joinPassword, setJoinPassword] = useState('');

  useEffect(() => {
    // Get or create user
    let storedUser = storage.getUser();
    if (!storedUser) {
      storedUser = {
        userId: generateUserId(),
        name: 'Guest ' + Math.floor(Math.random() * 1000),
        emoji: getRandomEmoji(),
        color: getRandomColor(),
        role: 'member',
      };
      storage.setUser(storedUser);
    }
    setUser(storedUser);

    // Get joined rooms
    const rooms = storage.getJoinedRooms();
    setJoinedRooms(rooms);

    // Fetch room details
    fetchRoomDetails(rooms);
  }, []);

  const fetchRoomDetails = async (roomIds: string[]) => {
    const details: Room[] = [];
    for (const roomId of roomIds) {
      try {
        const roomDoc = await getDoc(doc(db, 'rooms', roomId));
        if (roomDoc.exists()) {
          details.push({ id: roomId, ...roomDoc.data() } as Room);
        }
      } catch (error) {
        console.error('Error fetching room:', error);
      }
    }
    setRoomDetails(details);
  };

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      toast.error('Please enter a room name');
      return;
    }

    if (!user) return;

    const roomId = generateRoomId();
    const newRoom: Omit<Room, 'id'> = {
      name: roomName.trim(),
      description: roomDescription.trim() || 'No description',
      createdBy: user.userId,
      createdAt: Date.now(),
      password: isPrivate ? roomPassword : null,
      maxMembers: 100,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      settings: {
        aiAutoSuggest: true,
        aiSummarize: true,
        allowCode: true,
        allowTasks: true,
      },
    };

    try {
      await setDoc(doc(db, 'rooms', roomId), newRoom);
      storage.addJoinedRoom(roomId);
      toast.success('Room created successfully!');
      router.push(`/teams/${roomId}`);
    } catch (error) {
      toast.error('Failed to create room');
      console.error(error);
    }
  };

  const handleJoinRoom = async () => {
    if (!joinRoomId.trim()) {
      toast.error('Please enter a room ID');
      return;
    }

    const roomId = joinRoomId.trim().toUpperCase();

    try {
      const roomDoc = await getDoc(doc(db, 'rooms', roomId));
      if (!roomDoc.exists()) {
        toast.error('Room not found');
        return;
      }

      const roomData = roomDoc.data() as Room;

      // Check password if room is private
      if (roomData.password && roomData.password !== joinPassword) {
        toast.error('Incorrect password');
        return;
      }

      // Check if room expired
      if (roomData.expiresAt < Date.now()) {
        toast.error('This room has expired');
        return;
      }

      storage.addJoinedRoom(roomId);
      toast.success('Joined room successfully!');
      router.push(`/teams/${roomId}`);
    } catch (error) {
      toast.error('Failed to join room');
      console.error(error);
    }
  };

  const copyRoomLink = (roomId: string) => {
    const link = `${window.location.origin}/teams/${roomId}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-purple-600 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">DevDebate Teams</h1>
                <p className="text-sm text-[var(--text-muted)]">Real-time collaboration for developer teams</p>
              </div>
            </div>

            {user && (
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                  style={{ backgroundColor: user.color + '20' }}
                >
                  {user.emoji}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{user.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{user.userId.substring(0, 8)}...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Create Room Card */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreateModal(true)}
            className="p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--accent-primary)]/50 transition-all text-left group"
          >
            <div className="w-14 h-14 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center mb-4 group-hover:bg-[var(--accent-primary)]/20 transition-colors">
              <Plus className="w-7 h-7 text-[var(--accent-primary)]" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Create a Room</h2>
            <p className="text-[var(--text-muted)] mb-4">Start a new team workspace with AI-powered collaboration</p>
            <div className="flex items-center text-[var(--accent-primary)] text-sm font-medium">
              Create Room <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </motion.button>

          {/* Join Room Card */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowJoinModal(true)}
            className="p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--accent-primary)]/50 transition-all text-left group"
          >
            <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
              <LogIn className="w-7 h-7 text-purple-500" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Join a Room</h2>
            <p className="text-[var(--text-muted)] mb-4">Enter a room ID to join an existing team workspace</p>
            <div className="flex items-center text-purple-500 text-sm font-medium">
              Join Room <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </motion.button>
        </div>

        {/* Joined Rooms */}
        {joinedRooms.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Rooms
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {roomDetails.map((room) => (
                <motion.div
                  key={room.id}
                  whileHover={{ scale: 1.02 }}
                  className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--accent-primary)]/30 cursor-pointer group"
                  onClick={() => router.push(`/teams/${room.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-[var(--accent-primary)]" />
                      <span className="font-mono text-sm text-[var(--text-muted)]">{room.id}</span>
                    </div>
                    {room.password && <Lock className="w-4 h-4 text-[var(--text-muted)]" />}
                  </div>
                  <h3 className="font-semibold text-[var(--text-primary)] mb-1">{room.name}</h3>
                  <p className="text-sm text-[var(--text-muted)] line-clamp-2">{room.description}</p>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border)]">
                    <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                      <Users className="w-3 h-3" />
                      <span>{room.memberCount || 0} members</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyRoomLink(room.id);
                      }}
                      className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {joinedRooms.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-10 h-10 text-[var(--text-muted)]" />
            </div>
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No rooms yet</h3>
            <p className="text-[var(--text-muted)]">Create or join a room to start collaborating with your team</p>
          </div>
        )}
      </main>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] w-full max-w-md p-6"
          >
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Create New Room</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Room Name</label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g., Frontend Team"
                  className="w-full px-4 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Description</label>
                <textarea
                  value={roomDescription}
                  onChange={(e) => setRoomDescription(e.target.value)}
                  placeholder="What is this room about?"
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="rounded border-[var(--border)]"
                />
                <label htmlFor="isPrivate" className="text-sm text-[var(--text-secondary)]">Private room (password protected)</label>
              </div>
              {isPrivate && (
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Password</label>
                  <input
                    type="password"
                    value={roomPassword}
                    onChange={(e) => setRoomPassword(e.target.value)}
                    placeholder="Enter room password"
                    className="w-full px-4 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoom}
                className="flex-1 px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-[#0a0a0b] font-medium hover:brightness-110 transition-all"
              >
                Create Room
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Join Room Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] w-full max-w-md p-6"
          >
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Join Room</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Room ID</label>
                <input
                  type="text"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                  placeholder="e.g., ABC123"
                  className="w-full px-4 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Password (if required)</label>
                <input
                  type="password"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  placeholder="Enter room password"
                  className="w-full px-4 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowJoinModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinRoom}
                className="flex-1 px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-[#0a0a0b] font-medium hover:brightness-110 transition-all"
              >
                Join Room
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
