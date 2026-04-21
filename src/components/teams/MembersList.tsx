'use client';

import { motion } from 'framer-motion';
import { Crown, Shield, User } from 'lucide-react';
import type { Presence, TeamUser } from '@/lib/teams/types';
import { AI_MEMBER } from '@/lib/teams/types';
import { formatLastSeen } from '@/lib/teams/utils';

interface MembersListProps {
  members: Presence[];
  currentUser: TeamUser;
  aiTyping?: boolean;
}

const ROLE_ICONS = {
  owner: Crown,
  admin: Shield,
  member: User,
};

const ROLE_COLORS = {
  owner: 'text-yellow-500',
  admin: 'text-blue-500',
  member: 'text-[var(--text-muted)]',
};

export default function MembersList({ members, currentUser, aiTyping }: MembersListProps) {
  const onlineMembers = members.filter((m) => m.online && m.userId !== currentUser.userId);
  const offlineMembers = members.filter((m) => !m.online && m.userId !== currentUser.userId);

  // Sort by role (owner first, then admin, then member)
  const sortByRole = (a: Presence, b: Presence) => {
    const roleOrder: Record<string, number> = { owner: 0, admin: 1, member: 2 };
    return (roleOrder[(a as Presence & { role?: string }).role || ''] ?? 3) - (roleOrder[(b as Presence & { role?: string }).role || ''] ?? 3);
  };

  const sortedOnline = [...onlineMembers].sort(sortByRole);
  const sortedOffline = [...offlineMembers].sort(sortByRole);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)]">
        <h3 className="font-semibold text-[var(--text-primary)]">Members</h3>
        <p className="text-xs text-[var(--text-muted)]">
          {onlineMembers.length + 1} online
        </p>
      </div>

      {/* Members List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* AI Member */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors">
          <div className="relative">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
              style={{ backgroundColor: AI_MEMBER.color + '20' }}
            >
              {AI_MEMBER.emoji}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[var(--bg-secondary)]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                {AI_MEMBER.name}
              </p>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                AI
              </span>
            </div>
            <p className="text-xs text-green-500">
              {aiTyping ? 'Thinking...' : 'Always online'}
            </p>
          </div>
        </div>

        {/* Current User */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/20">
          <div className="relative">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
              style={{ backgroundColor: currentUser.color + '20' }}
            >
              {currentUser.emoji}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[var(--bg-secondary)]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                {currentUser.name}
              </p>
              <span className="text-[10px] text-[var(--text-muted)]">(You)</span>
            </div>
            <p className="text-xs text-green-500">Online</p>
          </div>
        </div>

        {/* Online Members */}
        {sortedOnline.length > 0 && (
          <>
            <div className="px-3 py-2 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
              Online — {sortedOnline.length}
            </div>
            {sortedOnline.map((member) => {
              const role = (member as Presence & { role?: string }).role || 'member';
              const RoleIcon = ROLE_ICONS[role as keyof typeof ROLE_ICONS] || User;
              return (
                <motion.div
                  key={member.userId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors"
                >
                  <div className="relative">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                      style={{ backgroundColor: member.color + '20' }}
                    >
                      {member.emoji}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[var(--bg-secondary)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {member.name}
                      </p>
                      <RoleIcon className={`w-3 h-3 ${ROLE_COLORS[role as keyof typeof ROLE_COLORS] || ROLE_COLORS.member}`} />
                    </div>
                    <p className="text-xs text-green-500">
                      {member.typing ? 'Typing...' : 'Online'}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </>
        )}

        {/* Offline Members */}
        {sortedOffline.length > 0 && (
          <>
            <div className="px-3 py-2 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
              Offline — {sortedOffline.length}
            </div>
            {sortedOffline.map((member) => {
              const role = (member as Presence & { role?: string }).role || 'member';
              const RoleIcon = ROLE_ICONS[role as keyof typeof ROLE_ICONS] || User;
              return (
                <motion.div
                  key={member.userId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors opacity-60"
                >
                  <div className="relative">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                      style={{ backgroundColor: member.color + '20' }}
                    >
                      {member.emoji}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-gray-500 border-2 border-[var(--bg-secondary)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {member.name}
                      </p>
                      <RoleIcon className={`w-3 h-3 ${ROLE_COLORS[role as keyof typeof ROLE_COLORS] || ROLE_COLORS.member}`} />
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">
                      {formatLastSeen(member.lastSeen)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
