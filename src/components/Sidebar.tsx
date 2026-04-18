'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { MODES, ModeType } from '@/lib/types';
import ThemeToggle from './ThemeToggle';
import {
  MessageSquare,
  Swords,
  Flame,
  Brain,
  Search,
  Zap,
  History,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Terminal,
  Users,
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  MessageSquare,
  Swords,
  Flame,
  Brain,
  Search,
  Zap,
  Users,
};

interface SidebarProps {
  currentMode: ModeType;
  onModeChange: (mode: ModeType) => void;
}

export default function Sidebar({ currentMode, onModeChange }: SidebarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleModeClick = (modeId: ModeType) => {
    onModeChange(modeId);
    setMobileOpen(false);
  };

  const handleHistoryClick = () => {
    router.push('/history');
    setMobileOpen(false);
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-4 border-b border-[var(--border)]">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-strong)] flex items-center justify-center flex-shrink-0">
            <Terminal size={16} className="text-[var(--accent-primary)]" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-display font-bold text-lg text-[var(--text-primary)]">DevDebate</h1>
              <p className="text-[11px] text-[var(--text-muted)]">AI Dev Tools</p>
            </div>
          )}
        </div>
      </div>

      {/* Modes */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className={`px-4 mb-2 ${collapsed ? 'text-center' : ''}`}>
          {!collapsed && (
            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.1em]">Modes</p>
          )}
        </div>
        <nav className="space-y-0.5 px-2">
          {MODES.map((mode) => {
            const Icon = iconMap[mode.icon];
            const isActive = currentMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => handleModeClick(mode.id)}
                className={`w-full flex items-center gap-3 px-3 h-10 rounded-lg transition-all ${isActive
                  ? 'bg-[var(--bg-elevated)] border-l-2 border-[var(--accent-primary)] text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]/50 hover:text-[var(--text-primary)]'
                  } ${collapsed ? 'justify-center' : ''}`}
              >
                <Icon size={16} className={isActive ? 'text-[var(--accent-primary)]' : ''} />
                {!collapsed && (
                  <span className="text-sm font-medium">{mode.label}</span>
                )}
                {!collapsed && mode.id === 'debate' && (
                  <span className="ml-auto text-[10px] bg-[#1a1a2e] text-[var(--accent-primary)] px-2 py-0.5 rounded-full">
                    Featured
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Arena */}
        <div className={`px-4 mt-6 mb-2 ${collapsed ? 'text-center' : ''}`}>
          {!collapsed && (
            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.1em]">Multiplayer</p>
          )}
        </div>
        <div className="px-2">
          <button
            onClick={() => router.push('/arena')}
            className={`w-full flex items-center gap-3 px-3 h-10 rounded-lg transition-all ${pathname === '/arena' || pathname.startsWith('/arena/')
              ? 'bg-[var(--bg-elevated)] border-l-2 border-[var(--accent-primary)] text-[var(--text-primary)]'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]/50 hover:text-[var(--text-primary)]'
              } ${collapsed ? 'justify-center' : ''}`}
          >
            <Users size={16} className={pathname === '/arena' || pathname.startsWith('/arena/') ? 'text-[var(--accent-primary)]' : ''} />
            {!collapsed && (
              <>
                <span className="text-sm font-medium">Live Arena</span>
                <span className="ml-auto text-[10px] bg-[var(--accent-danger)] text-white px-2 py-0.5 rounded-full animate-pulse">
                  NEW
                </span>
              </>
            )}
          </button>
        </div>

        {/* History */}
        <div className={`px-4 mt-6 mb-2 ${collapsed ? 'text-center' : ''}`}>
          {!collapsed && (
            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.1em]">History</p>
          )}
        </div>
        <div className="px-2">
          <button
            onClick={handleHistoryClick}
            className={`w-full flex items-center gap-3 px-3 h-10 rounded-lg transition-all ${pathname === '/history'
              ? 'bg-[var(--bg-elevated)] border-l-2 border-[var(--accent-primary)] text-[var(--text-primary)]'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]/50 hover:text-[var(--text-primary)]'
              } ${collapsed ? 'justify-center' : ''}`}
          >
            <History size={16} />
            {!collapsed && <span className="text-sm font-medium">All History</span>}
          </button>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="p-4 border-t border-[var(--border)]">
        <div className="flex items-center justify-between mb-3">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent-danger)] hover:bg-[var(--bg-elevated)] transition-all"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>

        {user && !collapsed && (
          <div className="flex items-center gap-2 pt-3 border-t border-[var(--border)]">
            <div className="w-7 h-7 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[var(--accent-primary)] font-medium text-xs">
                {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                {user.displayName || 'User'}
              </p>
              <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center"
      >
        <Menu size={20} className="text-[var(--text-primary)]" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed left-0 top-0 h-full bg-[var(--bg-secondary)] border-r border-[var(--border)] z-50 transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'
          } w-[260px] flex flex-col`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex fixed left-0 top-0 h-full bg-[var(--bg-secondary)] border-r border-[var(--border)] z-40 transition-all duration-300 flex-col ${collapsed ? 'w-[80px]' : 'w-[260px]'
          }`}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center hover:border-[var(--accent-primary)]/50 transition-colors"
        >
          {collapsed ? (
            <ChevronRight size={14} className="text-[var(--text-secondary)]" />
          ) : (
            <ChevronLeft size={14} className="text-[var(--text-secondary)]" />
          )}
        </button>
        {sidebarContent}
      </aside>
    </>
  );
}
