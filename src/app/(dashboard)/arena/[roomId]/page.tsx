'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  listenToRoom,
  joinRoom,
  submitArgument,
  updateRoundScores,
  startNextRound,
  setWinner,
  incrementSpectators,
  decrementSpectators,
  updateRoomStatus,
  RoomData,
} from '@/lib/arena';
import ScoreBoard from '@/components/arena/ScoreBoard';
import RoundTimer from '@/components/arena/RoundTimer';
import { Users, ArrowLeft, Copy, Check, Trophy, Share2, Home } from 'lucide-react';

interface JudgeResult {
  forScore: number;
  againstScore: number;
  forFeedback: string;
  againstFeedback: string;
  roundWinner: 'for' | 'against' | 'draw';
  verdict: string;
}

export default function DebateRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const roomId = params.roomId as string;

  const [room, setRoom] = useState<RoomData | null>(null);
  const [mySide, setMySide] = useState<'for' | 'against' | 'spectator' | null>(null);
  const [argument, setArgument] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [judgeResult, setJudgeResult] = useState<JudgeResult | null>(null);
  const [isJudging, setIsJudging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  // Listen to room updates
  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = listenToRoom(roomId, (roomData) => {
      if (!roomData) {
        setError('Room not found or expired');
        return;
      }
      setRoom(roomData);
    });

    return () => unsubscribe();
  }, [roomId]);

  // Determine my side
  useEffect(() => {
    if (!room || !user) return;

    if (room.players.for?.uid === user.uid) {
      setMySide('for');
    } else if (room.players.against?.uid === user.uid) {
      setMySide('against');
    } else {
      setMySide('spectator');
      incrementSpectators(roomId);
      return () => {
        decrementSpectators(roomId);
      };
    }
  }, [room, user, roomId]);

  // Handle joining room
  useEffect(() => {
    if (!room || !user || mySide) return;

    const tryJoin = async () => {
      if (!room.players.for) {
        const success = await joinRoom(roomId, { uid: user.uid, name: user.displayName || 'Player' }, 'for');
        if (success) {
          setMySide('for');
          if (room.players.against) {
            await updateRoomStatus(roomId, 'active');
          }
        }
      } else if (!room.players.against) {
        const success = await joinRoom(roomId, { uid: user.uid, name: user.displayName || 'Player' }, 'against');
        if (success) {
          setMySide('against');
          await updateRoomStatus(roomId, 'active');
        }
      } else {
        setMySide('spectator');
        incrementSpectators(roomId);
      }
    };

    tryJoin();
  }, [room, user, roomId, mySide]);

  // AI Judging
  useEffect(() => {
    if (!room || !mySide || mySide === 'spectator') return;

    const currentRoundKey = `round${room.currentRound}` as keyof RoomData['rounds'];
    const currentRound = room.rounds[currentRoundKey];

    if (
      currentRound.forArgument &&
      currentRound.againstArgument &&
      currentRound.status === 'arguing' &&
      mySide === 'for'
    ) {
      setIsJudging(true);

      const callJudge = async () => {
        try {
          const response = await fetch('/api/arena/judge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              topic: room.topic,
              round: room.currentRound,
              roundType: room.currentRound === 1 ? 'opening' : room.currentRound === 2 ? 'counter' : 'closing',
              forArgument: currentRound.forArgument,
              againstArgument: currentRound.againstArgument,
            }),
          });

          if (response.ok) {
            const result: JudgeResult = await response.json();
            setJudgeResult(result);
            await updateRoundScores(roomId, room.currentRound, {
              forScore: result.forScore,
              againstScore: result.againstScore,
              forFeedback: result.forFeedback,
              againstFeedback: result.againstFeedback,
              aiVerdict: result.verdict,
            });
          }
        } catch (error) {
          console.error('Judging error:', error);
        } finally {
          setIsJudging(false);
        }
      };

      callJudge();
    }
  }, [room, mySide, roomId]);

  const handleSubmitArgument = async () => {
    if (!argument.trim() || !room || !mySide || mySide === 'spectator') return;

    setIsSubmitting(true);
    await submitArgument(roomId, room.currentRound, mySide, argument.trim());
    setArgument('');
    setIsSubmitting(false);
  };

  const handleNextRound = async () => {
    if (!room) return;

    if (room.currentRound < room.totalRounds) {
      await startNextRound(roomId, room.currentRound + 1);
      setJudgeResult(null);
    } else {
      // Final winner
      const forTotal = room.rounds.round1.forScore + room.rounds.round2.forScore + room.rounds.round3.forScore;
      const againstTotal = room.rounds.round1.againstScore + room.rounds.round2.againstScore + room.rounds.round3.againstScore;

      const winner = forTotal > againstTotal ? 'for' : againstTotal > forTotal ? 'against' : 'draw';
      await setWinner(roomId, winner);
    }
  };

  const copyLink = () => {
    const url = `${window.location.origin}/arena/${roomId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRoundType = (round: number) => {
    if (round === 1) return 'Opening Statements';
    if (round === 2) return 'Counter Arguments';
    return 'Closing Statements';
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)] mb-4">{error}</h1>
          <button
            onClick={() => router.push('/arena')}
            className="px-6 py-3 rounded-xl bg-[var(--accent-primary)] text-[#0a0a0b] font-semibold"
          >
            Back to Arena
          </button>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--accent-primary)]/20 border-t-[var(--accent-primary)] rounded-full animate-spin" />
          <p className="text-[var(--text-secondary)]">Loading room...</p>
        </div>
      </div>
    );
  }

  const currentRoundKey = `round${room.currentRound}` as keyof RoomData['rounds'];
  const currentRound = room.rounds[currentRoundKey];
  const isWaiting = room.status === 'waiting';
  const isFinished = room.status === 'finished';

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Top Bar */}
      <header className="h-[60px] border-b border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/arena')}
            className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors"
          >
            <ArrowLeft size={20} className="text-[var(--text-secondary)]" />
          </button>
          <div>
            <h1 className="font-display font-semibold text-[var(--text-primary)] truncate max-w-[200px] lg:max-w-md">
              {room.topic}
            </h1>
            <p className="text-[var(--text-muted)] text-xs">
              Round {room.currentRound} of {room.totalRounds} • {getRoundType(room.currentRound)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-[var(--text-secondary)] text-sm">
            <Users size={16} />
            <span>{room.spectators} watching</span>
          </div>
          <button
            onClick={copyLink}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--bg-card)] transition-colors text-sm"
          >
            {copied ? <Check size={16} className="text-[var(--accent-secondary)]" /> : <Copy size={16} />}
            <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 lg:p-6 max-w-7xl mx-auto">
        {/* Waiting Screen */}
        {isWaiting && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-[var(--accent-primary)]/20 border-t-[var(--accent-primary)] rounded-full animate-spin mb-6" />
            <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)] mb-2">
              Waiting for Opponent
            </h2>
            <p className="text-[var(--text-secondary)] mb-6 text-center max-w-md">
              Share this link with your opponent to start the debate
            </p>
            <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-3">
              <code className="text-[var(--accent-primary)]">{`${typeof window !== 'undefined' ? window.location.origin : ''}/arena/${roomId}`}</code>
              <button
                onClick={copyLink}
                className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors"
              >
                {copied ? <Check size={18} className="text-[var(--accent-secondary)]" /> : <Copy size={18} />}
              </button>
            </div>
          </div>
        )}

        {/* Active Debate */}
        {!isWaiting && !isFinished && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Panel - FOR */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[var(--accent-secondary)]/20 flex items-center justify-center">
                  <span className="text-[var(--accent-secondary)] font-bold">F</span>
                </div>
                <div>
                  <div className="text-[var(--accent-secondary)] font-semibold">FOR</div>
                  <div className="text-[var(--text-secondary)] text-sm">
                    {room.players.for?.name || 'Waiting...'}
                  </div>
                </div>
              </div>

              {currentRound.forArgument ? (
                <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
                  <p className="text-[var(--text-primary)] whitespace-pre-wrap">{currentRound.forArgument}</p>
                </div>
              ) : (
                <div className="bg-[var(--bg-secondary)] rounded-xl p-4 text-[var(--text-muted)] text-center">
                  {mySide === 'for' ? 'Type your argument below...' : 'Waiting for argument...'}
                </div>
              )}

              {currentRound.status === 'done' && (
                <div className="mt-4 p-3 bg-[var(--accent-secondary)]/10 rounded-xl">
                  <div className="text-[var(--accent-secondary)] font-bold text-lg">{currentRound.forScore}/10</div>
                  <p className="text-[var(--text-secondary)] text-sm">{judgeResult?.forFeedback}</p>
                </div>
              )}
            </div>

            {/* Center - Timer & VS */}
            <div className="space-y-4">
              <RoundTimer
                duration={room.timePerRound}
                isActive={currentRound.status === 'arguing' && !currentRound.forArgument && !currentRound.againstArgument}
                onTimeUp={() => { }}
              />

              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 text-center">
                <div className="text-4xl font-display font-bold text-[var(--text-muted)] mb-2">VS</div>
                <div className="text-[var(--text-secondary)]">{getRoundType(room.currentRound)}</div>
              </div>

              {isJudging && (
                <div className="bg-[var(--bg-card)] border border-[var(--accent-primary)]/30 rounded-2xl p-6 text-center">
                  <div className="w-10 h-10 border-4 border-[var(--accent-primary)]/20 border-t-[var(--accent-primary)] rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-[var(--accent-primary)] font-medium">AI is judging...</p>
                </div>
              )}

              {currentRound.status === 'done' && mySide !== 'spectator' && (
                <button
                  onClick={handleNextRound}
                  className="w-full py-3 rounded-xl bg-[var(--accent-primary)] text-[#0a0a0b] font-semibold hover:brightness-110 transition-all"
                >
                  {room.currentRound < room.totalRounds ? 'Next Round' : 'See Final Results'}
                </button>
              )}
            </div>

            {/* Right Panel - AGAINST */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[var(--accent-danger)]/20 flex items-center justify-center">
                  <span className="text-[var(--accent-danger)] font-bold">A</span>
                </div>
                <div>
                  <div className="text-[var(--accent-danger)] font-semibold">AGAINST</div>
                  <div className="text-[var(--text-secondary)] text-sm">
                    {room.players.against?.name || 'Waiting...'}
                  </div>
                </div>
              </div>

              {currentRound.againstArgument ? (
                <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
                  <p className="text-[var(--text-primary)] whitespace-pre-wrap">{currentRound.againstArgument}</p>
                </div>
              ) : (
                <div className="bg-[var(--bg-secondary)] rounded-xl p-4 text-[var(--text-muted)] text-center">
                  {mySide === 'against' ? 'Type your argument below...' : 'Waiting for argument...'}
                </div>
              )}

              {currentRound.status === 'done' && (
                <div className="mt-4 p-3 bg-[var(--accent-danger)]/10 rounded-xl">
                  <div className="text-[var(--accent-danger)] font-bold text-lg">{currentRound.againstScore}/10</div>
                  <p className="text-[var(--text-secondary)] text-sm">{judgeResult?.againstFeedback}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Argument Input */}
        {!isWaiting && !isFinished && mySide !== 'spectator' && currentRound.status === 'arguing' && (
          <div className="mt-6 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[var(--text-secondary)] text-sm">
                Your argument ({argument.length}/500)
              </span>
              {currentRound[`${mySide}Argument` as keyof typeof currentRound] && (
                <span className="text-[var(--accent-secondary)] text-sm flex items-center gap-1">
                  <Check size={14} /> Submitted
                </span>
              )}
            </div>
            <textarea
              value={argument}
              onChange={(e) => setArgument(e.target.value.slice(0, 500))}
              placeholder="Write your argument here..."
              disabled={!!currentRound[`${mySide}Argument` as keyof typeof currentRound]}
              className="w-full h-32 px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-strong)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all resize-none disabled:opacity-50"
            />
            <button
              onClick={handleSubmitArgument}
              disabled={argument.length < 50 || !!currentRound[`${mySide}Argument` as keyof typeof currentRound] || isSubmitting}
              className="mt-3 w-full py-3 rounded-xl bg-[var(--accent-primary)] text-[#0a0a0b] font-semibold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : argument.length < 50 ? `Need ${50 - argument.length} more characters` : 'Submit Argument'}
            </button>
          </div>
        )}

        {/* Finished Screen */}
        {isFinished && (
          <div className="max-w-2xl mx-auto py-12">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--accent-warning)]/20 mb-4">
                <Trophy className="w-10 h-10 text-[var(--accent-warning)]" />
              </div>
              <h2 className="font-display text-3xl font-bold text-[var(--text-primary)] mb-2">
                Debate Complete!
              </h2>
              <p className="text-[var(--text-secondary)]">
                {room.winner === 'draw'
                  ? "It's a draw!"
                  : `${room.winner === 'for' ? room.players.for?.name : room.players.against?.name} wins!`}
              </p>
            </div>

            <ScoreBoard
              forScore={room.totalScore.for}
              againstScore={room.totalScore.against}
              forName={room.players.for?.name || 'FOR'}
              againstName={room.players.against?.name || 'AGAINST'}
              isAnimating={true}
            />

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.push('/arena')}
                className="flex-1 py-3 rounded-xl bg-[var(--bg-elevated)] text-[var(--text-primary)] font-semibold hover:bg-[var(--bg-card)] transition-all flex items-center justify-center gap-2"
              >
                <Home size={18} />
                Back to Arena
              </button>
              <button
                onClick={copyLink}
                className="flex-1 py-3 rounded-xl bg-[var(--accent-primary)] text-[#0a0a0b] font-semibold hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                <Share2 size={18} />
                {copied ? 'Copied!' : 'Share Result'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
