import { useCallback, useEffect, useRef } from 'react';
import firestore from '@react-native-firebase/firestore';
import { useRoom } from './useRoom';
import { getRandomWord } from '../constants/words';

type TimeoutRef = ReturnType<typeof setTimeout> | null;

export function useHostGameLifecycle(roomId?: string | null) {
    const { room, players, uid } = useRoom(roomId);
    const timersRef = useRef<{ drawing: TimeoutRef; countdown: TimeoutRef; reset: TimeoutRef; listener: (() => void) | null; roomListener: (() => void) | null }>({
        drawing: null,
        countdown: null,
        reset: null,
        listener: null,
        roomListener: null,
    });

    const clearTimers = useCallback(() => {
        // clear any timeouts
        if (timersRef.current.drawing) {
            clearTimeout(timersRef.current.drawing as any);
            timersRef.current.drawing = null;
        }
        if (timersRef.current.countdown) {
            clearTimeout(timersRef.current.countdown as any);
            timersRef.current.countdown = null;
        }
        if (timersRef.current.reset) {
            clearTimeout(timersRef.current.reset as any);
            timersRef.current.reset = null;
        }

        // unsubscribe any listeners
        if (timersRef.current.listener) {
            try {
                timersRef.current.listener();
            } catch (err) {
                console.warn('[useHostGameLifecycle] listener cleanup failed', err);
            }
            timersRef.current.listener = null;
        }
        if (timersRef.current.roomListener) {
            try {
                timersRef.current.roomListener();
            } catch (err) {
                console.warn('[useHostGameLifecycle] roomListener cleanup failed', err);
            }
            timersRef.current.roomListener = null;
        }
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

        // after the transactional update, remove any round documents in the rounds subcollection
        try {
            const roundsCol = firestore().collection('rooms').doc(roomId!).collection('rounds');
            const snap = await roundsCol.get();
            if (!snap.empty) {
                const batch = firestore().batch();
                snap.docs.forEach((d) => batch.delete(d.ref));
                await batch.commit();
            }
        } catch (err) {
            console.warn('[useHostGameLifecycle] failed to delete rounds after reset', err);
        }

        // reset player scores in players subcollection
        try {
            const playersCol = firestore().collection('rooms').doc(roomId!).collection('players');
            const pSnap = await playersCol.get();
            if (!pSnap.empty) {
                const batch = firestore().batch();
                pSnap.docs.forEach((d) => {
                    batch.update(d.ref, { score: 0 });
                });
                await batch.commit();
            }
        } catch (err) {
            console.warn('[useHostGameLifecycle] failed to reset player scores after reset', err);
        }
    }, [runAsHost, roomId]);

    const manualReset = useCallback(async () => {
        try {
            await resetRoomToWaiting();
        } catch (err) {
            console.warn('[useHostGameLifecycle] resetRoomToWaiting failed', err);
        }

        try {
            const roomRef = firestore().collection('rooms').doc(roomId!);
            const snap = await roomRef.get();
            const data = snap.data();
            if (data && data.status === 'game_end') {
                console.log('[useHostGameLifecycle] manual fallback resetting room to waiting');
                await roomRef.update({
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
                // remove round docs as well
                try {
                    const roundsCol = roomRef.collection('rounds');
                    const roundsSnap = await roundsCol.get();
                    if (!roundsSnap.empty) {
                        const batch = firestore().batch();
                        roundsSnap.docs.forEach((d) => batch.delete(d.ref));
                        await batch.commit();
                    }
                } catch (e) {
                    console.warn('[useHostGameLifecycle] failed to delete rounds in manual fallback', e);
                }

                // reset player scores in manual fallback as well
                try {
                    const playersCol = roomRef.collection('players');
                    const pSnap = await playersCol.get();
                    if (!pSnap.empty) {
                        const batch = firestore().batch();
                        pSnap.docs.forEach((d) => batch.update(d.ref, { score: 0 }));
                        await batch.commit();
                    }
                } catch (e) {
                    console.warn('[useHostGameLifecycle] failed to reset player scores in manual fallback', e);
                }
            }
        } catch (e) {
            console.warn('[useHostGameLifecycle] manual reset fallback failed', e);
        }
    }, [resetRoomToWaiting, roomId]);

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

            if (timersRef.current.reset) {
                clearTimeout(timersRef.current.reset as any);
                timersRef.current.reset = null;
            }

            if (remainingMs === 0) {
                void manualReset();
            } else {
                timersRef.current.reset = setTimeout(() => {
                    void manualReset();
                }, remainingMs);
            }
        }

        // host-level room listener: ensure manualReset is scheduled when status flips to game_end
        if (room.hostId === uid && roomId) {
            try {
                const roomRef = firestore().collection('rooms').doc(roomId);
                const unsubRoom = roomRef.onSnapshot((snap) => {
                    const data = snap.data();
                    if (!data) return;
                    if (data.status === 'game_end') {
                        const endedAt = data.endedAt && typeof data.endedAt.toDate === 'function' ? data.endedAt.toDate() : data.endedAt;
                        const endedAtMs = endedAt ? endedAt.getTime() : null;
                        const remainingMs = endedAtMs ? Math.max(0, 10000 - (Date.now() - endedAtMs)) : 10000;

                        if (timersRef.current.reset) {
                            clearTimeout(timersRef.current.reset as any);
                            timersRef.current.reset = null;
                        }

                        timersRef.current.reset = setTimeout(() => {
                            void manualReset();
                        }, remainingMs);
                    }
                });
                timersRef.current.roomListener = () => unsubRoom();
            } catch (err) {
                console.warn('[useHostGameLifecycle] failed to attach room snapshot listener', err);
            }
        }

        return clearTimers;
    }, [advanceRoundOrEndGame, clearTimers, finishRound, resetRoomToWaiting, manualReset, room, uid, players, roomId]);

    return {
        room,
        uid,
        isHost: !!room && !!uid && room.hostId === uid,
        startGame,
        finishRound,
        advanceRoundOrEndGame,
        resetRoomToWaiting,
        manualReset,
    };
}