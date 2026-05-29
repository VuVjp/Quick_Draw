// src/hooks/useSubmitDrawing.ts
import { useEffect, useRef, useState } from 'react';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { calculateRanks } from '../utils/scoreUtils';

export function useSubmitDrawing(roomCode: string, roundNumber: number) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const startTimeRef = useRef<number>(Date.now()); // Bắt đầu đếm khi round start
  const finalizedRoundRef = useRef<string | null>(null);

  useEffect(() => {
    if (!roomCode || roundNumber <= 0) return;

    const roomRef = firestore().collection('rooms').doc(roomCode);

    const unsubscribe = roomRef.onSnapshot(async (roomSnap) => {
      const roomData = roomSnap.data();
      const currentUser = auth().currentUser;

      if (!roomData || !currentUser || roomData.hostId !== currentUser.uid) return;
      if (roomData.status !== 'round_scoring') return;

      const roundKey = `round_${roundNumber}`;
      if (finalizedRoundRef.current === roundKey) return;

      const roundRef = roomRef.collection('rounds').doc(roundKey);
      const roundSnap = await roundRef.get();
      const roundData = roundSnap.data();

      if (!roundData || roundData.scoresFinalized) return;

      const submissions = Object.values(roundData.submissions ?? {}) as {
        uid: string;
        drawDurationMs: number;
      }[];

      const rankedResults = calculateRanks(submissions);
      const lastRoundScores = rankedResults.reduce<Record<string, number>>((acc, result) => {
        acc[result.uid] = result.score;
        return acc;
      }, {});

      finalizedRoundRef.current = roundKey;

      try {
        await firestore().runTransaction(async (transaction) => {
          const latestRoomSnap = await transaction.get(roomRef);
          const latestRoomData = latestRoomSnap.data();
          if (!latestRoomData || latestRoomData.hostId !== currentUser.uid || latestRoomData.status !== 'round_scoring') {
            return;
          }

          const latestRoundSnap = await transaction.get(roundRef);
          const latestRoundData = latestRoundSnap.data();
          if (!latestRoundData || latestRoundData.scoresFinalized) {
            return;
          }

          const roundUpdates: Record<string, unknown> = {
            scoresFinalized: true,
            scoredAt: firestore.FieldValue.serverTimestamp(),
          };

          rankedResults.forEach((result) => {
            roundUpdates[`submissions.${result.uid}.rank`] = result.rank;
            roundUpdates[`submissions.${result.uid}.score`] = result.score;

            const playerRef = roomRef.collection('players').doc(result.uid);
            transaction.update(playerRef, {
              score: firestore.FieldValue.increment(result.score),
            });
          });

          transaction.update(roundRef, roundUpdates);
          // pick MVP as top-ranked result (if any)
          const topUid = rankedResults[0]?.uid ?? null;
          transaction.update(roomRef, {
            lastRoundScores,
            status: 'round_end',
            roundCountdownStartedAt: firestore.FieldValue.serverTimestamp(),
            mvpUid: topUid,
          });
        });
      } catch (error) {
        finalizedRoundRef.current = null;
        console.error('[useSubmitDrawing] finalize round scores failed', error);
      }
    });

    return unsubscribe;
  }, [roomCode, roundNumber]);

  function startTimer() {
    startTimeRef.current = Date.now();
  }

  async function submitDrawing(params: {
    imageBase64: string;
    aiLabel: string;
    aiScore: number;
  }) {
    if (submitted || submitting) return;

    const user = auth().currentUser;
    if (!user) return;

    setSubmitting(true);
    try {
      const drawDurationMs = Date.now() - startTimeRef.current;
      const roundRef = firestore()
        .collection('rooms').doc(roomCode)
        .collection('rounds').doc(`round_${roundNumber}`);

      // Đọc số submissions hiện tại để tính rank tạm thời
      const roundSnap = await roundRef.get();
      const currentSubmissions = roundSnap.data()?.submissions ?? {};
      const currentCount = Object.keys(currentSubmissions).length;
      const tempRank = currentCount + 1; // Rank tạm = thứ tự submit

      // Optimistically mark as submitted so UI reflects state immediately
      setSubmitted(true);
      try {
        await roundRef.update({
          [`submissions.${user.uid}`]: {
            uid: user.uid,
            displayName: user.displayName ?? 'Người chơi',
            avatarUrl: user.photoURL ?? null,
            imageBase64: params.imageBase64,
            drawDurationMs,
            aiLabel: params.aiLabel,
            aiScore: params.aiScore,
            score: null, // Điểm sẽ được tính sau khi round kết thúc
            submittedAt: firestore.FieldValue.serverTimestamp(),
            rank: tempRank,
          },
        });
      } catch (e) {
        // revert optimistic state on failure
        setSubmitted(false);
        throw e;
      }
    } catch (e) {
      console.error('[submitDrawing]', e);
    } finally {
      setSubmitting(false);
    }
  }

  return { submitDrawing, submitting, submitted, startTimer };
}