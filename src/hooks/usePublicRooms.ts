// src/hooks/usePublicRooms.ts
import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
} from '@react-native-firebase/firestore';
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
        const roomsRef = collection(db, 'rooms');
        const q = query(
            roomsRef,
            where('isPrivate', '==', false),
            where('status', '==', 'waiting'),
            orderBy('createdAt', 'desc'),
            limit(20)
        );

        const unsub = onSnapshot(q, async (snap) => {
            const roomsWithPlayers = await Promise.all(
                snap.docs.map(async (doc) => {
                    const data = doc.data();
                    const playersSnap = await getDocs(
                        collection(db, 'rooms', doc.id, 'players')
                    );
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