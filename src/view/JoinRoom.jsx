import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../config/firebase';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import Container from '@mui/material/Container';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import WaitingDots from '../components/WaitingDots';
import './styles/JoinRoom.css';

import CardYes from '../assets/voting_ja.png';
import CardNo from '../assets/voting_nein.png';

export default function JoinRoom() {
  const { roomId } = useParams();
  const [roomData, setRoomData] = useState(null);
  const playerName = localStorage.getItem('playerName') || 'Guest';
  const [votingPhase, setVotingPhase] = useState(false);
  const [selectedVote, setSelectedVote] = useState(null);
  const [voteNumber, setVoteNumber] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const submitVote = async () => {
    if (roomData.votingPhase.votes[playerName]) {
      alert('You have already voted');
      return;
    }
    if (!selectedVote) {
      setErrorMessage('Please select a vote');
      return;
    }
    if (selectedVote) {
      console.log('submitting vote', selectedVote);
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, {
        [`votingPhase.votes.${playerName}`]: selectedVote,
      });
    }
  }

  function hasVoted() {
    console.log('playerName', playerName);
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
      alert('You have been kicked from the room');
      window.location.href = '/';
    }
  }, [roomData, playerName]);

  useEffect(() => {
    if (roomData && roomData.votingPhase.inProgress === true) {
      console.log('voting phase started');
      setVotingPhase(true);
    }
    if (roomData && hasVoted()) {
      setSelectedVote('done');
      setVotingPhase(false);
    }
  }, [roomData]);

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

  // if voting phase end in roomData, clear selectedVote
  useEffect(() => {
    if (roomData && roomData.votingPhase?.inProgress === false) {
      setSelectedVote(null);
      setVotingPhase(false);
    }
  }, [roomData]);

  return (
    <Container div="game-container">
      {roomData ? (
        <div className='game-view'>
          <h1><span style={{ fontStyle: 'italic' }}>Party: {roomData.name} - {roomData.gameId}</span></h1>
          <div className='display-players'>
            {roomData.players.map((player, index) => (
              <div key={index} className='item' style={{ gap: '4px' }}>
                <PersonRoundedIcon />
                {player}
              </div>
            ))}
          </div>
          {(!votingPhase && selectedVote !== 'done')  ? (
            <WaitingDots text='Waiting for voting phase' />
          ) : (selectedVote !== 'done') ? (
            <div className='votingPhase'>
              <div className='voting-cards'>
                <div
                  className={`item vote-ja ${getCardClass('yes')}`}
                  onClick={() => handleVote('yes')}
                >
                  <img src={CardYes} alt='Ja' height={window.innerWidth < 600 ? 100 : 200} />
                </div>
                <div
                  className={`item vote-no ${getCardClass('no')}`}
                  onClick={() => handleVote('no')}
                >
                  <img src={CardNo} alt='Nein' height={window.innerWidth < 600 ? 100 : 200} />
                </div>
              </div>
              <button className='submit-vote' onClick={submitVote}>Valider</button>
              {errorMessage && <p>{errorMessage}</p>}
            </div>
          ): null }
          {selectedVote === 'done' && (
            <div>
              <h2>Vous avez voté</h2>
            </div>
          )}
        </div>
      ) : (
        <WaitingDots text="Loading room data" />
      )}
    </Container>
  );
}
