import { Collapse, IconButton } from "@mui/material";
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import { useTheme } from "../../contexts/ThemeContext";
import './LiveChat.css';
import { useEffect, useRef } from "react";

export default function LiveChat({
    expandMessages,
    setExpandMessages,
    messagesList,
    sendMessage,
    currentMessage,
    setCurrentMessage,
}) {
    const { theme } = useTheme();
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    useEffect(() => {
        scrollToBottom();
    }, [messagesList]);

    const handleSendMessage = (e) => {
        if (currentMessage) {
            sendMessage();
            setCurrentMessage('');
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [expandMessages]);

    return (
        <div className={`messages-container ${theme}`}>
            <IconButton color='inherit' id='expand-messages' onClick={() => setExpandMessages(prev => !prev)}>
                <ChatBubbleIcon />
            </IconButton>
            <Collapse in={expandMessages} timeout='auto' unmountOnExit orientation='horizontal'>
                <div className='messages-drawer-container'>
                    <div id='messages-drawer-header'>
                        <p>Messages</p>
                    </div>
                    <div className='messages-drawer'>
                        <div className='messages-list'>
                            {messagesList?.map((message, index) => (
                                <div className='message' key={index}>
                                    <p id='username'>{message.userName}{message.userName ? ':' : ' '}</p>
                                    <p id='content'>{message.content}</p>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className='message-input'>
                            <input
                                type='text'
                                placeholder='Envoyer un message'
                                onChange={(e) => setCurrentMessage(e.target.value)}
                                value={currentMessage}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            />
                            <button onClick={handleSendMessage} className={`send-message ${theme}`}>
                                Envoyer
                            </button>
                        </div>
                    </div>
                </div>
            </Collapse>
        </div>
    )
}
