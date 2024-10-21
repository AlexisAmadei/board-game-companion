import { useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import DarkModeIcon from '@mui/icons-material/DarkModeRounded';
import LightModeIcon from '@mui/icons-material/LightModeRounded';
import IconButton from '@mui/material/IconButton';
import './SwitchTheme.css';
export default function SwitchTheme() {
  const { theme, toggleTheme } = useTheme();
  useEffect(() => {
    console.log('theme:', theme);
  }, [theme]);
  return (
    <div className="switch-theme">
      <IconButton
        aria-label="theme"
        onClick={toggleTheme}
        color="inherit"
      >
        {theme === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
      </IconButton>
    </div>
  )
}
