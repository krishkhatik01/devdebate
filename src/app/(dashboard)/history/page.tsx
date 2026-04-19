'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { Session, ModeType, MODES } from '@/lib/types';
import HistoryItem from '@/components/HistoryItem';
import { Search, ArrowLeft, Filter } from 'lucide-react';
import { useModal } from '@/hooks/useModal';
import Modal from '@/components/ui/Modal';

export default function HistoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMode, setSelectedMode] = useState<ModeType | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const { modal, showConfirm, closeModal } = useModal();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'sessions', user.uid, 'chats'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionsData: Session[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        sessionsData.push({
          id: doc.id,
          mode: data.mode,
          title: data.title,
          messages: data.messages || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          userId: data.userId,
        });
      });
      setSessions(sessionsData);
      setFilteredSessions(sessionsData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    let filtered = sessions;

    if (searchQuery) {
      filtered = filtered.filter((s) =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedMode !== 'all') {
      filtered = filtered.filter((s) => s.mode === selectedMode);
    }

    setFilteredSessions(filtered);
  }, [searchQuery, selectedMode, sessions]);

  const handleDelete = async (sessionId: string) => {
    if (!user) return;
    showConfirm(
      'Delete Session',
      'Are you sure you want to delete this session? This cannot be undone.',
      async () => {
        try {
          await deleteDoc(doc(db, 'sessions', user.uid, 'chats', sessionId));
        } catch (error) {
          console.error('Error deleting session:', error);
        }
      },
      'danger'
    );
  };

  const handleSessionClick = () => {
    // Navigate back to main page with session data
    // For now, just navigate to main page
    router.push('/');
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedMode('all');
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-bg-secondary/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Chat</span>
          </button>
        </div>
        <h1 className="text-lg font-heading font-semibold text-text-primary">
          Session History
        </h1>
        <div className="w-24" /> {/* Spacer for centering */}
      </header>

      {/* Content */}
      <div className="p-6 max-w-4xl mx-auto">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sessions..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-bg-card border border-border text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-text-secondary" />
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value as ModeType | 'all')}
              className="px-4 py-3 rounded-xl bg-bg-card border border-border text-text-primary focus:outline-none focus:border-accent-cyan"
            >
              <option value="all">All Modes</option>
              {MODES.map((mode) => (
                <option key={mode.id} value={mode.id}>
                  {mode.label}
                </option>
              ))}
            </select>
            {(searchQuery || selectedMode !== 'all') && (
              <button
                onClick={clearFilters}
                className="px-4 py-3 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="glass rounded-xl p-4 border border-border">
            <p className="text-2xl font-bold text-text-primary">{sessions.length}</p>
            <p className="text-sm text-text-secondary">Total Sessions</p>
          </div>
          <div className="glass rounded-xl p-4 border border-border">
            <p className="text-2xl font-bold text-accent-cyan">
              {sessions.filter((s) => s.mode === 'chat').length}
            </p>
            <p className="text-sm text-text-secondary">Chats</p>
          </div>
          <div className="glass rounded-xl p-4 border border-border">
            <p className="text-2xl font-bold text-accent-purple">
              {sessions.filter((s) => s.mode === 'debate').length}
            </p>
            <p className="text-sm text-text-secondary">Debates</p>
          </div>
          <div className="glass rounded-xl p-4 border border-border">
            <p className="text-2xl font-bold text-accent-red">
              {sessions.filter((s) => s.mode === 'roast').length}
            </p>
            <p className="text-sm text-text-secondary">Roasts</p>
          </div>
        </div>

        {/* Sessions List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-accent-cyan/20 border-t-accent-cyan rounded-full animate-spin" />
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-bg-elevated flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-text-secondary" />
            </div>
            <h3 className="text-lg font-medium text-text-primary mb-2">
              No sessions found
            </h3>
            <p className="text-text-secondary">
              {sessions.length === 0
                ? 'Start using DevDebate to see your sessions here.'
                : 'Try adjusting your search or filters.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSessions.map((session) => (
              <HistoryItem
                key={session.id}
                session={session}
                onClick={() => handleSessionClick()}
                onDelete={() => handleDelete(session.id)}
              />
            ))}
          </div>
        )}
      </div>
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        onConfirm={modal.onConfirm}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
      />
    </div>
  );
}
