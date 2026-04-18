'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import CreateRoomModal from '@/components/arena/CreateRoomModal';
import JoinRoomModal from '@/components/arena/JoinRoomModal';
import { Users, Plus, LogIn, Trophy, Clock, Eye } from 'lucide-react';

interface ArenaStats {
  totalDebates: number;
  totalPlayers: number;
  activeRooms: number;
}

export default function ArenaPage() {
  const router = useRouter();
  useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [stats] = useState<ArenaStats>({
    totalDebates: 1247,
    totalPlayers: 523,
    activeRooms: 12,
  });

  const handleRoomCreated = (roomId: string) => {
    setShowCreateModal(false);
    router.push(`/arena/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent-primary)]/5 to-transparent" />

        <div className="relative max-w-6xl mx-auto px-6 py-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 mb-6">
            <Users className="w-8 h-8 text-[var(--accent-primary)]" />
          </div>

          <h1 className="font-display text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4">
            ⚔️ Live Debate Arena
          </h1>

          <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto mb-8">
            Challenge a developer. AI judges. One winner.
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mb-12">
            <div className="text-center">
              <div className="text-2xl font-display font-bold text-[var(--accent-primary)]">
                {stats.totalDebates.toLocaleString()}
              </div>
              <div className="text-[var(--text-muted)] text-sm">Debates Fought</div>
            </div>
            <div className="w-px h-10 bg-[var(--border)]" />
            <div className="text-center">
              <div className="text-2xl font-display font-bold text-[var(--accent-primary)]">
                {stats.totalPlayers.toLocaleString()}
              </div>
              <div className="text-[var(--text-muted)] text-sm">Developers</div>
            </div>
            <div className="w-px h-10 bg-[var(--border)]" />
            <div className="text-center">
              <div className="text-2xl font-display font-bold text-[var(--accent-secondary)]">
                {stats.activeRooms}
              </div>
              <div className="text-[var(--text-muted)] text-sm">Active Now</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[var(--accent-primary)] text-[#0a0a0b] font-semibold text-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Create Room
            </button>
            <button
              onClick={() => setShowJoinModal(true)}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-transparent border-2 border-[var(--border-strong)] text-[var(--text-primary)] font-semibold text-lg hover:bg-[var(--bg-elevated)] transition-all flex items-center justify-center gap-2"
            >
              <LogIn size={20} />
              Join Room
            </button>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)] text-center mb-8">
          How It Works
        </h2>

        <div className="grid md:grid-cols-4 gap-6">
          {[
            {
              icon: Plus,
              title: 'Create Room',
              description: 'Pick a topic and choose your side',
            },
            {
              icon: LogIn,
              title: 'Invite Opponent',
              description: 'Share the link with a developer',
            },
            {
              icon: Trophy,
              title: 'Debate',
              description: 'Argue your case in real-time',
            },
            {
              icon: Eye,
              title: 'AI Judging',
              description: 'AI scores and declares winner',
            },
          ].map((step, index) => (
            <div
              key={step.title}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 text-center"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--accent-primary)]/10 mb-4">
                <step.icon className="w-6 h-6 text-[var(--accent-primary)]" />
              </div>
              <div className="text-[var(--accent-primary)] font-bold mb-2">Step {index + 1}</div>
              <h3 className="font-display font-semibold text-[var(--text-primary)] mb-2">
                {step.title}
              </h3>
              <p className="text-[var(--text-secondary)] text-sm">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Debates */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)] mb-6">
          Recent Public Debates
        </h2>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden">
          {[
            { topic: 'React vs Vue', forPlayer: 'AlexDev', againstPlayer: 'SarahCodes', winner: 'for', timeAgo: '2 min ago' },
            { topic: 'AWS vs GCP', forPlayer: 'CloudMaster', againstPlayer: 'DevOpsPro', winner: 'against', timeAgo: '15 min ago' },
            { topic: 'TypeScript vs JavaScript', forPlayer: 'TypeFan', againstPlayer: 'JSNinja', winner: 'for', timeAgo: '1 hour ago' },
          ].map((debate, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <div className="flex-1">
                <h3 className="font-medium text-[var(--text-primary)]">{debate.topic}</h3>
                <p className="text-[var(--text-secondary)] text-sm">
                  {debate.forPlayer} vs {debate.againstPlayer}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${debate.winner === 'for'
                  ? 'bg-[var(--accent-secondary)]/20 text-[var(--accent-secondary)]'
                  : 'bg-[var(--accent-danger)]/20 text-[var(--accent-danger)]'
                  }`}>
                  {debate.winner === 'for' ? debate.forPlayer : debate.againstPlayer} Won
                </span>
                <span className="text-[var(--text-muted)] text-sm flex items-center gap-1">
                  <Clock size={14} />
                  {debate.timeAgo}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onRoomCreated={handleRoomCreated}
      />
      <JoinRoomModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
      />
    </div>
  );
}
