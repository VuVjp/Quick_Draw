import { useEffect, useRef } from 'react';
import firestore from '@react-native-firebase/firestore';
import type { RoomState } from './useRoom';

type HostElectionOptions = {
    timeoutMs?: number;
};

const toMillis = (value: any): number => {
    if (!value) return 0;
    if (value instanceof Date) return value.getTime();
    if (typeof value?.toDate === 'function') return value.toDate().getTime();
    if (typeof value === 'number') return value;
    return 0;
};

export function useHostElection(
    roomId?: string | null,
    room?: RoomState | null,
    players?: Record<string, any> | null,
    uid?: string | null,
    options?: HostElectionOptions
) {
    const timeoutMs = options?.timeoutMs ?? 30000;
    const inFlightRef = useRef(false);

    useEffect(() => {
        if (!roomId || !room || !players || !uid) return;

        const hostId = room.hostId;
        const host = hostId ? players[hostId] : null;
        const hostLastSeenMs = toMillis(host?.lastSeen);
        const hostTimedOut = !!hostId && hostLastSeenMs > 0 && Date.now() - hostLastSeenMs > timeoutMs;
        const shouldElect = !hostId || !host || hostTimedOut;

        if (!shouldElect) return;

        const candidates = Object.entries(players)
            .map(([id, player]) => ({
                id,
                joinedAtMs: toMillis(player?.joinedAt),
                lastSeenMs: toMillis(player?.lastSeen),
            }))
            .filter((candidate) => candidate.joinedAtMs > 0)
            .filter((candidate) => {
                if (!candidate.lastSeenMs) return true;
                return Date.now() - candidate.lastSeenMs <= timeoutMs;
            })
            .sort((a, b) => a.joinedAtMs - b.joinedAtMs);

        const nextHostId = candidates[0]?.id;
        if (!nextHostId || nextHostId !== uid) return;
        if (inFlightRef.current) return;

        inFlightRef.current = true;
        const roomRef = firestore().collection('rooms').doc(roomId);

        const runElection = async () => {
            try {
                await firestore().runTransaction(async (tx) => {
                    const roomSnap = await tx.get(roomRef);
                    const roomData = roomSnap.data();
                    if (!roomData) return;

                    const currentHostId = roomData.hostId ?? null;
                    if (currentHostId && currentHostId !== hostId) return;

                    const newHostRef = roomRef.collection('players').doc(nextHostId);
                    const newHostSnap = await tx.get(newHostRef);
                    if (!newHostSnap.exists) return;

                    tx.update(roomRef, { hostId: nextHostId });
                    tx.set(newHostRef, { isHost: true }, { merge: true });

                    if (currentHostId && currentHostId !== nextHostId) {
                        const oldHostRef = roomRef.collection('players').doc(currentHostId);
                        tx.set(oldHostRef, { isHost: false }, { merge: true });
                    }
                });
            } catch (err) {
                console.warn('[useHostElection] failed to elect host', err);
            } finally {
                inFlightRef.current = false;
            }
        };

        void runElection();
    }, [roomId, room, players, uid, timeoutMs]);
}
