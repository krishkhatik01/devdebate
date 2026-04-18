export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export type ModeType = 'chat' | 'debate' | 'roast' | 'explain' | 'research' | 'optimize';

export interface Session {
  id: string;
  mode: ModeType;
  title: string;
  messages: Message[];
  createdAt: Date;
  userId: string;
}

export interface DebateResult {
  for: string;
  against: string;
  verdict: string;
}

export interface RoastResult {
  roast: string;
  fixed: string;
}

export interface ExplainResult {
  explanation: string;
}

export interface ResearchResult {
  report: string;
}

export interface OptimizeResult {
  issues: string;
  optimized: string;
}

export interface ModeConfig {
  id: ModeType;
  label: string;
  icon: string;
  description: string;
  color: string;
}

export const MODES: ModeConfig[] = [
  {
    id: 'chat',
    label: 'Smart Chat',
    icon: 'MessageSquare',
    description: 'Standard conversational AI for dev topics',
    color: 'cyan',
  },
  {
    id: 'debate',
    label: 'Debate Mode',
    icon: 'Swords',
    description: 'AI argues both sides of any tech topic',
    color: 'purple',
  },
  {
    id: 'roast',
    label: 'Code Roast',
    icon: 'Flame',
    description: 'Brutally honest code review',
    color: 'red',
  },
  {
    id: 'explain',
    label: 'Explain Mode',
    icon: 'Brain',
    description: 'Learn any concept with ELI5 + technical depth',
    color: 'green',
  },
  {
    id: 'research',
    label: 'Deep Research',
    icon: 'Search',
    description: 'Comprehensive tech research reports',
    color: 'amber',
  },
  {
    id: 'optimize',
    label: 'Optimize Code',
    icon: 'Zap',
    description: 'Performance optimization analysis',
    color: 'cyan',
  },
];
