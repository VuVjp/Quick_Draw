// src/hooks/useLeaderboard.ts
import { useEffect, useState, useCallback, useMemo } from 'react';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export interface PlayerResult {
    uid: string;
    displayName: string;
    avatar: string | null;
    score: number;
    roundsWon: number;
    bestDrawTime: number | null; // ms — round nhanh nhất trong cả game
    isHost: boolean;
    gainedScore: number;
    rank: number;
}

export function useLeaderboard(roomId?: string | null) {
    const [players, setPlayers] = useState<PlayerResult[]>([]);
    const [mvpUid, setMvpUid] = useState<string | null>(null);
    const [lastRoundScores, setLastRoundScores] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);
    const currentUid = auth().currentUser?.uid;
    const roomKey = roomId ?? undefined;

    // ── Subscribe players — update realtime sau mỗi round ────────────
    useEffect(() => {
        if (!roomKey) {
            setPlayers([]);
            setMvpUid(null);
            setLastRoundScores({});
            return;
        }

        const unsub = firestore()
            .collection('rooms').doc(roomKey)
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
            .collection('rooms').doc(roomKey)
            .onSnapshot((snap) => {
                const data = snap.data();
                setMvpUid(data?.mvpUid ?? null);
                setLastRoundScores(data?.lastRoundScores ?? {});
            });

        return () => { unsub(); unsubRoom(); };
    }, [roomKey]);

    const leaderboard = useMemo(() => {
        const ranked = [...players]
            .map((player) => ({
                ...player,
                gainedScore: lastRoundScores[player.uid] ?? 0,
            }))
            .sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                const aBest = a.bestDrawTime ?? Infinity;
                const bBest = b.bestDrawTime ?? Infinity;
                if (aBest !== bBest) return aBest - bBest;
                return a.displayName.localeCompare(b.displayName);
            })
            .map((player, index) => ({
                ...player,
                rank: index + 1,
            }));

        return ranked;
    }, [lastRoundScores, players]);

    // ── Gọi sau mỗi round khi drawer được AI accept ──────────────────
    const updateAfterRound = useCallback(async (
        drawerId: string,
        roundScore: number,
        drawDurationMs: number, // Date.now() - roundStartedAt
    ) => {
        if (!roomKey) return;

        const playerRef = firestore()
            .collection('rooms').doc(roomKey)
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
    }, [roomKey]);

    // ── MVP suggestion — player có bestDrawTime thấp nhất ────────────
    const suggestedMvp = leaderboard.reduce<PlayerResult | null>((best, p) => {
        if (!p.bestDrawTime) return best;
        if (!best?.bestDrawTime) return p;
        return p.bestDrawTime < best.bestDrawTime ? p : best;
    }, null);

    // ── Host confirm MVP — chỉ gọi cuối game ─────────────────────────
    const confirmMvp = useCallback(async (uid: string) => {
        if (!roomKey) return;

        // setLoading(true);
        // try {
        //     await firestore().collection('rooms').doc(roomKey).update({
        //         mvpUid: uid,
        //         mvpReason: 'fastest_draw',
        //         status: 'game_end',
        //         endedAt: firestore.FieldValue.serverTimestamp(),
        //     });
        // } finally {
        //     setLoading(false);
        // }
    }, [roomKey]);

    const isHost = players.find(p => p.uid === currentUid)?.isHost;

    return {
        players: leaderboard,
        mvpUid,
        suggestedMvp,
        updateAfterRound,  // ← gọi sau mỗi round
        confirmMvp,        // ← gọi cuối game (host)
        isHost,
        loading,
    };
}