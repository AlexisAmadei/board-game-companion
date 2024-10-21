import React, { useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext';

export default function ErrorMessage({ message, setErrorMessage }) {
    const { theme } = useTheme();
    const messageStyle = {
        color: theme === 'light' ? 'white' : 'var(--primary)',
    };

    useEffect(() => {
        if (message) {
            setTimeout(() => {
                setErrorMessage('');
            }, 5000);
        }
    }, [message]);
    return (
        <div style={messageStyle}>
            {message}
        </div>
    )
}
