import { Outlet } from "react-router-dom";
import SwitchTheme from "../components/SwitchTheme/SwitchTheme";
import IconButton from '@mui/material/IconButton';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import './DefaultLayout.css';
import PorteGobelet from "../components/PorteGobelet/PorteGobelet";

export default function DefaultLayout({ children }) {
    const navigate = useNavigate();
    const { theme } = useTheme();
    return (
        <div className="default-layout">
            <div className={`menu-buttons ${theme}`}>
                <SwitchTheme />
                <IconButton id='backHome' onClick={() => navigate('/')} color="inherit">
                    <HomeRoundedIcon />
                </IconButton>
            </div>
            <Outlet>
                {children}
            </Outlet>
            <PorteGobelet />
        </div>
    )
}
