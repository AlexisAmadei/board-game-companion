import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../config/firebase";

export default function cleanOldRooms(rooms) {
    const now = new Date();
    const limit = 1000 * 60 * 60 * 48; // 48 hours
    rooms.forEach(room => {
        const diff = now - room.createdAt?.toDate();
        if (diff > limit) {
            const roomRef = doc(db, 'rooms', room.gameId);
            deleteDoc(roomRef);
        }
    });
}