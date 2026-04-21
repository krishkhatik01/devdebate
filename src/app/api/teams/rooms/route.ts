import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { generateRoomId, generateRoomPassword } from '@/lib/teams/utils';

// Create a new room
export async function POST(req: NextRequest) {
  try {
    const { name, description, createdBy, userName, userEmoji, userColor } = await req.json();

    if (!name || !createdBy) {
      return NextResponse.json(
        { error: 'Room name and creator required' },
        { status: 400 }
      );
    }

    const roomId = generateRoomId();
    const password = generateRoomPassword();
    const now = Date.now();
    const expiresAt = now + 30 * 24 * 60 * 60 * 1000; // 30 days

    const roomData = {
      id: roomId,
      name: name.trim(),
      description: description?.trim() || '',
      password,
      createdBy,
      createdAt: now,
      expiresAt,
      memberCount: 1,
      members: [
        {
          userId: createdBy,
          name: userName,
          emoji: userEmoji,
          color: userColor,
          role: 'owner',
          joinedAt: now,
        },
      ],
      settings: {
        allowAI: true,
        allowCodeSharing: true,
        requireApproval: false,
      },
    };

    await setDoc(doc(db, 'rooms', roomId), roomData);

    return NextResponse.json({
      success: true,
      room: {
        id: roomId,
        name: roomData.name,
        password,
      },
    });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    );
  }
}

// Join a room
export async function PUT(req: NextRequest) {
  try {
    const { roomId, password, userId, userName, userEmoji, userColor } = await req.json();

    if (!roomId || !userId) {
      return NextResponse.json(
        { error: 'Room ID and user ID required' },
        { status: 400 }
      );
    }

    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    const roomData = roomSnap.data();

    // Check if room has expired
    if (roomData.expiresAt < Date.now()) {
      return NextResponse.json(
        { error: 'Room has expired' },
        { status: 410 }
      );
    }

    // Check password
    if (roomData.password !== password) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 403 }
      );
    }

    // Check if user is already a member
    const existingMember = roomData.members?.find((m: { userId: string }) => m.userId === userId);

    if (existingMember) {
      return NextResponse.json({
        success: true,
        room: {
          id: roomId,
          name: roomData.name,
          role: existingMember.role,
        },
      });
    }

    // Add member to room
    await updateDoc(roomRef, {
      members: arrayUnion({
        userId,
        name: userName,
        emoji: userEmoji,
        color: userColor,
        role: 'member',
        joinedAt: Date.now(),
      }),
      memberCount: (roomData.memberCount || 0) + 1,
    });

    return NextResponse.json({
      success: true,
      room: {
        id: roomId,
        name: roomData.name,
        role: 'member',
      },
    });
  } catch (error) {
    console.error('Error joining room:', error);
    return NextResponse.json(
      { error: 'Failed to join room' },
      { status: 500 }
    );
  }
}
