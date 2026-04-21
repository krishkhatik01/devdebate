// DevDebate Teams - TypeScript Types

export type UserRole = 'owner' | 'admin' | 'member';
export type MessageType = 'text' | 'code' | 'image' | 'task' | 'summary' | 'ai';
export type TaskStatus = 'todo' | 'inprogress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface TeamUser {
  userId: string;
  name: string;
  emoji: string;
  color: string;
  role: UserRole;
  online?: boolean;
  lastSeen?: number;
  typing?: boolean;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: number;
  password: string | null;
  maxMembers: number;
  expiresAt: number;
  settings: RoomSettings;
  memberCount?: number;
}

export interface RoomSettings {
  aiAutoSuggest: boolean;
  aiSummarize: boolean;
  allowCode: boolean;
  allowTasks: boolean;
}

export interface ReplyTo {
  messageId: string;
  text: string;
  senderName: string;
}

export interface Reactions {
  [emoji: string]: string[];
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderColor: string;
  senderEmoji: string;
  timestamp: number;
  isAI: boolean;
  type: MessageType;
  replyTo: ReplyTo | null;
  reactions: Reactions;
  edited: boolean;
  editedAt: number | null;
  pinned: boolean;
  codeLanguage?: string;
  aiReview?: string;
}

export interface Presence {
  userId: string;
  name: string;
  emoji: string;
  color: string;
  online: boolean;
  lastSeen: number;
  typing: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedName: string;
  assignedEmoji: string;
  assignedColor: string;
  createdBy: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: number;
  dueDate: number | null;
  extractedFromMessage: string | null;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  source: 'ai_generated' | 'pinned_message' | 'manual';
  createdAt: number;
  tags: string[];
  createdBy: string;
}

export interface JoinRoomData {
  roomId: string;
  password?: string;
}

export interface CreateRoomData {
  name: string;
  description: string;
  password?: string;
}

export interface AIMember {
  userId: 'ai-devbot';
  name: 'DevBot';
  emoji: '🤖';
  color: '#8B5CF6';
  role: 'member';
  isAI: true;
}

export const AI_MEMBER: AIMember = {
  userId: 'ai-devbot',
  name: 'DevBot',
  emoji: '🤖',
  color: '#8B5CF6',
  role: 'member',
  isAI: true,
};

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  aiAutoSuggest: true,
  aiSummarize: true,
  allowCode: true,
  allowTasks: true,
};

export const USER_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Light Salmon
  '#98D8C8', // Mint
  '#F7DC6F', // Yellow
  '#BB8FCE', // Purple
  '#85C1E2', // Light Blue
  '#F8B739', // Orange
  '#6C5CE7', // Indigo
];

export const USER_EMOJIS = [
  '🚀', '⭐', '🔥', '💎', '🎯', '⚡', '🌟', '💪', '🎨', '🎸',
  '🏆', '🌈', '🦄', '🐱', '🐶', '🦊', '🐼', '🐨', '🦁', '🐯',
];
