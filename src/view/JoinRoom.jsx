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
  const [selectedVote, setSelectedVote] = useState(null); // New state for selected vote

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

  return (
    <Container div="game-container">
      {roomData ? (
         <div>
          <h1><span style={{ fontStyle: 'italic' }}>{roomData.name}</span></h1>
          <ul className='display-players'>
            {roomData.players.map((player, index) => (
              <li key={index} className='item' style={{ gap: '4px' }}>
                <PersonRoundedIcon />
                {player}
              </li>
            ))}
          </ul>
          <div>
            {!votingPhase ? (
              <WaitingDots text='Waiting for voting phase' />
            ) : (
              <div className='votingPhase'>
                <div className='voting-cards'>
                  <div
                    className={`item vote-ja ${getCardClass('yes')}`}
                    onClick={() => handleVote('yes')}
                  >
                    <img src={CardYes} alt='Ja' height={window.innerWidth < 600 ? 100 : 200} />
                    <p style={{ padding: 0, margin: 0 }}>Ja</p>
                  </div>
                  <div
                    className={`item vote-no ${getCardClass('no')}`}
                    onClick={() => handleVote('no')}
                  >
                    <img src={CardNo} alt='Nein' height={window.innerWidth < 600 ? 100 : 200} />
                    <p style={{ padding: 0, margin: 0 }}>Nein</p>
                  </div>
                </div>
                <button id='submit-vote'>Valider</button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <WaitingDots text="Loading room data" />
      )}
    </Container>
  );
}
