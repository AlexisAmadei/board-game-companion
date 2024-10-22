import BMC from '../../assets/bmc/bmc-logo.svg';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import { useTheme } from '../../contexts/ThemeContext';
import './PorteGobelet.css';
import { useState } from 'react';
import { Box, Collapse } from '@mui/material';

export default function PorteGobelet() {
    const { theme } = useTheme();
    const [isCoffeeClicked, setIsCoffeeClicked] = useState(false);


    const coffeeButton = () => {
        window.open('https://buymeacoffee.com/kiwidev2026', '_blank');
    }

    return (
        <div className={`porte-gobelet-container ${theme}`} onClick={() => setIsCoffeeClicked(!isCoffeeClicked)}>
            <img src={BMC} alt='BMC' className='bmc-logo' height={'32px'} />
            <Collapse in={isCoffeeClicked} orientation='horizontal' timeout='auto' direction='left'>
                <div className={`coffee-collapse ${theme}`}>
                    <p>Si vous chercher un porte gobelet demandez à josef svp</p>
                    <button className={`coffee-button ${theme}`} onClick={coffeeButton}>
                        Ou bien achetez en un ?
                    </button>
                </div>
            </Collapse>
        </div>
    );
}