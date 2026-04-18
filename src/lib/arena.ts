import { rtdb } from './firebase';
import { ref, set, get, update, onValue, off } from 'firebase/database';

export interface RoomPlayer {
  uid: string;
  name: string;
  ready: boolean;
}

export interface Round {
  forArgument: string;
  againstArgument: string;
  forScore: number;
  againstScore: number;
  aiVerdict: string;
  status: 'arguing' | 'judging' | 'done';
}

export interface RoomData {
  topic: string;
  status: 'waiting' | 'active' | 'finished';
  createdAt: number;
  createdBy: string;
  players: {
    for: RoomPlayer | null;
    against: RoomPlayer | null;
  };
  currentRound: number;
  totalRounds: number;
  timePerRound: number;
  rounds: {
    round1: Round;
    round2: Round;
    round3: Round;
  };
  totalScore: {
    for: number;
    against: number;
  };
  winner: 'for' | 'against' | 'draw' | null;
  spectators: number;
  roomType: 'public' | 'private';
}

const generateRoomId = () => {
  const adjectives = ['fast', 'cool', 'wild', 'bold', 'swift', 'bright', 'dark', 'neon'];
  const nouns = ['tiger', 'eagle', 'storm', 'blade', 'spark', 'wolf', 'hawk', 'dragon'];
  const num = Math.floor(Math.random() * 999);
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj}-${noun}-${num}`;
};

export const createRoom = async (roomData: Partial<RoomData>): Promise<string> => {
  const roomId = generateRoomId();
  const roomRef = ref(rtdb, `rooms/${roomId}`);

  const defaultRound: Round = {
    forArgument: '',
    againstArgument: '',
    forScore: 0,
    againstScore: 0,
    aiVerdict: '',
    status: 'arguing',
  };

  const fullRoomData: RoomData = {
    topic: roomData.topic || 'Untitled Debate',
    status: 'waiting',
    createdAt: Date.now(),
    createdBy: roomData.createdBy || '',
    players: {
      for: roomData.players?.for || null,
      against: roomData.players?.against || null,
    },
    currentRound: 1,
    totalRounds: roomData.totalRounds || 3,
    timePerRound: roomData.timePerRound || 90,
    rounds: {
      round1: { ...defaultRound },
      round2: { ...defaultRound },
      round3: { ...defaultRound },
    },
    totalScore: {
      for: 0,
      against: 0,
    },
    winner: null,
    spectators: 0,
    roomType: roomData.roomType || 'public',
  };

  await set(roomRef, fullRoomData);
  return roomId;
};

export const joinRoom = async (roomId: string, playerData: { uid: string; name: string }, side: 'for' | 'against'): Promise<boolean> => {
  const roomRef = ref(rtdb, `rooms/${roomId}`);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) {
    return false;
  }

  const roomData = snapshot.val() as RoomData;

  if (roomData.players[side]) {
    return false;
  }

  await update(roomRef, {
    [`players/${side}`]: {
      uid: playerData.uid,
      name: playerData.name,
      ready: false,
    },
  });

  return true;
};

export const submitArgument = async (roomId: string, round: number, side: 'for' | 'against', argument: string): Promise<void> => {
  const roomRef = ref(rtdb, `rooms/${roomId}`);
  const roundKey = `round${round}` as keyof RoomData['rounds'];

  await update(roomRef, {
    [`rounds/${roundKey}/${side}Argument`]: argument,
  });
};

export const updateRoundScores = async (roomId: string, round: number, scores: {
  forScore: number;
  againstScore: number;
  forFeedback: string;
  againstFeedback: string;
  aiVerdict: string;
}): Promise<void> => {
  const roomRef = ref(rtdb, `rooms/${roomId}`);
  const roundKey = `round${round}` as keyof RoomData['rounds'];

  await update(roomRef, {
    [`rounds/${roundKey}/forScore`]: scores.forScore,
    [`rounds/${roundKey}/againstScore`]: scores.againstScore,
    [`rounds/${roundKey}/aiVerdict`]: scores.aiVerdict,
    [`rounds/${roundKey}/status`]: 'done',
    [`totalScore/for`]: scores.forScore,
    [`totalScore/against`]: scores.againstScore,
  });
};

export const listenToRoom = (roomId: string, callback: (roomData: RoomData | null) => void): (() => void) => {
  const roomRef = ref(rtdb, `rooms/${roomId}`);

  const unsubscribe = onValue(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as RoomData);
    } else {
      callback(null);
    }
  });

  return () => off(roomRef, 'value', unsubscribe as unknown as () => void);
};

export const updateRoomStatus = async (roomId: string, status: RoomData['status']): Promise<void> => {
  const roomRef = ref(rtdb, `rooms/${roomId}`);
  await update(roomRef, { status });
};

export const setPlayerReady = async (roomId: string, side: 'for' | 'against', ready: boolean): Promise<void> => {
  const roomRef = ref(rtdb, `rooms/${roomId}`);
  await update(roomRef, {
    [`players/${side}/ready`]: ready,
  });
};

export const startNextRound = async (roomId: string, nextRound: number): Promise<void> => {
  const roomRef = ref(rtdb, `rooms/${roomId}`);
  await update(roomRef, {
    currentRound: nextRound,
    [`rounds/round${nextRound}/status`]: 'arguing',
  });
};

export const setWinner = async (roomId: string, winner: RoomData['winner']): Promise<void> => {
  const roomRef = ref(rtdb, `rooms/${roomId}`);
  await update(roomRef, {
    winner,
    status: 'finished',
  });
};

export const incrementSpectators = async (roomId: string): Promise<void> => {
  const roomRef = ref(rtdb, `rooms/${roomId}/spectators`);
  const snapshot = await get(roomRef);
  const current = snapshot.val() || 0;
  await set(roomRef, current + 1);
};

export const decrementSpectators = async (roomId: string): Promise<void> => {
  const roomRef = ref(rtdb, `rooms/${roomId}/spectators`);
  const snapshot = await get(roomRef);
  const current = snapshot.val() || 0;
  await set(roomRef, Math.max(0, current - 1));
};

export const getRoom = async (roomId: string): Promise<RoomData | null> => {
  const roomRef = ref(rtdb, `rooms/${roomId}`);
  const snapshot = await get(roomRef);

  if (snapshot.exists()) {
    return snapshot.val() as RoomData;
  }
  return null;
};
