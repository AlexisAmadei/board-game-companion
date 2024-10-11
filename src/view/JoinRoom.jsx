import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../config/firebase';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import WaitingDots from '../components/WaitingDots';
import './styles/JoinRoom.css';

import { Collapse, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessIcon from '@mui/icons-material/ExpandLessRounded';

import jaCard from '../assets/voting_ja.webp';
import neinCard from '../assets/voting_nein.webp';

export default function JoinRoom() {
  const { roomId } = useParams();
  const [roomData, setRoomData] = useState(null);
  const playerName = localStorage.getItem('playerName') || 'Guest';
  const [votingPhase, setVotingPhase] = useState(false);
  const [selectedVote, setSelectedVote] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [playerListExpanded, setPlayerListExpanded] = useState(false);
  const [displayResults, setDisplayResults] = useState({
    show: false,
    results: {
    },
  });
  const [voteResults, setVoteResults] = useState({ ja: 0, nein: 0 });
  const [playerCount, setPlayerCount] = useState(0);
  const [voteCount, setVoteCount] = useState(0);

  const submitVote = async () => {
    if (roomData.votingPhase.votes[playerName]) {
      alert('Vous avez déjà voté');
      return;
    }
    if (!selectedVote) {
      setErrorMessage('Selectionnez un vote');
      return;
    }
    if (selectedVote) {
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, {
        [`votingPhase.votes.${playerName}`]: selectedVote,
      });
    }
  }

  function hasVoted() {
    if (roomData.votingPhase.votes[playerName]) {
      return true;
    }
    return false;
  };

  useEffect(() => {
    const roomRef = doc(db, 'rooms', roomId);
    const fetchRoom = async () => {
      const docSnap = await getDoc(roomRef);
      if (docSnap.exists()) {
        setRoomData(docSnap.data());
        if (!docSnap.data().players.includes(playerName)) {
          await updateDoc(roomRef, {
            players: [...docSnap.data().players, playerName],
          });
        }
      }
    };
    fetchRoom();
    const unsubscribe = onSnapshot(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        setRoomData(snapshot.data());
      }
    });
    return () => unsubscribe();
  }, [roomId, playerName]);

  useEffect(() => {
    if (roomData && !roomData.players.includes(playerName)) {
      alert('Vous avez été retiré de la partie (take the L)');
      window.location.href = '/';
    }
  }, [roomData, playerName]);

  useEffect(() => {
    if (roomData) {
      const { votingPhase, players } = roomData;
      if (votingPhase.inProgress === true) {
        setVotingPhase(true);
        setDisplayResults({ show: false, results: {} });
        const votes = votingPhase.votes || {};
        const voteCount = {
          ja: Object.values(votes).filter(vote => vote === 'yes').length,
          nein: Object.values(votes).filter(vote => vote === 'no').length,
        };
        const totalVotes = Object.keys(votes).length;
        setVoteCount(totalVotes);
        setVoteResults(voteCount);
      }
      if (players) {
        setPlayerCount(players.length);
      }
      if (hasVoted()) {
        setSelectedVote('done');
        setVotingPhase(false);
      }
      if (votingPhase.inProgress === false) {
        setSelectedVote(null);
        setVotingPhase(false);
      }
    }
  }, [roomData]);

  useEffect(() => {
    console.log('voteResults', voteResults);
    if (voteCount === playerCount && voteCount !== 0) {
      setDisplayResults({ show: true, results: voteResults });
    }
  }, [voteResults]);

  const handleVote = (vote) => {
    if (selectedVote === vote) {
      setSelectedVote(null);
    } else {
      setSelectedVote(vote);
    }
  };

  const getCardClass = (cardType) => {
    if (!selectedVote) return '';
    return selectedVote === cardType ? 'selected' : 'not-selected';
  };

  return (
    <div div="game-container">
      {roomData ? (
        <div className='game-view'>
          <div id='page-title'>
            <h1 style={{ fontStyle: 'italic' }}>{roomData.name}</h1>
            <span>{roomData.gameId}</span>
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
                  <p>{playerName}</p>
                </div>
              ))}
            </div>
          </Collapse>

          {(!votingPhase && selectedVote !== 'done') ? (
            <WaitingDots text='Waiting for voting phase' />
          ) : (selectedVote !== 'done') ? (
            <div className='votingPhase'>
              <div className='voting-cards'>
                <div
                  className={`item vote-ja ${getCardClass('yes')}`}
                  onClick={() => handleVote('yes')}
                >
                  <img src={jaCard} alt='Ja' height={window.innerWidth < 600 ? 100 : 200} />
                </div>
                <div
                  className={`item vote-no ${getCardClass('no')}`}
                  onClick={() => handleVote('no')}
                >
                  <img src={neinCard} alt='Nein' height={window.innerWidth < 600 ? 100 : 200} />
                </div>
              </div>
              <button className='submit-vote' onClick={submitVote}>Valider</button>
              {errorMessage && <p>{errorMessage}</p>}
            </div>
          ) : null}
          {selectedVote === 'done' && (
            <div>
              <h2>Vous avez voté</h2>
            </div>
          )}
          {displayResults.show && (
            <div className='resultContainer'>
              {displayResults.results.ja > displayResults.results.nein ? (
                <div className='winnerCard'>
                  <img src={jaCard} height={200} alt='Ja' />
                  <p style={{ fontSize: '32px' }}>Chancelier élu avec {displayResults.results.ja} voix</p>
                </div>
              ) : displayResults.results.ja < displayResults.results.nein ? (
                <div className='winnerCard'>
                  <img src={neinCard} height={200} alt='Nein' />
                  <p style={{ fontSize: '32px' }}>Chancelier refusé avec {displayResults.results.nein} voix</p>
                </div>
              ) : (
                <div className='winnerCard'>
                  <p style={{ fontSize: '32px' }}>Égalité !</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <WaitingDots text="Chargement en cours" />
      )}
    </div>
  );
}
