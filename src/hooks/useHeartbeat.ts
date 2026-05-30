import { useEffect, useRef } from 'react';
import firestore from '@react-native-firebase/firestore';

type HeartbeatOptions = {
    intervalMs?: number;
};

export function useHeartbeat(
    roomId?: string | null,
    uid?: string | null,
    options?: HeartbeatOptions
) {
    const intervalMs = options?.intervalMs ?? 5000;
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const activeRef = useRef(false);

    const stopHeartbeat = () => {
        activeRef.current = false;
        if (timerRef.current) {
            clearInterval(timerRef.current as any);
            timerRef.current = null;
        }
    };

    useEffect(() => {
        if (!roomId || !uid) return stopHeartbeat;

        const playerRef = firestore()
            .collection('rooms')
            .doc(roomId)
            .collection('players')
            .doc(uid);
        activeRef.current = true;

        const sendHeartbeat = async () => {
            try {
                if (!activeRef.current) return;
                await playerRef.set(
                    {
                        lastSeen: firestore.FieldValue.serverTimestamp(),
                        isOnline: true,
                    },
                    { merge: true }
                );
            } catch (err) {
                console.warn('[useHeartbeat] failed to update lastSeen', err);
            }
        };

        void sendHeartbeat();
        timerRef.current = setInterval(sendHeartbeat, intervalMs);

        return () => {
            stopHeartbeat();
        };
    }, [roomId, uid, intervalMs]);

    return { stopHeartbeat };
}
