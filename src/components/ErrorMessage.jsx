import React, { useEffect } from 'react'

export default function ErrorMessage({ message, setErrorMessage }) {
    useEffect(() => {
        if (message) {
            setTimeout(() => {
                setErrorMessage('');
            }, 5000);
        }
    }, [message]);
    return (
        <div style={{ padding: '10px' }}>
            {message}
        </div>
    )
}
