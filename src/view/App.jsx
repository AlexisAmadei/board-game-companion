import React, { useCallback, useState } from 'react';
import { Box, Button, Modal, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import './styles/App.css';

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
        <Button variant='contained' color='primary' onClick={handleHostGame}>
          Host game
        </Button>
        <Button variant='contained' color='secondary' onClick={enterRoomId}>
          Join game
        </Button>
      </Box>
      <Modal open={isModalRoomIdOpen} onClose={() => setIsModalRoomIdOpen(false)}>
        <Box className='modal-content'>
          <Typography variant='h5'>Enter Room ID and Your Name</Typography>
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
