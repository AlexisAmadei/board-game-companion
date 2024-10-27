import { Collapse, IconButton } from "@mui/material";
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import { useTheme } from "../../contexts/ThemeContext";
import './LiveChat.css';

export default function LiveChat({
    expandMessages,
    setExpandMessages,
    messagesList,
    sendMessage,
    setCurrentMessage,
}) {
    const { theme } = useTheme();
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
                            {messagesList.map((message, index) => (
                                <div className='message' key={index}>
                                    <p id='username'>{message.userName}{message.userName ? ':' : ' '}</p>
                                    <p id='content'>{message.content}</p>
                                </div>
                            ))}
                        </div>
                        <div className='message-input'>
                            <input
                                type='text'
                                placeholder='Envoyer un message'
                                onKeyDown={ (e) => { if (e.key === 'Enter') { sendMessage(); e.target.value = ''; } } }
                                onChange={(e) => setCurrentMessage(e.target.value)}
                            />
                            <button onClick={() => sendMessage()} className={`send-message ${theme}`}>
                                Envoyer
                            </button>
                        </div>
                    </div>
                </div>
            </Collapse>
        </div>
    )
}
