// src/hooks/usePublicRooms.ts
import { useEffect, useState } from 'react';
import firestore from '@react-native-firebase/firestore';
import { db } from '../services/firebase';

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
            .onSnapshot((snap) => {
                // Không cần Promise.all, không cần sub-collection query
                const rooms = snap.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        name: data.roomName ?? 'Unnamed Room',
                        players: data.playerCount ?? 0, // ← đọc trực tiếp
                        maxPlayers: data.maxPlayers,
                        status: data.status,
                        code: data.code,
                    };
                });
                setRooms(rooms);
                setLoading(false);
            }, (error) => {
                console.error('[usePublicRooms]', error);
                setLoading(false);
            });

        return unsub;
    }, []);

    return { rooms, loading };
}