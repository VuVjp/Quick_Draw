import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
} from '@react-native-firebase/firestore';
import { db, auth } from '../services/firebase';

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
  mvpUid?: string | null;
  lastRoundScores?: Record<string, number>;
}

export function useRoom(roomId?: string | null) {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [players, setPlayers] = useState<Record<string, any>>({});
  const uid = auth.currentUser?.uid;

  // ─── Subscribe room document ──────────────────────────────────────
  useEffect(() => {
    if (!roomId) {
      setRoom(null);
      return;
    }
    const roomRef = doc(db, 'rooms', roomId);
    const unsub = onSnapshot(roomRef, (snap) => {
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
    const playersRef = collection(db, 'rooms', roomId, 'players');
    const unsub = onSnapshot(playersRef, (snap) => {
      const map: Record<string, any> = {};
      snap.docs.forEach((d) => { map[d.id] = d.data(); });
      setPlayers(map);
    });
    return unsub;
  }, [roomId]);

  return { room, players, uid };
}