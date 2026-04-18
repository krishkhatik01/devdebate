'use client';

import { Session, MODES } from '@/lib/types';
import {
  MessageSquare,
  Swords,
  Flame,
  Brain,
  Search,
  Zap,
  Trash2,
  Clock,
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  MessageSquare,
  Swords,
  Flame,
  Brain,
  Search,
  Zap,
};

interface HistoryItemProps {
  session: Session;
  onClick: () => void;
  onDelete: () => void;
}

export default function HistoryItem({ session, onClick, onDelete }: HistoryItemProps) {
  const mode = MODES.find((m) => m.id === session.mode);
  const Icon = mode ? iconMap[mode.icon] : MessageSquare;

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="group flex items-center gap-3 p-3 rounded-xl glass border border-border hover:border-accent-cyan/30 transition-all cursor-pointer">
      <button onClick={onClick} className="flex-1 flex items-center gap-3 min-w-0">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${mode?.color === 'purple' ? 'bg-accent-purple/10 text-accent-purple' :
            mode?.color === 'red' ? 'bg-accent-red/10 text-accent-red' :
              mode?.color === 'green' ? 'bg-accent-green/10 text-accent-green' :
                mode?.color === 'amber' ? 'bg-accent-amber/10 text-accent-amber' :
                  'bg-accent-cyan/10 text-accent-cyan'
          }`}>
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium text-text-primary truncate">
            {session.title}
          </p>
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <span>{mode?.label}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(session.createdAt)}
            </span>
            <span>•</span>
            <span>{session.messages.length} messages</span>
          </div>
        </div>
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-text-secondary hover:text-accent-red hover:bg-accent-red/10 transition-all"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
