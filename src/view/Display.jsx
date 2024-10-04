import { Container } from '@mui/material';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { useParams } from 'react-router-dom';
import WaitingDots from '../components/WaitingDots';

import jaCard from '../assets/voting_ja.png';
import neinCard from '../assets/voting_nein.png';
import './styles/Display.css';

export default function Display() {
    const { roomId } = useParams();
    const [roomData, setRoomData] = useState({});
    const [gameStarted, setGameStarted] = useState(false);
    const [voteResults, setVoteResults] = useState({ ja: 0, nein: 0 });

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

    useEffect(() => {
        if (roomData.votingPhase?.inProgress) {
            const votes = roomData.votingPhase.votes || {};
            const voteCount = {
                ja: Object.values(votes).filter(vote => vote === "yes").length,
                nein: Object.values(votes).filter(vote => vote === "no").length
            };
            setVoteResults(voteCount);
        }
    }, [roomData]);

    return (
        <Container className='display-container'>
            {roomData && roomData.name ? (
                <div className='game-view'>
                    <h1>{roomData.name} - {roomData.gameId}</h1>
                    <p>{roomData.players?.length || 0} players</p>
                    <div className='display-players'>
                        {roomData.players?.map((playerName, index) => (
                            <div className='item' key={index}>
                                <button id='kick-player' onClick={() => kickPlayer(playerName)}>Kick</button>
                                <p>{playerName}</p>
                            </div>
                        ))}
                    </div>

                    {roomData.votingPhase?.inProgress && <WaitingDots text='Voting phase in progress' />}
                    {!roomData.votingPhase?.inProgress ? (
                        <button onClick={startVotingPhase}>Start Voting Phase</button>
                    ) : (
                        <div className='display-results'>
                            <h2 className='item'><img src={jaCard} height={'50px'} />Ja: {voteResults.ja}</h2>
                            <h2 className='item'><img src={neinCard} height={'50px'} />Nein: {voteResults.nein}</h2>
                        </div>
                    )}

                </div>
            ) : (
                <div className='waiting-data'>
                    <WaitingDots text='Loading room data' />
                </div>
            )}
        </Container>
    );
}
