// src/hooks/useJoinRoom.ts
import { useState } from 'react';
import firestore from '@react-native-firebase/firestore';

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
      const roomData = roomDoc.data();

      // Kiểm tra phòng đầy chưa
      const playersSnap = await firestore()
        .collection('rooms').doc(roomDoc.id)
        .collection('players').get();

      if (playersSnap.size >= roomData.maxPlayers) {
        setError('Phòng đã đầy');
        return null;
      }

      // Thêm player vào phòng
      await firestore()
        .collection('rooms').doc(roomDoc.id)
        .collection('players').doc(playerId)
        .set({
          displayName: playerName,
          score: 0,
          isOnline: true,
          joinedAt: firestore.FieldValue.serverTimestamp(),
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