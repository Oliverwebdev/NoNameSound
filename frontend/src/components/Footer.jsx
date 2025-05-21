import { Link } from 'react-router-dom';
import './Footer.css';


function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>Über uns</h3>
          <p>Wir verleihen hochwertige Musikinstrumente für jedes Event. Seit 2023 mit Leidenschaft und Klang.</p>
        </div>

        <div className="footer-section">
          <h3>Kontakt</h3>
          <p>Musikstraße 123<br />12345 Musikstadt</p>
          <p>Tel: +49 123 456789<br />E-Mail: info@musikverleih.de</p>
        </div>

        <div className="footer-section">
          <h3>Schnellzugriff</h3>
          <ul>
            <li><Link to="/">Startseite</Link></li>
            <li><Link to="/products">Produkte</Link></li>
            <li><Link to="/contact">Kontakt</Link></li>
            <li><Link to="/login">Login</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Musikverleih. Alle Rechte vorbehalten.</p>
      </div>
    </footer>
  );
}

export default Footer;
