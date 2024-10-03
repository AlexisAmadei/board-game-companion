import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { collection, doc, setDoc } from 'firebase/firestore'; // Using setDoc for room creation
import { useNavigate } from 'react-router-dom';

const Host = () => {
    const [gameName, setGameName] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();
    const [roomId, setRoomId] = useState('');

    function createRoomId() {
        setRoomId(Math.random().toString(36).substring(2, 9)); // A more concise roomId
    }

    useEffect(() => {
        createRoomId();
    }, []);

    const createGame = async () => {
        if (!gameName.trim()) {
            setErrorMessage('Le nom de l\'hôte et le nom de la partie ne peuvent pas être vides.');
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

    return (
        <div style={{ padding: '20px' }}>
            <h1>Créer une partie</h1>
            <input
                type="text"
                placeholder="Nom de la partie"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                style={{ padding: '10px', marginRight: '10px' }}
            />
            <button onClick={createGame} style={{ padding: '10px 20px' }}>
                Créer
            </button>
            {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
        </div>
    );
};

export default Host;
