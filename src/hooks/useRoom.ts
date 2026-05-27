import { useEffect, useState, useCallback } from 'react';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export interface RoomState {
  status: string;
  currentDrawerId: string;
  currentTopic: string;
  currentRound: number;
  totalRounds: number;
  peerReviewEnabled: boolean;
  roundStartedAt: Date | null;
  roundDurationSecs: number;
  roomName: string;
  code: string;
  hostId: string;
  maxPlayers: number;
}

export function useRoom(roomId?: string | null) {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [players, setPlayers] = useState<Record<string, any>>({});
  const [uid, setUid] = useState<string | null>(auth().currentUser?.uid || null);

  useEffect(() => {
    const unsubAuth = auth().onAuthStateChanged((user) => {
      setUid(user?.uid || null);
    });
    return unsubAuth;
  }, []);

  // ─── Subscribe room document ──────────────────────────────────────
  useEffect(() => {
    if (!roomId) {
      setRoom(null);
      return;
    }
    const unsub = firestore()
      .collection('rooms')
      .doc(roomId)
      .onSnapshot((snap) => {
        if (!snap.exists) return;
        const data = snap.data()!;
        setRoom({
          status: data.status,
          currentDrawerId: data.currentDrawerId ?? '',
          currentTopic: data.currentTopic ?? '',
          currentRound: data.currentRound ?? 0,
          totalRounds: data.totalRounds ?? 5,
          peerReviewEnabled: data.peerReviewEnabled ?? false,
          roundStartedAt: data.roundStartedAt?.toDate() ?? null,
          roundDurationSecs: data.roundDurationSecs ?? 80,
          roomName: data.roomName ?? 'Phòng chơi',
          code: data.code ?? '',
          hostId: data.hostId ?? '',
          maxPlayers: data.maxPlayers ?? 8,
        });
      });
    return unsub;
  }, [roomId]);

  // ─── Subscribe players sub-collection ────────────────────────────
  useEffect(() => {
    if (!roomId) {
      setPlayers({});
      return;
    }
    const unsub = firestore()
      .collection('rooms')
      .doc(roomId)
      .collection('players')
      .onSnapshot((snap) => {
        const map: Record<string, any> = {};
        snap.docs.forEach((d) => { map[d.id] = { id: d.id, ...d.data() }; });
        setPlayers(map);
      });
    return unsub;
  }, [roomId]);

  const isDrawer = uid === room?.currentDrawerId;

  return { room, players, isDrawer, uid };
}