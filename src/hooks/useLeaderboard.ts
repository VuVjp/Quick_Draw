// src/hooks/useLeaderboard.ts
import { useEffect, useState, useCallback } from 'react';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export interface PlayerResult {
    uid: string;
    displayName: string;
    score: number;
    roundsWon: number;
    bestDrawTime: number | null; // ms — round nhanh nhất trong cả game
    isHost: boolean;
}

export function useLeaderboard(roomId: string) {
    const [players, setPlayers] = useState<PlayerResult[]>([]);
    const [mvpUid, setMvpUid] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const currentUid = auth().currentUser?.uid;

    // ── Subscribe players — update realtime sau mỗi round ────────────
    useEffect(() => {
        const unsub = firestore()
            .collection('rooms').doc(roomId)
            .collection('players')
            .onSnapshot((snap) => {
                const list: PlayerResult[] = snap.docs.map((doc) => ({
                    uid: doc.id,
                    ...(doc.data() as Omit<PlayerResult, 'uid'>),
                }));

                // Sort score DESC, bestDrawTime ASC (tie-break)
                list.sort((a, b) => {
                    if (b.score !== a.score) return b.score - a.score;
                    if (a.bestDrawTime && b.bestDrawTime) {
                        return a.bestDrawTime - b.bestDrawTime;
                    }
                    return 0;
                });

                setPlayers(list);
            });

        // Subscribe mvpUid từ room
        const unsubRoom = firestore()
            .collection('rooms').doc(roomId)
            .onSnapshot((snap) => {
                setMvpUid(snap.data()?.mvpUid ?? null);
            });

        return () => { unsub(); unsubRoom(); };
    }, [roomId]);

    // ── Gọi sau mỗi round khi drawer được AI accept ──────────────────
    const updateAfterRound = useCallback(async (
        drawerId: string,
        roundScore: number,
        drawDurationMs: number, // Date.now() - roundStartedAt
    ) => {
        const playerRef = firestore()
            .collection('rooms').doc(roomId)
            .collection('players').doc(drawerId);

        await firestore().runTransaction(async (t) => {
            const snap = await t.get(playerRef);
            const data = snap.data()!;

            // Giữ lại bestDrawTime nhỏ nhất qua các round
            const currentBest = data.bestDrawTime ?? Infinity;
            const newBest = drawDurationMs < currentBest
                ? drawDurationMs
                : currentBest;

            t.update(playerRef, {
                score: firestore.FieldValue.increment(roundScore),
                roundsWon: firestore.FieldValue.increment(1),
                bestDrawTime: newBest,
            });
        });
    }, [roomId]);

    // ── MVP suggestion — player có bestDrawTime thấp nhất ────────────
    const suggestedMvp = players.reduce<PlayerResult | null>((best, p) => {
        if (!p.bestDrawTime) return best;
        if (!best?.bestDrawTime) return p;
        return p.bestDrawTime < best.bestDrawTime ? p : best;
    }, null);

    // ── Host confirm MVP — chỉ gọi cuối game ─────────────────────────
    const confirmMvp = useCallback(async (uid: string) => {
        setLoading(true);
        try {
            await firestore().collection('rooms').doc(roomId).update({
                mvpUid: uid,
                mvpReason: 'fastest_draw',
                status: 'game_end',
                endedAt: firestore.FieldValue.serverTimestamp(),
            });
        } finally {
            setLoading(false);
        }
    }, [roomId]);

    const isHost = players.find((p) => p.uid === currentUid)?.isHost ?? false;

    return {
        players,
        mvpUid,
        suggestedMvp,
        updateAfterRound,  // ← gọi sau mỗi round
        confirmMvp,        // ← gọi cuối game (host)
        isHost,
        loading,
    };
}