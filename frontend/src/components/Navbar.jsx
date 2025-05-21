import { Link } from 'react-router-dom';
import './Navbar.css';


function Navbar({ isAuthenticated, onLogout }) {
  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">🎶 Musikverleih</Link>
        
        <nav className="navbar-links">
          <Link to="/">Start</Link>
          <Link to="/products">Produkte</Link>
          <Link to="/contact">Kontakt</Link>

          {isAuthenticated ? (
            <>
              <Link to="/admin">Admin</Link>
              <button className="logout-button" onClick={onLogout}>Abmelden</button>
            </>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
