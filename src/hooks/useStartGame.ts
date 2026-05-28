// hooks/useStartGame.ts
import firestore from '@react-native-firebase/firestore';

async function startGame(roomId: string, hostId: string) {
    const roomRef = firestore().collection('rooms').doc(roomId);

    await firestore().runTransaction(async (t) => {
        const room = await t.get(roomRef);
        const data = room.data()!;

        // Kiểm tra quyền host
        if (data.hostId !== hostId) {
            throw new Error('Only the host can start the game');
        }

        if (data.status !== 'waiting') {
            throw new Error('Room has already started');
        }

        if ((data.playerCount ?? 0) < 2) {
            throw new Error('At least 2 players are required to start the game');
        }

        // Snapshot playerCount tại thời điểm start
        // Nếu join transaction đang chạy đồng thời → một trong 2 sẽ retry
        t.update(roomRef, {
            status: 'playing',
            startedAt: firestore.FieldValue.serverTimestamp(),
        });
    });
}