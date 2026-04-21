'use client';

import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Search, Tag, Clock } from 'lucide-react';
import Link from 'next/link';

export default function KnowledgePage() {
  const params = useParams();
  const roomId = params.roomId as string;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="h-16 border-b border-[var(--border)] bg-[var(--bg-secondary)] flex items-center px-4">
        <Link
          href={`/teams/${roomId}`}
          className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] mr-4"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-semibold text-[var(--text-primary)]">Knowledge Base</h1>
          <p className="text-xs text-[var(--text-muted)]">Team documentation & decisions</p>
        </div>
        <button className="ml-auto px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-[#0a0a0b] font-medium hover:brightness-110 transition-all flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Entry
        </button>
      </header>

      {/* Search & Filter */}
      <div className="p-4 border-b border-[var(--border)]">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search knowledge base..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
          />
        </div>
      </div>

      {/* Knowledge Entries */}
      <main className="p-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Entry 1 */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs">AI Generated</span>
            </div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">Project Architecture Decision</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4 line-clamp-3">
              We decided to use Next.js with Firebase for real-time features. The team agreed on using
              Tailwind CSS for styling and Framer Motion for animations...
            </p>
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <div className="flex items-center gap-2">
                <Tag className="w-3 h-3" />
                <span>architecture, decisions</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>2 days ago</span>
              </div>
            </div>
          </motion.div>

          {/* Entry 2 */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] text-xs">Pinned</span>
            </div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">API Documentation</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4 line-clamp-3">
              Base URL: https://api.devdebate.com/v1
              Authentication: Bearer token required
              Rate limits: 100 requests per minute...
            </p>
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <div className="flex items-center gap-2">
                <Tag className="w-3 h-3" />
                <span>api, docs</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>1 week ago</span>
              </div>
            </div>
          </motion.div>

          {/* Entry 3 */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400 text-xs">Manual</span>
            </div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">Team Guidelines</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4 line-clamp-3">
              Code review required for all PRs. Use conventional commits.
              Write tests for critical paths. Document public APIs...
            </p>
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <div className="flex items-center gap-2">
                <Tag className="w-3 h-3" />
                <span>guidelines, process</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>3 days ago</span>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
