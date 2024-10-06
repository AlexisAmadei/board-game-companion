import React, { useCallback, useState } from 'react';
import { Box, Button, Modal, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import './styles/App.css';
import logo from '../assets/kiwiDevLogo-transparent.png';

export default function App() {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const [isModalRoomIdOpen, setIsModalRoomIdOpen] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleHostGame = useCallback(() => {
    navigate('/host');
  }, [navigate]);

  const joinRoom = async (pseudo) => {
    try {
      if (!roomId.trim() || !pseudo.trim()) {
        setErrorMessage('Room ID and Player Name cannot be empty.');
        return;
      }
      const roomRef = collection(db, 'rooms');
      const q = query(roomRef, where('gameId', '==', roomId));
      const roomSnapshot = await getDocs(q);
      if (roomSnapshot.empty) {
        setErrorMessage('Room not found. Please check the Room ID.');
        return;
      }
      roomSnapshot.forEach(async (doc) => {
        const roomData = doc.data();
        const updatedPlayers = [...roomData.players, pseudo];
        if (roomData.players.includes(pseudo)) {
          setErrorMessage('Player already exists in this room.');
          return;
        }
        await updateDoc(doc.ref, {
          players: updatedPlayers,
        });
        localStorage.setItem('playerName', pseudo);
        navigate(`/join/${roomId}`);
      });
    } catch (error) {
      console.error('Error joining the room: ', error);
      setErrorMessage('An error occurred while joining the room. Please try again.');
    }
  };

  const handleJoinRoom = async () => {
    await joinRoom(playerName);
  };

  const enterRoomId = useCallback(() => {
    setIsModalRoomIdOpen(true);
  }, []);

  return (
    <div className='app-wrapper'>
      <img src='https://www.ultraboardgames.com/secret-hitler/gfx/secret-hitler-banner.jpg' alt='Secret' width={'100%'} />
      <Box className='actions-button'>
        <button onClick={handleHostGame}>
          Host game
        </button>
        <button onClick={enterRoomId}>
          Join game
        </button>
      </Box>
      <footer>
        <a href='https://alexisamadei.fr/' target='_blank' >by Kiwi Dev</a>
        <img src={logo}  alt='Kiwi Dev logo' width={'30px'} height={'30px'} />
      </footer>
      <Modal open={isModalRoomIdOpen} onClose={() => setIsModalRoomIdOpen(false)} className='join-modal'>
        <Box className='modal-content'>
          <input
            type='text'
            placeholder='Room ID'
            value={roomId}
            onChange={(event) => setRoomId(event.target.value)}
            className='input-field'
          />
          <input
            type='text'
            placeholder='Pseudo'
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
            className='input-field'
          />
          <button type='submit' onClick={handleJoinRoom} className='join-button'>
            Join
          </button>
          {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
        </Box>
      </Modal>
    </div>
  );
}
