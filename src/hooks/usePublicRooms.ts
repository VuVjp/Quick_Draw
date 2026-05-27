// src/hooks/usePublicRooms.ts
import { useEffect, useState } from 'react';
import firestore from '@react-native-firebase/firestore';

export interface RoomItem {
    id: string;
    name: string;
    players: number;
    maxPlayers: number;
    status: string;
    code: string;
}

export function usePublicRooms() {
    const [rooms, setRooms] = useState<RoomItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = firestore()
            .collection('rooms')
            .where('isPrivate', '==', false)
            .where('status', '==', 'waiting')
            .orderBy('createdAt', 'desc')
            .limit(20)
            .onSnapshot(async (snap) => {
                // Với mỗi room, lấy số lượng players từ sub-collection
                const roomsWithPlayers = await Promise.all(
                    snap.docs.map(async (doc) => {
                        const data = doc.data();
                        const playersSnap = await firestore()
                            .collection('rooms')
                            .doc(doc.id)
                            .collection('players')
                            .get();

                        return {
                            id: doc.id,
                            name: data.roomName ?? 'Phòng chơi',
                            players: playersSnap.size,
                            maxPlayers: data.maxPlayers ?? 8,
                            status: data.status,
                            code: data.code,
                        };
                    })
                );
                setRooms(roomsWithPlayers);
                setLoading(false);
            }, (error) => {
                console.error('[usePublicRooms]', error);
                setLoading(false);
            });

        return unsub;
    }, []);

    return { rooms, loading };
}