import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './styles/Host.css';
import ErrorMessage from '../components/ErrorMessage';
import fetchCollection from '../utils/fetchCollection';
import IconButton from '@mui/material/IconButton';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';

const Host = () => {
    const [gameName, setGameName] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [roomId, setRoomId] = useState('');
    const [rooms, setRooms] = useState([]);
    const navigate = useNavigate();

    async function createRoomId() {
        const roomsData = await fetchCollection(db, 'rooms');
        const newRoomId = Math.random().toString(36).substring(2, 7);
        const roomExists = roomsData.some((room) => room.gameId === newRoomId);

        if (roomExists) {
            return await createRoomId();
        } else {
            setRoomId(newRoomId);
        }
    }

    useEffect(() => {
        const fetchRooms = async () => {
            const roomsData = await fetchCollection(db, 'rooms');
            setRooms(roomsData);
        };
        fetchRooms();
    }, []);

    useEffect(() => {
        if (rooms.length > 0) {
            createRoomId();
        }
    }, [rooms]);

    function validerNomDeSalle(nom) {
        const regex = /^[A-HJ-NP-Za-hj-np-z\s]+$/;
        return regex.test(nom);
    }

    const createGame = async () => {
        if (!gameName.trim()) {
            setErrorMessage('Le nom de l\'hôte et le nom de la partie ne peuvent pas être vides.');
            return;
        }
        if (!validerNomDeSalle(gameName)) {
            setErrorMessage('Le nom de la salle ne doit contenir que des lettres.');
            return;
        }
        try {
            await setDoc(doc(db, 'rooms', roomId), {
                name: gameName,
                createdAt: new Date(),
                gameId: roomId,
                status: 'waiting',
                votingPhase: {
                    inProgress: false,
                    votes: {},
                    totalVotes: 0
                },
                players: []
            });

            navigate(`/display/${roomId}`);
        } catch (error) {
            console.error('Erreur lors de la création de la partie: ', error);
            setErrorMessage("Impossible de créer la partie. Veuillez réessayer.");
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            createGame();
        }
    };

    return (
        <div style={{ padding: '20px' }} className='host-wrapper'>
            <IconButton id='backHome' onClick={() => navigate('/')} >
                <HomeRoundedIcon />
            </IconButton>
            <h1 id='page-title'>Créer une partie</h1>
            <input
                type="text"
                placeholder="Nom de la partie"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                style={{ padding: '10px', marginRight: '10px' }}
                onKeyDown={handleKeyDown}
            />
            <button onClick={createGame} style={{ padding: '10px 20px' }}>
                Créer
            </button>
            <ErrorMessage message={errorMessage} setErrorMessage={setErrorMessage} />
        </div>
    );
};

export default Host;
