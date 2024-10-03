import { Container } from '@mui/material';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { useParams } from 'react-router-dom';

export default function Display() {
    const { roomId } = useParams();
    const [roomData, setRoomData] = useState({});
    const [gameStarted, setGameStarted] = useState(false);

    useEffect(() => {
        const roomRef = doc(db, 'rooms', roomId);
        const unsubscribe = onSnapshot(roomRef, (snapshot) => {
            if (snapshot.exists()) {
                setRoomData(snapshot.data());
            }
        });

        return () => unsubscribe();
    }, [roomId]);

    const startVotingPhase = async () => {
        const roomRef = doc(db, 'rooms', roomId);
        await updateDoc(roomRef, {
            "votingPhase.inProgress": true,
            "votingPhase.votes": {},
            "votingPhase.totalVotes": 0,
        });
    };

    const kickPlayer = async (playerName) => {
        const roomRef = doc(db, 'rooms', roomId);
        await updateDoc(roomRef, {
            players: roomData.players.filter((player) => player !== playerName),
        });
    };

    return (
        <Container>
            {roomData && roomData.name ? (
                <div>
                    <h1>{roomData.name} - {roomData.gameId}</h1>
                    <p>{roomData.players?.length || 0} players</p>
                    <ul>
                        {roomData.players?.map((playerName, index) => (
                            <li key={index}>{playerName}</li>
                        ))}
                    </ul>
                    {!roomData.votingPhase?.inProgress && (
                        <button onClick={startVotingPhase}>Start Voting Phase</button>
                    )}
                    {roomData.votingPhase?.inProgress && <h3>Voting is in progress...</h3>}
                </div>
            ) : (
                <div>
                    <h1>Loading room data...</h1>
                </div>
            )}
        </Container>
    );
}
