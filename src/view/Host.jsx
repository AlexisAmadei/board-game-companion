import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../config/firebase';
import { doc, setDoc } from 'firebase/firestore';
import ErrorMessage from '../components/ErrorMessage';
import fetchCollection from '../utils/fetchCollection';
import cleanOldRooms from '../utils/cleanOldRooms';
import ThemedButton from '../Theme/Button/ThemedButton';
import './styles/Host.css';

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
        cleanOldRooms(rooms);
    }, [rooms]);

    function validerNomDeSalle(nom) {
        const regex = /^[A-Za-z\s]+$/;
        if (regex.test(nom)) {
            return true;
        }
        return (false);
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
        <div className='host-wrapper'>
            <h1 id='page-title'>Créer une partie</h1>
            <div id='content'>
                <input
                    type="text"
                    placeholder="Nom de la partie"
                    value={gameName}
                    onChange={(e) => setGameName(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <ThemedButton text={'Créer'} onClick={createGame} />
            </div>
            <div id='error-message'>
                <ErrorMessage message={errorMessage} setErrorMessage={setErrorMessage} />
            </div>
        </div>
    );
};

export default Host;
