import { useEffect, useState } from 'react';
import firestore from '@react-native-firebase/firestore';
import { auth } from '../services/firebase';
import { useHeartbeat } from './useHeartbeat';

export interface RoomState {
  status: string;
  currentDrawerId: string;
  currentTopic: string;
  currentRound: number;
  totalRounds: number;
  peerReviewEnabled: boolean;
  roundStartedAt: Date | null;
  roundDurationSecs: number;
  roundCountdownStartedAt: Date | null;
  roundCountdownSecs: number;
  hostId: string;
  roomName: string;
  code: string;
  maxPlayers: number;
  difficulty: string;
  endedAt: Date | null;
  mvpUid?: string | null;
  lastRoundScores?: Record<string, number>;
}

export function useRoom(roomId?: string | null) {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [players, setPlayers] = useState<Record<string, any>>({});
  const uid = auth.currentUser?.uid;

  // Start presence heartbeat whenever this hook is used for an active room
  const { stopHeartbeat } = useHeartbeat(roomId, uid, { intervalMs: 5000 });

  // ─── Subscribe room document ──────────────────────────────────────
  useEffect(() => {
    if (!roomId) {
      setRoom(null);
      return;
    }
    const roomRef = firestore().collection('rooms').doc(roomId);
    const unsub = roomRef.onSnapshot((snap) => {
      if (!snap.exists()) {
        setRoom((prev) => prev ? { ...prev, status: 'deleted' } : null);
        return;
      }
      const data = snap.data()!;
      setRoom({
        status: data.status,
        currentDrawerId: data.currentDrawerId,
        currentTopic: data.currentTopic,
        currentRound: data.currentRound,
        totalRounds: data.totalRounds,
        peerReviewEnabled: data.peerReviewEnabled ?? false,
        roundStartedAt: data.roundStartedAt?.toDate() ?? null,
        roundDurationSecs: data.roundDurationSecs ?? 80,
        roundCountdownStartedAt: data.roundCountdownStartedAt?.toDate() ?? null,
        roundCountdownSecs: data.roundCountdownSecs ?? 5,
        hostId: data.hostId ?? '',
        roomName: data.roomName ?? '',
        code: data.code ?? '',
        maxPlayers: data.maxPlayers ?? 8,
        difficulty: data.difficulty ?? 'Trung bình',
        endedAt: data.endedAt?.toDate() ?? null,
        mvpUid: data.mvpUid ?? null,
        lastRoundScores: data.lastRoundScores ?? {},
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
    const playersRef = firestore().collection('rooms').doc(roomId).collection('players');
    const unsub = playersRef.onSnapshot((snap) => {
      const map: Record<string, any> = {};
      snap.docs.forEach((d) => { map[d.id] = d.data(); });
      setPlayers(map);
    });
    return unsub;
  }, [roomId]);

  return { room, players, uid, stopHeartbeat };
}