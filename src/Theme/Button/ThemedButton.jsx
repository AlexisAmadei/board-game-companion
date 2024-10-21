import { useTheme } from "../../contexts/ThemeContext";
import './ThemedButton.css';
export default function ThemedButton({ text, onClick, classes, id }) {
  const { theme } = useTheme();
  return (
    <button
      onClick={onClick}
      className={theme === 'light' ? 'button-light' : 'button-dark' + ' ' + classes}
      id={id}
    >
      {text}
    </button>
  );
}