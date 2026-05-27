// src/hooks/useJoinRoom.ts
import { useState } from 'react';
import firestore from '@react-native-firebase/firestore';
import { db } from '../services/firebase';

export function useJoinRoom() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function joinRoomByCode(code: string, playerId: string, playerName: string) {
        setLoading(true);
        setError(null);

        try {
            // Tìm room theo code
            const snap = await firestore()
                .collection('rooms')
                .where('code', '==', code.toUpperCase().trim())
                .where('status', '==', 'waiting')
                .limit(1)
                .get();

            if (snap.empty) {
                setError('Không tìm thấy phòng hoặc phòng đã bắt đầu');
                return null;
            }

            const roomDoc = snap.docs[0];
            const roomRef = firestore().collection('rooms').doc(roomDoc.id);
            const playerRef = roomRef.collection('players').doc(playerId);

            // Transaction — tránh race condition khi nhiều người join cùng lúc
            await firestore().runTransaction(async (t) => {
                const room = await t.get(roomRef);
                const roomData = room.data()!;

                // Kiểm tra status
                if (roomData.status !== 'waiting') {
                    throw new Error('Phòng đã bắt đầu hoặc kết thúc');
                }

                // Dùng playerCount thay vì query sub-collection
                if ((roomData.playerCount ?? 0) >= roomData.maxPlayers) {
                    throw new Error('Phòng đã đầy');
                }

                // Kiểm tra đã ở trong phòng chưa
                const existing = await t.get(playerRef);
                if (existing.exists) {
                    throw new Error('Bạn đã ở trong phòng này');
                }

                // Thêm player
                t.set(playerRef, {
                    displayName: playerName,
                    score: 0,
                    isOnline: true,
                    joinedAt: firestore.FieldValue.serverTimestamp(),
                });

                // Increment playerCount
                t.update(roomRef, {
                    playerCount: firestore.FieldValue.increment(1),
                });
            });

            return { roomId: roomDoc.id, code: roomDoc.data()!.code };

        } catch (e: any) {
            console.error('[joinRoomByCode]', e);
            setError(e.message ?? 'Không thể vào phòng');
            return null;
        } finally {
            setLoading(false);
        }
    }

    return { joinRoomByCode, loading, error };
}