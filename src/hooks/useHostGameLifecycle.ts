import { useCallback, useEffect, useRef } from 'react';
import firestore from '@react-native-firebase/firestore';
import { useRoom } from './useRoom';
import { getRandomWord } from '../constants/words';

type TimeoutRef = ReturnType<typeof setTimeout> | null;

export function useHostGameLifecycle(roomId?: string | null) {
    const { room, players, uid } = useRoom(roomId);
    const timersRef = useRef<{ drawing: TimeoutRef; countdown: TimeoutRef; reset: TimeoutRef; listener: (() => void) | null }>({
        drawing: null,
        countdown: null,
        reset: null,
        listener: null,
    });

    const clearTimers = useCallback(() => {
        const timerKeys = Object.keys(timersRef.current) as (keyof typeof timersRef.current)[];
        timerKeys.forEach((key) => {
            const timer = timersRef.current[key];
            if (!timer) return;
            // listener is a function to unsubscribe
            if (key === 'listener') {
                try {
                    (timer as unknown as () => void)();
                } catch (err) {
                    console.warn('[useHostGameLifecycle] listener cleanup failed', err);
                }
                timersRef.current.listener = null;
                return;
            }
            clearTimeout(timer as any);
            timersRef.current[key] = null;
        });
    }, []);

    const runAsHost = useCallback(async (
        handler: (roomRef: any, roomData: any, transaction: any) => Promise<void>
    ) => {
        if (!roomId || !uid) return;

        const roomRef = firestore().collection('rooms').doc(roomId);

        try {
            await firestore().runTransaction(async (transaction) => {
                const roomSnap = await transaction.get(roomRef);
                const roomData = roomSnap.data();

                if (!roomData || roomData.hostId !== uid) {
                    return;
                }

                await handler(roomRef, roomData, transaction);
            });
        } catch (error) {
            console.error('[useHostGameLifecycle]', error);
        }
    }, [roomId, uid]);

    const startRound = useCallback(async (
        transaction: any,
        roomRef: any,
        roundNumber: number,
        roomData: any
    ) => {
        const roundRef = roomRef.collection('rounds').doc(`round_${roundNumber}`);
        transaction.set(roundRef, {
            roundNumber,
            submissions: {},
            createdAt: firestore.FieldValue.serverTimestamp(),
            scoresFinalized: false,
        }, { merge: true });

        transaction.update(roomRef, {
            status: 'drawing',
            currentRound: roundNumber,
            currentDrawerId: roomData.hostId,
            currentTopic: getRandomWord(),
            roundStartedAt: firestore.FieldValue.serverTimestamp(),
            roundCountdownStartedAt: null,
            endedAt: null,
            mvpUid: null,
            lastRoundScores: {},
        });
    }, []);

    const startGame = useCallback(async () => {
        await runAsHost(async (roomRef, roomData, transaction) => {
            if (roomData.status !== 'waiting') return;
            await startRound(transaction, roomRef, 1, roomData);
        });
    }, [runAsHost, startRound]);

    const finishRound = useCallback(async () => {
        await runAsHost(async (roomRef, roomData, transaction) => {
            if (roomData.status !== 'drawing') return;

            transaction.update(roomRef, {
                status: 'round_scoring',
            });
        });
    }, [runAsHost]);

    const advanceRoundOrEndGame = useCallback(async () => {
        await runAsHost(async (roomRef, roomData, transaction) => {
            if (roomData.status !== 'round_end') return;

            const currentRound = Number(roomData.currentRound ?? 0);
            const totalRounds = Number(roomData.totalRounds ?? 1);
            const nextRound = currentRound + 1;

            if (currentRound >= totalRounds) {
                transaction.update(roomRef, {
                    status: 'game_end',
                    endedAt: firestore.FieldValue.serverTimestamp(),
                    roundCountdownStartedAt: null,
                    roundStartedAt: null,
                });
                return;
            }

            await startRound(transaction, roomRef, nextRound, roomData);
        });
    }, [runAsHost, startRound]);

    const resetRoomToWaiting = useCallback(async () => {
        await runAsHost(async (roomRef, roomData, transaction) => {
            if (roomData.status !== 'game_end') return;

            transaction.update(roomRef, {
                status: 'waiting',
                currentRound: 0,
                currentDrawerId: null,
                currentTopic: null,
                roundStartedAt: null,
                roundCountdownStartedAt: null,
                endedAt: null,
                mvpUid: null,
                lastRoundScores: {},
            });
        });
    }, [runAsHost]);

    useEffect(() => {
        clearTimers();

        if (!room || !uid || room.hostId !== uid) {
            return clearTimers;
        }

        if (room.status === 'drawing' && room.roundStartedAt) {
            const durationMs = (room.roundDurationSecs ?? 80) * 1000;
            const elapsedMs = Date.now() - room.roundStartedAt.getTime();
            const remainingMs = Math.max(0, durationMs - elapsedMs);

            if (remainingMs === 0) {
                void finishRound();
            } else {
                timersRef.current.drawing = setTimeout(() => {
                    void finishRound();
                }, remainingMs);
            }

            // Attach a listener to the round doc to detect when all players have submitted
            try {
                const roundRef = firestore().collection('rooms').doc(roomId!).collection('rounds').doc(`round_${room.currentRound}`);
                const unsub = roundRef.onSnapshot((snap) => {
                    const data = snap.data();
                    const submissions = data?.submissions ? Object.keys(data.submissions).length : 0;
                    const playerCount = Object.keys(players || {}).length;
                    if (playerCount > 0 && submissions >= playerCount) {
                        void finishRound();
                    }
                });
                timersRef.current.listener = () => unsub();
            } catch (err) {
                console.warn('[useHostGameLifecycle] failed to attach round listener', err);
            }
        }

        if (room.status === 'round_end' && room.roundCountdownStartedAt) {
            const countdownMs = (room.roundCountdownSecs ?? 5) * 1000;
            const elapsedMs = Date.now() - room.roundCountdownStartedAt.getTime();
            const remainingMs = Math.max(0, countdownMs - elapsedMs);

            if (remainingMs === 0) {
                void advanceRoundOrEndGame();
            } else {
                timersRef.current.countdown = setTimeout(() => {
                    void advanceRoundOrEndGame();
                }, remainingMs);
            }
        }

        if (room.status === 'game_end') {
            const endedAtMs = room.endedAt?.getTime();
            const remainingMs = endedAtMs ? Math.max(0, 10000 - (Date.now() - endedAtMs)) : 10000;

            if (remainingMs === 0) {
                void resetRoomToWaiting();
            } else {
                timersRef.current.reset = setTimeout(() => {
                    void resetRoomToWaiting();
                }, remainingMs);
            }
        }

        return clearTimers;
    }, [advanceRoundOrEndGame, clearTimers, finishRound, resetRoomToWaiting, room, uid, players, roomId]);

    return {
        room,
        uid,
        isHost: !!room && !!uid && room.hostId === uid,
        startGame,
        finishRound,
        advanceRoundOrEndGame,
        resetRoomToWaiting,
    };
}