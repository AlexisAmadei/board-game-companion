import Collapse from '@mui/material/Collapse';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { useParams } from 'react-router-dom';
import WaitingDots from '../components/WaitingDots';
import ExpandMoreIcon from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessIcon from '@mui/icons-material/ExpandLessRounded';

import jaCard from '../assets/voting_ja.png';
import neinCard from '../assets/voting_nein.png';
import './styles/Display.css';

export default function Display() {
    const { roomId } = useParams();
    const [roomData, setRoomData] = useState({});
    const [gameStarted, setGameStarted] = useState(false);
    const [voteResults, setVoteResults] = useState({ ja: 0, nein: 0 });
    const [voteCount, setVoteCount] = useState(0);
    const [playerCount, setPlayerCount] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');
    const [displayResults, setDisplayResults] = useState({
        show: false,
        results: {
        },
    });
    const [playerListExpanded, setPlayerListExpanded] = useState(false);

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
        // Player limit
        // if (playerCount < 5) {
        //     setErrorMessage('5 joueur minimum pour commencer la phase de vote');
        //     return;
        // }
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
            return;
        }
        if (!roomData.votingPhase || !roomData.votingPhase.votes) {
            console.error('roomData.votingPhase or roomData.votingPhase.votes is undefined');
            return;
        }
        const jaCount = totalVotes - voteResults.nein;
        const neinCount = totalVotes - voteResults.ja;
        const winningVote = voteResults.ja > voteResults.nein ? 'ja' : 'nein';
        setDisplayResults({
            show: true,
            results: {
                winner: winningVote,
                ja: jaCount,
                nein: neinCount,
            }
        });
    }

    const endVotingPhase = async () => {
        const roomRef = doc(db, 'rooms', roomId);
        await updateDoc(roomRef, {
            "votingPhase.inProgress": false,
        });
        calculateResults();
    };

    const fakePlayers = ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5', 'Player 6', 'Player 7', 'Player 8', 'Player 9', 'Player 10'];

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
                        <IconButton id='expand-players' onClick={() => setPlayerListExpanded(prev => !prev)}>
                            {playerListExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                    </div>
                    <Collapse in={playerListExpanded} timeout="auto" unmountOnExit id='collapse'>
                        <div className='player-dropdown'>
                            {roomData.players?.map((playerName, index) => (
                                <div className='item' key={index}>
                                    <button id='kick-player' onClick={() => kickPlayer(playerName)}>Expulser</button>
                                    <p>{playerName}</p>
                                </div>
                            ))}
                        </div>
                    </Collapse>

                    {/* Desktop Only */}
                    <div className='display-players desktop-restrict'>
                        {roomData.players?.map((playerName, index) => (
                            <div className='item' key={index}>
                                <button id='kick-player' onClick={() => kickPlayer(playerName)}>Expulser</button>
                                <p>{playerName}</p>
                            </div>
                        ))}
                    </div>

                    {roomData.votingPhase?.inProgress && <WaitingDots text='Phase de vote en cours' />}
                    {!roomData.votingPhase?.inProgress ? (
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                            <button onClick={startVotingPhase}>Commencer une phase de vote</button>
                            <span>{errorMessage && <span className='error-message'>{errorMessage}</span>}</span>
                        </div>
                    ) : (
                        // Live results
                        // <div className='display-results'>
                        //     <div className='cardresult'>
                        //         <h2 className='item'><img src={jaCard} height={'50px'} />Ja: {voteResults.ja}</h2>
                        //         <h2 className='item'><img src={neinCard} height={'50px'} />Nein: {voteResults.nein}</h2>
                        //     </div>
                        // </div>
                        <button onClick={endVotingPhase}>Terminer la phase de vote {voteCount}/{playerCount}</button>
                    )}
                    {displayResults.show && (
                        <div className='resultContainer'>
                            {displayResults.results.winner === 'ja' ? (
                                <div className='winnerCard'>
                                    <img src={jaCard} height={'200px'} alt='carte de vote ja' />
                                    <p style={{ fontSize: '32px' }}>Chancelier élu avec {displayResults.results.ja} voix</p>
                                </div>
                            ) : (
                                <div className='winnerCard'>
                                    <img src={neinCard} height={'200px'} alt='carte de vote nein' />
                                    <p style={{ fontSize: '32px' }}>Chancelier refusé avec {displayResults.results.nein} voix </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className='waiting-data'>
                    <WaitingDots text='Chargement des données de la salle' />
                </div>
            )}
        </Container>
    );
}
