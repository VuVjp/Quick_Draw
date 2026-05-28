import { useEffect, useCallback } from 'react';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { LABLES } from '../constants/words';

function calculateScore(aiScore: number, drawDurationMs: number, totalSecs: number): number {
    const base = Math.round(aiScore * 100);
    const timeRatio = 1 - drawDurationMs / (totalSecs * 1000);
    const timeBonus = Math.round(Math.max(0, timeRatio) * 50);
    return base + timeBonus;
}

export function useHostGameMaster(roomId: string, roundDurationSecs: number) {
    const currentUid = auth().currentUser?.uid;

    void roundDurationSecs;

    const pickMvpUid = useCallback(async (): Promise<string | null> => {
        const snap = await firestore()
            .collection('rooms').doc(roomId)
            .collection('players')
            .get();

        const rows = snap.docs.map((d) => ({ uid: d.id, ...(d.data() as any) }));
        rows.sort((a, b) => {
            const scoreA = a.score ?? 0;
            const scoreB = b.score ?? 0;
            if (scoreB !== scoreA) return scoreB - scoreA;

            const bestA = Number.isFinite(a.bestDrawTime) ? a.bestDrawTime : Number.MAX_SAFE_INTEGER;
            const bestB = Number.isFinite(b.bestDrawTime) ? b.bestDrawTime : Number.MAX_SAFE_INTEGER;
            return bestA - bestB;
        });

        return rows[0]?.uid ?? null;
    }, [roomId]);

    const markProcessed = useCallback(async (targetRoomId: string, roundId: string) => {
        await firestore()
            .collection('rooms').doc(targetRoomId)
            .collection('pending_results').doc(roundId)
            .delete();
    }, []);

    const processResult = useCallback(async (
        roomSnap: any,
        roundId: string,
        data: any,
    ) => {
        const roomData = roomSnap.data();

        // Validate
        if (data.drawerId !== roomData.currentDrawerId) {
            console.warn('[Host] Drawer không khớp, bỏ qua');
            await markProcessed(roomId, roundId);
            return;
        }

        if (roomData.status !== 'drawing') {
            console.warn('[Host] Round không còn active');
            await markProcessed(roomId, roundId);
            return;
        }

        // Validate thời gian — không cho submit sau hết giờ
        const roundStart = roomData.roundStartedAt?.toDate();
        if (roundStart) {
            const elapsed = Date.now() - roundStart.getTime();
            if (elapsed > (roomData.roundDurationSecs + 5) * 1000) {
                console.warn('[Host] Hết giờ, bỏ qua');
                await markProcessed(roomId, roundId);
                return;
            }
        }

        // Validate aiScore hợp lý
        if (data.aiScore < 0.2) {
            console.warn('[Host] aiScore quá thấp:', data.aiScore);
            await markProcessed(roomId, roundId);
            return;
        }

        // Tính điểm
        const score = calculateScore(
            data.aiScore,
            data.drawDurationMs,
            roomData.roundDurationSecs,
        );

        const batch = firestore().batch();
        const roomRef = firestore().collection('rooms').doc(roomId);
        const playerRef = roomRef.collection('players').doc(data.drawerId);
        const roundRef = roomRef.collection('rounds').doc(roundId);
        const pendingRef = roomRef.collection('pending_results').doc(roundId);

        // Update player score + bestDrawTime
        const playerSnap = await playerRef.get();
        const playerData = playerSnap.data()!;
        const currentBest = playerData.bestDrawTime ?? Infinity;
        const newBest = data.drawDurationMs < currentBest
            ? data.drawDurationMs : currentBest;

        batch.update(playerRef, {
            score: firestore.FieldValue.increment(score),
            roundsWon: firestore.FieldValue.increment(1),
            bestDrawTime: newBest,
        });

        // Update round status (merge to avoid failure if round doc was not pre-created)
        batch.set(roundRef, {
            status: 'accepted',
            aiLabel: data.aiLabel,
            aiScore: data.aiScore,
            drawDurationMs: data.drawDurationMs,
            score,
            validatedAt: firestore.FieldValue.serverTimestamp(),
            validationSource: 'ai_local',
        }, { merge: true });

        // Update room status → round_end
        const isLastRound = (roomData.currentRound ?? 0) >= (roomData.totalRounds ?? 0);
        const lastRoundScores = {
            [data.drawerId]: score,
        };

        batch.update(roomRef, {
            status: isLastRound ? 'game_end' : 'round_end',
            lastValidatedAt: firestore.FieldValue.serverTimestamp(),
            lastRoundScores,
            roundCountdownStartedAt: isLastRound ? null : firestore.FieldValue.serverTimestamp(),
            roundCountdownSecs: isLastRound ? 0 : 5,
        });

        // Xóa pending sau khi xử lý
        batch.delete(pendingRef);

        await batch.commit();

        if (isLastRound) {
            const mvpUid = await pickMvpUid();
            if (mvpUid) {
                await roomRef.update({
                    mvpUid,
                    mvpReason: 'score_then_fastest_tiebreak',
                    endedAt: firestore.FieldValue.serverTimestamp(),
                });
            }
        }

        console.log(`[Host] Round ${roundId} processed — score: ${score}`);
    }, [roomId, pickMvpUid, markProcessed]);

    useEffect(() => {
        if (!roomId) return;

        // Chỉ host mới chạy listener này
        const roomUnsub = firestore()
            .collection('rooms').doc(roomId)
            .onSnapshot((snap) => {
                if (snap.data()?.hostId !== currentUid) return;
            });

        // Lắng nghe pending_results
        const unsub = firestore()
            .collection('rooms').doc(roomId)
            .collection('pending_results')
            .where('status', '==', 'pending')
            .onSnapshot(async (snap) => {
                // Kiểm tra mình có phải host không
                const roomSnap = await firestore()
                    .collection('rooms').doc(roomId).get();

                if (roomSnap.data()?.hostId !== currentUid) return;

                for (const doc of snap.docs) {
                    const data = doc.data();
                    await processResult(roomSnap, doc.id, data);
                }
            });

        return () => { unsub(); roomUnsub(); };
    }, [roomId, currentUid, processResult]);

    // Host confirm MVP cuối game
    const confirmMvp = useCallback(async (mvpUid: string) => {
        await firestore().collection('rooms').doc(roomId).update({
            mvpUid,
            mvpReason: 'fastest_draw',
            status: 'game_end',
            endedAt: firestore.FieldValue.serverTimestamp(),
        });
    }, [roomId]);

    // Host advance sang round tiếp
    const advanceRound = useCallback(async (
        currentRound: number,
        totalRounds: number,
        playerIds: string[],
    ) => {
        if (currentRound >= totalRounds) {
            await firestore().collection('rooms').doc(roomId).update({
                status: 'game_end',
            });
            return;
        }

        const nextRound = currentRound + 1;
        const nextDrawerIndex = (nextRound - 1) % playerIds.length;
        const nextDrawerId = playerIds[nextDrawerIndex];
        const nextTopic = LABLES[Math.floor(Math.random() * LABLES.length)];
        const roundId = `round_${nextRound}`;

        const batch = firestore().batch();
        const roomRef = firestore().collection('rooms').doc(roomId);

        batch.update(roomRef, {
            status: 'drawing',
            currentRound: nextRound,
            currentDrawerId: nextDrawerId,
            currentTopic: nextTopic,
            roundStartedAt: firestore.FieldValue.serverTimestamp(),
            roundCountdownStartedAt: null,
            roundCountdownSecs: 5,
        });

        batch.set(roomRef.collection('rounds').doc(roundId), {
            drawerId: nextDrawerId,
            topic: nextTopic,
            status: 'pending',
            aiLabel: null,
            aiScore: null,
            drawDurationMs: null,
            score: null,
            validatedAt: null,
            validationSource: null,
        });

        await batch.commit();
    }, [roomId]);

    return { confirmMvp, advanceRound };
}