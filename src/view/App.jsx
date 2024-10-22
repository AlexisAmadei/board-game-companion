import React, { useCallback, useState } from 'react';
import { Box, IconButton, Modal } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import logo from '../assets/kiwiDevLogo-transparent.png';
import ThemedButton from '../Theme/Button/ThemedButton';
import ErrorMessage from '../components/ErrorMessage';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import Banner from '../assets/banner.png';
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
        setErrorMessage('L\'ID de la partie et le nom du joueur ne peuvent pas être vides.');
        return;
      }
      const roomRef = collection(db, 'rooms');
      const q = query(roomRef, where('gameId', '==', roomId));
      const roomSnapshot = await getDocs(q);
      if (roomSnapshot.empty) {
        setErrorMessage('partie non trouvée, veuillez vérifier l\'ID de la partie.');
        return;
      }
      roomSnapshot.forEach(async (doc) => {
        const roomData = doc.data();
        const updatedPlayers = [...roomData.players, pseudo];
        if (roomData.players.includes(pseudo)) {
          setErrorMessage('Joueur déjà présent dans la partie.');
          return;
        }
        await updateDoc(doc.ref, {
          players: updatedPlayers,
        });
        localStorage.setItem('playerName', pseudo);
        navigate(`/join/${roomId}`);
      });
    } catch (error) {
      console.error('Erreur pendant la connexion à la partie: ', error);
      setErrorMessage('Une erreur s\'est produite lors de la connexion à la partie.');
    }
  };

  const handleJoinRoom = async () => {
    await joinRoom(playerName);
  };

  const enterRoomId = useCallback(() => {
    setIsModalRoomIdOpen(true);
  }, []);

  const handleMailto = () => {
    window.open('mailto:kiwi.dev2024@gmail.com');
  };

  return (
    <div className='app-wrapper'>
      {/* <img src='https://www.ultraboardgames.com/secret-hitler/gfx/secret-hitler-banner.jpg' alt='Secret' /> */}
      <img id='banner' src={Banner} alt='Secret H Banner' />
      <Box className='actions-button'>
        <ThemedButton
          text={'Créer'}
          onClick={handleHostGame}
        />
        <ThemedButton
          text={'Rejoindre'}
          onClick={enterRoomId}
        />
      </Box>
      <footer>
        <a href='https://alexisamadei.fr/' target='_blank' >by Kiwi Dev</a>
        <img src={logo}  alt='Kiwi Dev logo' width={'30px'} height={'30px'} />
        <IconButton id='mailto' color='inherit' onClick={handleMailto} >
          <EmailRoundedIcon color='inherit' />
        </IconButton>
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
          <ThemedButton
            text={'Rejoindre'}
            onClick={handleJoinRoom}
            classes={'join-button'}
          />
          {errorMessage && <ErrorMessage message={errorMessage} setErrorMessage={setErrorMessage} />}
        </Box>
      </Modal>
    </div>
  );
}
