import { Link } from 'react-router-dom';

const NotFound = ({ adminView = false }) => {
  return (
    <div className="not-found-page">
      <div className="container">
        <div className="error-code">404</div>
        <h1>Seite nicht gefunden</h1>
        <p>Die gesuchte Seite existiert leider nicht.</p>
        
        {adminView ? (
          <Link to="/admin" className="return-link">
            Zurück zum Admin-Dashboard
          </Link>
        ) : (
          <Link to="/" className="return-link">
            Zurück zur Startseite
          </Link>
        )}
      </div>
    </div>
  );
};

export default NotFound;