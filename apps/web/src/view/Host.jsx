import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom } from '../config/api';
import ErrorMessage from '../components/ErrorMessage';
import ThemedButton from '../Theme/Button/ThemedButton';
import './styles/Host.css';

const Host = () => {
    const [gameName, setGameName] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

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
            const room = await createRoom(gameName);
            navigate(`/display/${room.gameId}`);
        } catch (error) {
            console.error('Erreur lors de la création de la partie: ', error);
            setErrorMessage(error.message || "Impossible de créer la partie. Veuillez réessayer.");
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
