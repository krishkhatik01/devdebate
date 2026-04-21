// DevDebate Teams - Utilities

import { USER_COLORS, USER_EMOJIS } from './types';

// Generate unique 6-digit room ID (e.g., ABC123)
export const generateRoomId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Generate random room password (6 digits)
export const generateRoomPassword = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate unique user ID
export const generateUserId = (): string => {
  return 'user_' + Math.random().toString(36).substring(2, 15);
};

// Get random color for user
export const getRandomColor = (): string => {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
};

// Get random emoji for user
export const getRandomEmoji = (): string => {
  return USER_EMOJIS[Math.floor(Math.random() * USER_EMOJIS.length)];
};

// Room expiry (7 days from now)
export const getRoomExpiry = (): number => {
  return Date.now() + 7 * 24 * 60 * 60 * 1000;
};

// Format timestamp to readable time
export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

// Format timestamp to readable date
export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return formatTime(timestamp);
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
};

// Format "last seen" text
export const formatLastSeen = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
};

// Sanitize user input
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '')
    .trim()
    .substring(0, 2000);
};

// Truncate text
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Check if message contains @AI mention
export const containsAIMention = (text: string): boolean => {
  return text.toLowerCase().includes('@ai');
};

// Extract AI command from message
export const extractAICommand = (text: string): { command: string; content: string } | null => {
  const match = text.match(/@ai\s+(\w+)(?:\s+(.*))?/i);
  if (match) {
    return {
      command: match[1].toLowerCase(),
      content: match[2] || '',
    };
  }
  return null;
};

// Detect if text looks like code
export const looksLikeCode = (text: string): boolean => {
  const codeIndicators = [
    /^(const|let|var|function|class|import|export)\s/,
    /^(def|class|import|from)\s/,
    /[{};]$/,
    /^(if|for|while|return)\s/,
    /```/,
  ];
  return codeIndicators.some(pattern => pattern.test(text));
};

// Get language from code block
export const detectCodeLanguage = (text: string): string => {
  const match = text.match(/```(\w+)/);
  return match ? match[1] : 'javascript';
};

// LocalStorage helpers
export const storage = {
  getUser: () => {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem('devdebate_teams_user');
    return data ? JSON.parse(data) : null;
  },
  setUser: (user: unknown) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('devdebate_teams_user', JSON.stringify(user));
  },
  getJoinedRooms: (): string[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('devdebate_teams_rooms');
    return data ? JSON.parse(data) : [];
  },
  addJoinedRoom: (roomId: string) => {
    if (typeof window === 'undefined') return;
    const rooms = storage.getJoinedRooms();
    if (!rooms.includes(roomId)) {
      rooms.push(roomId);
      localStorage.setItem('devdebate_teams_rooms', JSON.stringify(rooms));
    }
  },
  removeJoinedRoom: (roomId: string) => {
    if (typeof window === 'undefined') return;
    const rooms = storage.getJoinedRooms();
    const filtered = rooms.filter((id: string) => id !== roomId);
    localStorage.setItem('devdebate_teams_rooms', JSON.stringify(filtered));
  },
};

// Rate limiter
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canProceed(key: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];

    // Remove old timestamps
    const valid = timestamps.filter(t => now - t < this.windowMs);

    if (valid.length >= this.maxRequests) {
      return false;
    }

    valid.push(now);
    this.requests.set(key, valid);
    return true;
  }

  getRemainingTime(key: string): number {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    if (timestamps.length === 0) return 0;

    const oldest = timestamps[0];
    const remaining = this.windowMs - (now - oldest);
    return Math.max(0, remaining);
  }
}

// Debounce function
export const debounce = <T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

// Throttle function
export const throttle = <T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastTime = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastTime >= delay) {
      lastTime = now;
      fn(...args);
    }
  };
};
