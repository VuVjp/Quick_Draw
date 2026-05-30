// src/hooks/useCreateRoom.ts
import { useState } from 'react';
import
firestore, {
    doc,
    writeBatch,
} from '@react-native-firebase/firestore';
import { db } from '../services/firebase';
import auth from '@react-native-firebase/auth';

async function generateRoomCode(): Promise<string> {
    for (let i = 0; i < 10; i++) {

        const code = Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();

        const snap = await firestore()
            .collection('rooms')
            .doc(code)
            .get();
        if (!snap.exists()) {
            return code;
        }
    }

    throw new Error('Can not generate unique room code. Please try again.');
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
            const code = await generateRoomCode();
            const roomRef = firestore().collection('rooms').doc(code);
            const batch = writeBatch(db);
            const user = auth().currentUser;
            if (!user) {
                setError('You need to be logged in to create a room');
                return null;
            }

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
                playerCount: 1,
                createdAt: firestore.FieldValue.serverTimestamp(),
            });

            // Host vào players sub-collection
            const playerRef = doc(db, 'rooms', roomRef.id, 'players', options.hostId);
            batch.set(playerRef, {
                displayName: options.hostName,
                score: 0,
                isHost: true,
                avatar: user.photoURL || 'user',
                isOnline: true,
                joinedAt: firestore.FieldValue.serverTimestamp(),
            });

            await batch.commit();
            return { roomId: roomRef.id, code };

        } catch (e: any) {
            console.error('[createRoom]', e);
            setError(e.message ?? 'Cannot create room. Please try again.');
            return null;
        } finally {
            setLoading(false);
        }
    }

    return { createRoom, loading, error };
}