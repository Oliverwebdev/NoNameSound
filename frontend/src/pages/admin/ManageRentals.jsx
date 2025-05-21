import React, { useEffect, useState } from 'react';
import { authFetch } from '../../utils/authFetch';

function ManageRentals() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRentals = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await authFetch('/api/rentals');
        if (res.status === 401 || res.status === 403) {
          setError('Nicht autorisiert. Bitte erneut einloggen.');
          setIsLoading(false);
          return;
        }
        if (!res.ok) throw new Error('Fehler beim Laden der Mietanfragen.');
        const data = await res.json();
        setRequests(data);
      } catch (err) {
        setError(err.message || 'Unbekannter Fehler');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRentals();
  }, []);

  return (
    <div className="manage-rentals">
      <h1>Mietanfragen verwalten</h1>
      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Mietanfragen werden geladen...</p>
        </div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : requests.length === 0 ? (
        <div className="no-requests">Keine Mietanfragen gefunden.</div>
      ) : (
        <div className="table-responsive">
          <table className="rentals-table">
            <thead>
              <tr>
                <th>Kunde</th>
                <th>E-Mail</th>
                <th>Zeitraum</th>
                <th>Status</th>
                <th>Anzahl Artikel</th>
                <th>Gesamtpreis</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.id}>
                  <td>{req.customer_name}</td>
                  <td>{req.customer_email}</td>
                  <td>{req.start_date} – {req.end_date}</td>
                  <td>{req.status}</td>
                  <td>{req.items.length}</td>
                  <td>{req.total_price.toFixed(2)} €</td>
                  <td>
                    {/* Platz für Aktionen wie Details, Status ändern */}
                    <button 
                      onClick={() => alert(`Details zu Anfrage #${req.id} kommen bald!`)}
                      className="action-btn"
                    >Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ManageRentals;
