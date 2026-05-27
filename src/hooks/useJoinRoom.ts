// src/hooks/useJoinRoom.ts
import { useState } from 'react';
import {
  collection,
  query,
  where,
  limit,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from '@react-native-firebase/firestore';
import { db } from '../services/firebase';

export function useJoinRoom() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function joinRoomByCode(code: string, playerId: string, playerName: string) {
    setLoading(true);
    setError(null);

    try {
      // Tìm room theo code
      const roomsRef = collection(db, 'rooms');
      const q = query(
        roomsRef,
        where('code', '==', code.toUpperCase().trim()),
        where('status', '==', 'waiting'),
        limit(1)
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        setError('Không tìm thấy phòng hoặc phòng đã bắt đầu');
        return null;
      }

      const roomDoc = snap.docs[0];
      const roomData = roomDoc.data();

      // Kiểm tra phòng đầy chưa
      const playersSnap = await getDocs(
        collection(db, 'rooms', roomDoc.id, 'players')
      );

      if (playersSnap.size >= roomData.maxPlayers) {
        setError('Phòng đã đầy');
        return null;
      }

      // Thêm player vào phòng
      await setDoc(doc(db, 'rooms', roomDoc.id, 'players', playerId), {
        displayName: playerName,
        score: 0,
        isOnline: true,
        joinedAt: serverTimestamp(),
      });

      return { roomId: roomDoc.id, code: roomData.code };

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