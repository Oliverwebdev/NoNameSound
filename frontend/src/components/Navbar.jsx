import { Link } from 'react-router-dom';
import './Navbar.css';
import logo from '../assets/IMG_0106.png'; // Stelle sicher, dass dieses Logo im richtigen Pfad liegt

function Navbar({ isAuthenticated, onLogout }) {
  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <img src={logo} alt="NoName Sound Logo" className="navbar-logo-img" />
          <span>NoName <strong>Sound</strong></span>
        </Link>

        <nav className="navbar-links">
          <Link to="/">Főoldal</Link>
          <Link to="/products">Termékek</Link>
          <Link to="/contact">Kapcsolat</Link>

          {isAuthenticated ? (
            <>
              <Link to="/admin">Admin</Link>
              <button className="logout-button" onClick={onLogout}>Kilépés</button>
            </>
          ) : (
            <Link to="/login">Bejelentkezés</Link>
          )}
        </nav>
      </div>

    
    </header>
  );
}

export default Navbar;
