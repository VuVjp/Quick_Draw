import { useEffect, useRef } from 'react';
import firestore from '@react-native-firebase/firestore';
import type { RoomState } from './useRoom';

type PruneStalePlayersOptions = {
    timeoutMs?: number;
};

const toMillis = (value: any): number => {
    if (!value) return 0;
    if (value instanceof Date) return value.getTime();
    if (typeof value?.toDate === 'function') return value.toDate().getTime();
    if (typeof value === 'number') return value;
    return 0;
};

export function usePruneStalePlayers(
    roomId?: string | null,
    room?: RoomState | null,
    players?: Record<string, any> | null,
    uid?: string | null,
    options?: PruneStalePlayersOptions
) {
    const timeoutMs = options?.timeoutMs ?? 30000;
    const inFlightRef = useRef(false);

    useEffect(() => {
        let cancelled = false;

        if (!roomId || !room || !players || !uid || room.hostId !== uid) {
            return () => {
                cancelled = true;
            };
        }

        const now = Date.now();
        const stalePlayers = Object.entries(players)
            .map(([id, player]) => ({
                id,
                joinedAtMs: toMillis(player?.joinedAt),
                lastSeenMs: toMillis(player?.lastSeen),
            }))
            .filter((candidate) => candidate.joinedAtMs > 0)
            .filter((candidate) => candidate.id !== room.hostId)
            .filter((candidate) => candidate.lastSeenMs > 0 && now - candidate.lastSeenMs > timeoutMs);

        if (!stalePlayers.length) return;
        if (inFlightRef.current) {
            return () => {
                cancelled = true;
            };
        }

        inFlightRef.current = true;
        const roomRef = firestore().collection('rooms').doc(roomId);

        const runPrune = async () => {
            try {
                if (cancelled) return;

                await firestore().runTransaction(async (tx) => {
                    if (cancelled) return;

                    const roomSnap = await tx.get(roomRef);
                    if (!roomSnap.exists) return;

                    const currentHostId = roomSnap.data()?.hostId ?? null;
                    const candidateIds = stalePlayers
                        .filter((candidate) => candidate.id !== currentHostId)
                        .map((candidate) => candidate.id);

                    if (!candidateIds.length) return;

                    let deleteCount = 0;
                    for (const playerId of candidateIds) {
                        const playerRef = roomRef.collection('players').doc(playerId);
                        const playerSnap = await tx.get(playerRef);
                        if (!playerSnap.exists) continue;

                        tx.delete(playerRef);
                        deleteCount += 1;
                    }

                    if (deleteCount > 0) {
                        tx.update(roomRef, {
                            playerCount: firestore.FieldValue.increment(-deleteCount),
                        });
                    }
                });
            } catch (err) {
                if (cancelled) return;

                console.warn('[usePruneStalePlayers] failed to prune stale players', err);
            } finally {
                if (!cancelled) {
                    inFlightRef.current = false;
                }
            }
        };

        void runPrune();

        return () => {
            cancelled = true;
        };
    }, [roomId, room, players, uid, timeoutMs]);
}