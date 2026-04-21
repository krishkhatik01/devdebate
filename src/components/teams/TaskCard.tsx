'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Calendar, User, Trash2, Edit2 } from 'lucide-react';
import type { Task, TeamUser } from '@/lib/teams/types';
import { formatDate } from '@/lib/teams/utils';

interface TaskCardProps {
  task: Task;
  members: TeamUser[];
  currentUser: TeamUser;
  onEdit?: () => void;
  onDelete?: () => void;
  isDragging?: boolean;
}

const PRIORITY_COLORS = {
  low: 'bg-gray-500/20 text-gray-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  high: 'bg-orange-500/20 text-orange-400',
  urgent: 'bg-red-500/20 text-red-400',
};

export default function TaskCard({
  task,
  members,
  onEdit,
  onDelete,
  isDragging,
}: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const assignedMember = members.find((m) => m.userId === task.assignedTo);

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3 cursor-grab active:cursor-grabbing group ${isDragging ? 'opacity-50 rotate-2 shadow-xl' : ''
        }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium text-[var(--text-primary)] line-clamp-2">
          {task.title}
        </h4>
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
            className="p-1 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            className="p-1 rounded hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-500"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-2">
          {task.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Priority */}
          {task.priority && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${PRIORITY_COLORS[task.priority]}`}>
              {task.priority}
            </span>
          )}

          {/* Due Date */}
          {task.dueDate && (
            <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
              <Calendar className="w-3 h-3" />
              {formatDate(task.dueDate)}
            </span>
          )}
        </div>

        {/* Assignee */}
        {assignedMember ? (
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
            style={{ backgroundColor: assignedMember.color + '20' }}
            title={assignedMember.name}
          >
            {assignedMember.emoji}
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center">
            <User className="w-3 h-3 text-[var(--text-muted)]" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
