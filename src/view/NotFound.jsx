import { Link } from 'react-router-dom';
import './styles/NotFound.css';

export default function NotFound() {
  return (
    <div className='notFoundPage'>
      <h1>404</h1>
      <p>Page not found</p>
      <Link to='/' id='backToHome'>Go back to the home page</Link>
    </div>
  )
}
