import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import Collapse from '@mui/material/Collapse';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import WaitingDots from '../components/WaitingDots';
import ExpandMoreIcon from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessIcon from '@mui/icons-material/ExpandLessRounded';
import VoteResult from '../components/VoteResult/VoteResult';
import ThemedButton from '../Theme/Button/ThemedButton';
import './styles/Display.css';

export default function Display() {
    const { roomId } = useParams();
    const [roomData, setRoomData] = useState({});
    const [voteResults, setVoteResults] = useState({ ja: 0, nein: 0 });
    const [voteCount, setVoteCount] = useState(0);
    const [playerCount, setPlayerCount] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');
    const [playerListExpanded, setPlayerListExpanded] = useState(false);
    const [displayResults, setDisplayResults] = useState({
        show: false,
        results: {
        },
    });

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
        setDisplayResults({ show: false, results: {} });
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
        if (roomData.players) {
            setPlayerCount(roomData.players.length);
        }
        if (roomData.votingPhase?.inProgress) {
            const votes = roomData.votingPhase.votes || {};
            const voteCount = {
                ja: Object.values(votes).filter(vote => vote === "yes").length,
                nein: Object.values(votes).filter(vote => vote === "no").length
            };
            const totalVotes = Object.keys(votes).length;
            setVoteCount(totalVotes);
            setVoteResults(voteCount);
        }
    }, [roomData]);

    useEffect(() => {
        if (voteCount === playerCount && voteCount !== 0) {
            endVotingPhase();
        }
    }, [voteCount, playerCount]);

    useEffect(() => {
        setTimeout(() => {
            setErrorMessage(null);
        }, 10000);
    }, [errorMessage]);

    function calculateResults() {
        const totalVotes = voteResults.ja + voteResults.nein;
        if (totalVotes === 0) {
            console.error('Unable to retrieve total votes');
            return;
        }
        if (!roomData.votingPhase || !roomData.votingPhase.votes) {
            console.error('roomData.votingPhase or roomData.votingPhase.votes is undefined');
            return;
        }
        const jaCount = totalVotes - voteResults.nein;
        const neinCount = totalVotes - voteResults.ja;
        if (jaCount === neinCount) {
            setDisplayResults({
                show: true,
                results: {
                    winner: 'tie',
                    ja: jaCount,
                    nein: neinCount,
                }
            });
            return;
        } else {
            setDisplayResults({
                show: true,
                results: {
                    winner: jaCount > neinCount ? 'ja' : 'nein',
                    ja: jaCount,
                    nein: neinCount,
                }
            });
        }
    }

    const endVotingPhase = async () => {
        const roomRef = doc(db, 'rooms', roomId);
        await updateDoc(roomRef, {
            "votingPhase.inProgress": false,
        });
        calculateResults();
    };

    useEffect(() => {
        console.log("playerListExpanded state: ", playerListExpanded);
    }, [playerListExpanded]);

    return (
        <Container className='display-container'>
            {roomData && roomData.name ? (
                <div className='game-view'>
                    <div id='page-title'>
                        <h1>{roomData.name}</h1>
                        <span id='roomId'>{roomData.gameId}</span>
                    </div>

                    <div className='players-container mobile-restrict'>
                        <p id='countPlayers'>{roomData.players?.length || 0} joueurs</p>
                        {roomData.players?.length > 0 && (
                            <IconButton id='expand-players' onClick={() => setPlayerListExpanded(prev => !prev)}>
                                {playerListExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                        )}
                    </div>
                    <Collapse in={playerListExpanded} timeout="auto" unmountOnExit id='collapse'>
                        <div className='player-dropdown'>
                            {roomData.players?.map((playerName, index) => (
                                <div className='item' key={index}>
                                    <ThemedButton
                                        text={playerName}
                                        onClick={() => kickPlayer(playerName)}
                                        id='kick-player'
                                    />
                                    <p>{playerName}</p>
                                </div>
                            ))}
                        </div>
                    </Collapse>

                    {/* Desktop Only */}
                    <div className='display-players desktop-restrict'>
                        {roomData.players?.map((playerName, index) => (
                            <div className='item' key={index}>
                                <ThemedButton
                                    text={playerName}
                                    onClick={() => kickPlayer(playerName)}
                                    id='kick-player'
                                />
                                <p>{playerName}</p>
                            </div>
                        ))}
                    </div>

                    {roomData.votingPhase?.inProgress && <WaitingDots text='Phase de vote en cours' />}
                    {!roomData.votingPhase?.inProgress ? (
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                            <ThemedButton text='Commencer la phase de vote' onClick={startVotingPhase} />
                            <span>{errorMessage && <span className='error-message'>{errorMessage}</span>}</span>
                        </div>
                    ) : (
                        <ThemedButton text='Arrêter la phase de vote' onClick={endVotingPhase} />
                    )}
                    <VoteResult displayResults={displayResults} />
                </div>
            ) : (
                <div className='waiting-data'>
                    <WaitingDots text='Chargement des données de la salle' />
                </div>
            )}
        </Container>
    );
}
