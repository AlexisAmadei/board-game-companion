import React from 'react'
import { Box, Modal } from '@mui/material'
import ThemedButton from '../../Theme/Button/ThemedButton'
import ErrorMessage from '../ErrorMessage'

export default function JoinRoomModal({
    isModalRoomIdOpen,
    setIsModalRoomIdOpen,
    roomId,
    setRoomId,
    playerName,
    setPlayerName,
    handleJoinRoom,
    errorMessage,
    setErrorMessage
}) {
    return (
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
    )
}
