import { Link } from 'react-router-dom';
import './styles/NotFound.css';

export default function NotFound() {
  return (
    <div className='notFoundPage'>
      <h1>404</h1>
      <p>Page non trouvée</p>
      <Link to='/' id='backToHome'>Retour à l'accueil</Link>
    </div>
  )
}
