// src/hooks/useCreateRoom.ts
import { useState } from 'react';
import {
  collection,
  doc,
  writeBatch,
  serverTimestamp,
} from '@react-native-firebase/firestore';
import { db } from '../services/firebase';

function generateRoomCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

interface CreateRoomOptions {
    hostId: string;
    hostName: string;
    roomName: string;
    maxPlayers: number;
    totalRounds: number;
    roundDurationSecs: number;
    difficulty: string;
    peerReviewEnabled: boolean;
    isPrivate: boolean;
}

export function useCreateRoom() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function createRoom(options: CreateRoomOptions) {
        setLoading(true);
        setError(null);

        try {
            const code = generateRoomCode();
            const roomRef = doc(collection(db, 'rooms'));
            const batch = writeBatch(db);

            // Room document
            batch.set(roomRef, {
                code,
                roomName: options.roomName,
                hostId: options.hostId,
                hostName: options.hostName,
                status: 'waiting',
                isPrivate: options.isPrivate,
                peerReviewEnabled: options.peerReviewEnabled,
                maxPlayers: options.maxPlayers,
                totalRounds: options.totalRounds,
                roundDurationSecs: options.roundDurationSecs,
                difficulty: options.difficulty,
                currentRound: 0,
                currentDrawerId: null,
                currentTopic: null,
                createdAt: serverTimestamp(),
            });

            // Host vào players sub-collection
            const playerRef = doc(db, 'rooms', roomRef.id, 'players', options.hostId);
            batch.set(playerRef, {
                displayName: options.hostName,
                score: 0,
                isOnline: true,
                joinedAt: serverTimestamp(),
            });

            await batch.commit();
            return { roomId: roomRef.id, code };

        } catch (e: any) {
            console.error('[createRoom]', e);
            setError(e.message ?? 'Không thể tạo phòng');
            return null;
        } finally {
            setLoading(false);
        }
    }

    return { createRoom, loading, error };
}