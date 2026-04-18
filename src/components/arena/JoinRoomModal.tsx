'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, ArrowRight } from 'lucide-react';

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function JoinRoomModal({ isOpen, onClose }: JoinRoomModalProps) {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleJoin = async () => {
    if (!roomCode.trim()) return;

    setIsJoining(true);
    setError('');

    try {
      // Validate room code format (e.g., "bold-tiger-247")
      const cleanCode = roomCode.trim().toLowerCase();
      if (!cleanCode.match(/^[a-z]+-[a-z]+-\d+$/)) {
        setError('Invalid room code format. Example: bold-tiger-247');
        setIsJoining(false);
        return;
      }

      router.push(`/arena/${cleanCode}`);
    } catch {
      setError('Failed to join room. Please try again.');
      setIsJoining(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoin();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">Join Debate Room</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors"
          >
            <X size={20} className="text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-[var(--text-secondary)] text-sm">
            Enter the room code shared by your opponent
          </p>

          <div>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., bold-tiger-247"
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-strong)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all uppercase"
            />
            {error && (
              <p className="mt-2 text-[var(--accent-danger)] text-sm">{error}</p>
            )}
          </div>

          <div className="bg-[var(--bg-elevated)] rounded-xl p-4">
            <p className="text-[var(--text-secondary)] text-sm">
              <strong className="text-[var(--text-primary)]">Tip:</strong> Room codes look like{' '}
              <code className="bg-[var(--bg-secondary)] px-2 py-0.5 rounded text-[var(--accent-primary)]">cool-eagle-123</code>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--border)]">
          <button
            onClick={handleJoin}
            disabled={!roomCode.trim() || isJoining}
            className="w-full py-3 rounded-xl bg-[var(--accent-primary)] text-[#0a0a0b] font-semibold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isJoining ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-[#0a0a0b]/30 border-t-[#0a0a0b] rounded-full animate-spin" />
                Joining...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <ArrowRight size={18} />
                Join Room
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
