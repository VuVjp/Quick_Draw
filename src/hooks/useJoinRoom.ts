// src/hooks/useJoinRoom.ts
import { useState } from 'react';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export interface JoinedRoomInfo {
    roomId: string;
    code: string;
    roomName: string;
    totalRounds: number;
    roundDurationSecs: number;
    maxPlayers: number;
    difficulty: string;
}

export function useJoinRoom() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function joinRoomByCode(code: string, playerId: string, playerName: string): Promise<JoinedRoomInfo | null> {
        setLoading(true);
        setError(null);

        try {
            // Tìm room theo code
            const snap = await firestore()
                .collection('rooms')
                .doc(code.toUpperCase().trim())
                .get();

            const user = auth().currentUser;
            if (!user) {
                setError('You need to be logged in to join a room');
                return null;
            }

            if (!snap.exists()) {
                setError('Room not found or already started');
                return null;
            }

            const roomDoc = snap.data()!;
            const roomRef = firestore().collection('rooms').doc(snap.id);
            const playerRef = roomRef.collection('players').doc(playerId);

            // Transaction — tránh race condition khi nhiều người join cùng lúc
            await firestore().runTransaction(async (t) => {
                const room = await t.get(roomRef);
                const roomData = room.data()!;

                // Kiểm tra status
                if (roomData.status !== 'waiting') {
                    throw new Error('Room has already started or ended');
                }

                // Dùng playerCount thay vì query sub-collection
                if ((roomData.playerCount ?? 0) >= roomData.maxPlayers) {
                    console.log('Player count:', roomData.playerCount, 'Max players:', roomData.maxPlayers);
                    throw new Error('Room is full');
                }

                // Kiểm tra đã ở trong phòng chưa
                const existing = await t.get(playerRef);
                if (existing.exists()) {
                    throw new Error('You are already in this room');
                }

                // Thêm player
                t.set(playerRef, {
                    displayName: playerName,
                    score: 0,
                    isHost: false,
                    avatar: user.photoURL || 'user',
                    isOnline: true,
                    joinedAt: firestore.FieldValue.serverTimestamp(),
                    lastSeen: firestore.FieldValue.serverTimestamp(),
                });

                // Increment playerCount
                t.update(roomRef, {
                    playerCount: firestore.FieldValue.increment(1),
                });
            });

            return {
                roomId: snap.id,
                code: roomDoc.code,
                roomName: roomDoc.roomName ?? 'Game Room',
                totalRounds: roomDoc.totalRounds ?? 5,
                roundDurationSecs: roomDoc.roundDurationSecs ?? 80,
                maxPlayers: roomDoc.maxPlayers ?? 8,
                difficulty: roomDoc.difficulty ?? 'Medium',
            };

        } catch (e: any) {
            console.error('[joinRoomByCode]', e);
            setError(e.message ?? 'Cannot join room. Please try again.');
            return null;
        } finally {
            setLoading(false);
        }
    }

    return { joinRoomByCode, loading, error };
}