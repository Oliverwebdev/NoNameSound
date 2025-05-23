import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>Rólunk</h3>
          <p>
            Professzionális hangtechnika bérlés: bulikra, klubokba, esküvőkre és rendezvényekre.
            Gyors telepítés, szakértői támogatás és megfizethető árak.
          </p>
        </div>

        <div className="footer-section">
          <h3>Kapcsolat</h3>
          <p>Budapest, Hang utca 4.<br />Magyarország</p>
          <p>Tel: +36 30 994 3215<br />E-mail: <a href="mailto:nonamesound0@gmail.com">nonamesound0@gmail.com</a></p>
        </div>

        <div className="footer-section">
          <h3>Gyorslinkek</h3>
          <ul>
            <li><Link to="/">Főoldal</Link></li>
            <li><Link to="/products">Termékek</Link></li>
            <li><Link to="/contact">Kapcsolat</Link></li>
            <li><Link to="/login">Bejelentkezés</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} NoNameSound – Minden jog fenntartva.</p>
        <p className="developer-note">👨‍💻 Entwickelt mit ♥ von <a href="https://github.com/Oliverwebdev" target="_blank" rel="noopener noreferrer">Oliverwebdev</a></p>
      </div>
    </footer>
  );
}

export default Footer;
