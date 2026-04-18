'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createRoom, setPlayerReady } from '@/lib/arena';
import { X, Users, Clock, Shield, Globe } from 'lucide-react';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated: (roomId: string) => void;
}

const EXAMPLE_TOPICS = [
  'React vs Vue',
  'AWS vs GCP',
  'Go vs Rust',
  'REST vs GraphQL',
  'Monolith vs Microservices',
  'TypeScript vs JavaScript',
];

export default function CreateRoomModal({ isOpen, onClose, onRoomCreated }: CreateRoomModalProps) {
  const { user } = useAuth();
  const [topic, setTopic] = useState('');
  const [side, setSide] = useState<'for' | 'against'>('for');
  const [rounds, setRounds] = useState(3);
  const [timePerRound, setTimePerRound] = useState(90);
  const [roomType, setRoomType] = useState<'public' | 'private'>('public');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!topic.trim() || !user) return;

    setIsCreating(true);
    try {
      const roomId = await createRoom({
        topic: topic.trim(),
        createdBy: user.uid,
        totalRounds: rounds,
        timePerRound: timePerRound,
        roomType: roomType,
        players: {
          for: side === 'for' ? { uid: user.uid, name: user.displayName || 'Player 1', ready: false } : null,
          against: side === 'against' ? { uid: user.uid, name: user.displayName || 'Player 1', ready: false } : null,
        },
      });

      await setPlayerReady(roomId, side, true);
      onRoomCreated(roomId);
    } catch (error) {
      console.error('Failed to create room:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">Create Debate Room</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors"
          >
            <X size={20} className="text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Topic Input */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Debate Topic
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter a tech topic to debate..."
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-strong)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
            />

            {/* Example Topics */}
            <div className="flex flex-wrap gap-2 mt-3">
              {EXAMPLE_TOPICS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTopic(t)}
                  className="px-3 py-1.5 rounded-full bg-[var(--bg-elevated)] text-[var(--text-secondary)] text-sm hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors border border-[var(--border)]"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Side Selection */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Your Position
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSide('for')}
                className={`p-4 rounded-xl border-2 transition-all ${side === 'for'
                    ? 'border-[var(--accent-secondary)] bg-[var(--accent-secondary)]/10'
                    : 'border-[var(--border)] hover:border-[var(--accent-secondary)]/50'
                  }`}
              >
                <div className="text-[var(--accent-secondary)] font-semibold mb-1">FOR</div>
                <div className="text-[var(--text-secondary)] text-sm">I will argue IN FAVOR</div>
              </button>
              <button
                onClick={() => setSide('against')}
                className={`p-4 rounded-xl border-2 transition-all ${side === 'against'
                    ? 'border-[var(--accent-danger)] bg-[var(--accent-danger)]/10'
                    : 'border-[var(--border)] hover:border-[var(--accent-danger)]/50'
                  }`}
              >
                <div className="text-[var(--accent-danger)] font-semibold mb-1">AGAINST</div>
                <div className="text-[var(--text-secondary)] text-sm">I will argue IN OPPOSITION</div>
              </button>
            </div>
          </div>

          {/* Rounds Selection */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Number of Rounds
            </label>
            <div className="flex gap-2">
              {[1, 2, 3].map((r) => (
                <button
                  key={r}
                  onClick={() => setRounds(r)}
                  className={`flex-1 py-3 rounded-xl border transition-all ${rounds === r
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                      : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/50'
                    }`}
                >
                  {r} Round{r > 1 ? 's' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Time Selection */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Time Per Round
            </label>
            <div className="flex gap-2">
              {[60, 90, 120].map((t) => (
                <button
                  key={t}
                  onClick={() => setTimePerRound(t)}
                  className={`flex-1 py-3 rounded-xl border transition-all ${timePerRound === t
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                      : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/50'
                    }`}
                >
                  <Clock size={16} className="inline mr-1" />
                  {t}s
                </button>
              ))}
            </div>
          </div>

          {/* Room Type */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Room Visibility
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setRoomType('public')}
                className={`flex-1 py-3 rounded-xl border transition-all ${roomType === 'public'
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                    : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/50'
                  }`}
              >
                <Globe size={16} className="inline mr-1" />
                Public
              </button>
              <button
                onClick={() => setRoomType('private')}
                className={`flex-1 py-3 rounded-xl border transition-all ${roomType === 'private'
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                    : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/50'
                  }`}
              >
                <Shield size={16} className="inline mr-1" />
                Private
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--border)]">
          <button
            onClick={handleCreate}
            disabled={!topic.trim() || isCreating}
            className="w-full py-3 rounded-xl bg-[var(--accent-primary)] text-[#0a0a0b] font-semibold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-[#0a0a0b]/30 border-t-[#0a0a0b] rounded-full animate-spin" />
                Creating...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Users size={18} />
                Create Room
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
