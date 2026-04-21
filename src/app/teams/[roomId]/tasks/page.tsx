'use client';

import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Calendar, User, Flag } from 'lucide-react';
import Link from 'next/link';

export default function TasksPage() {
  const params = useParams();
  const roomId = params.roomId as string;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="h-16 border-b border-[var(--border)] bg-[var(--bg-secondary)] flex items-center px-4">
        <Link
          href={`/teams/${roomId}`}
          className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-2 rounded-lg hover:bg-[var(--bg-elevated)] mr-4"
        >
          <ArrowLeft size={20} />
          <span className="text-sm">Back</span>
        </Link>
        <div>
          <h1 className="font-semibold text-[var(--text-primary)]">Tasks</h1>
          <p className="text-xs text-[var(--text-muted)]">Manage team tasks</p>
        </div>
        <button className="ml-auto px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-[#0a0a0b] font-medium hover:brightness-110 transition-all flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </header>

      {/* Task Board */}
      <main className="p-6">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Todo Column */}
          <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
            <div className="p-4 border-b border-[var(--border)]">
              <h3 className="font-medium text-[var(--text-primary)] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-500" />
                To Do
              </h3>
            </div>
            <div className="p-4 space-y-3">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] cursor-pointer"
              >
                <h4 className="font-medium text-[var(--text-primary)] mb-2">Setup project repository</h4>
                <p className="text-sm text-[var(--text-muted)] mb-3">Initialize Git repo and add README</p>
                <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Due tomorrow
                  </span>
                  <span className="flex items-center gap-1">
                    <Flag className="w-3 h-3 text-red-500" />
                    High
                  </span>
                </div>
              </motion.div>
            </div>
          </div>

          {/* In Progress Column */}
          <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
            <div className="p-4 border-b border-[var(--border)]">
              <h3 className="font-medium text-[var(--text-primary)] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)]" />
                In Progress
              </h3>
            </div>
            <div className="p-4 space-y-3">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] cursor-pointer"
              >
                <h4 className="font-medium text-[var(--text-primary)] mb-2">Design database schema</h4>
                <p className="text-sm text-[var(--text-muted)] mb-3">Create ERD and define relationships</p>
                <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Assigned to John
                  </span>
                  <span className="flex items-center gap-1">
                    <Flag className="w-3 h-3 text-yellow-500" />
                    Medium
                  </span>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Done Column */}
          <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
            <div className="p-4 border-b border-[var(--border)]">
              <h3 className="font-medium text-[var(--text-primary)] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Done
              </h3>
            </div>
            <div className="p-4 space-y-3">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] cursor-pointer opacity-60"
              >
                <h4 className="font-medium text-[var(--text-primary)] mb-2">Project kickoff meeting</h4>
                <p className="text-sm text-[var(--text-muted)] mb-3">Initial team sync completed</p>
                <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Completed yesterday
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
