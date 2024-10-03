import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Container from '@mui/material/Container';

export default function JoinRoom() {
  const { roomId } = useParams();
  const [roomData, setRoomData] = useState(null);
  const playerName = localStorage.getItem('playerName') || 'Guest';

  useEffect(() => {
    const fetchRoom = async () => {
      const roomRef = doc(db, 'rooms', roomId);
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
  }, [roomId, playerName]);

  return (
    <Container>
      {roomData ? (
        <>
          <h1>Party Name: <span style={{ fontStyle: 'italic' }}>{roomData.name}</span></h1>
          <ul>
            {roomData.players.map((player, index) => (
              <li key={index}>{index + 1}. {player}</li>
            ))}
          </ul>
        </>
      ) : (
        <h1>Loading room data...</h1>
      )}
    </Container>
  );
}
