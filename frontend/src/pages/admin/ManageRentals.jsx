// src/pages/admin/ManageRentals.jsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { authFetch } from '../../utils/authFetch';
import './ManageRentals.css';

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

function ManageRentals() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRentals = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await authFetch('/rentals');
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

  const updateStatus = async (id, newStatus) => {
    try {
      const res = await authFetch(`/rentals/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Status konnte nicht aktualisiert werden');
      setRequests(prev =>
        prev.map(req => req.id === id ? { ...req, status: newStatus } : req)
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'fulfilled': return '#4caf50';
      case 'contacted': return '#2196f3';
      case 'new': return '#ff9800';
      case 'cancelled': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  return (
    <motion.div className="manage-rentals" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
      <h1>Mietanfragen verwalten</h1>

      {error && <div className="error-message">⚠️ {error}</div>}

      {isLoading ? (
        <div className="loading">⏳ Lade Mietanfragen...</div>
      ) : requests.length === 0 ? (
        <div className="no-requests">Keine Mietanfragen gefunden.</div>
      ) : (
        <div className="table-wrapper">
          <table className="rentals-table">
            <thead>
              <tr>
                <th>Kunde</th>
                <th>E-Mail</th>
                <th>Zeitraum</th>
                <th>Status</th>
                <th>Anmerkung</th>
                <th>Artikel</th>
                <th>Preis</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {requests.map((req, index) => (
                  <motion.tr
                    key={req.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td>{req.customer_name}</td>
                    <td>{req.customer_email}</td>
                    <td>{formatDate(req.start_date)} – {formatDate(req.end_date)}</td>
                    <td>
                      <select
                        value={req.status}
                        onChange={(e) => updateStatus(req.id, e.target.value)}
                        style={{
                          backgroundColor: getStatusColor(req.status),
                          color: '#fff',
                          fontWeight: 'bold',
                          borderRadius: '6px',
                          border: 'none',
                          padding: '0.25rem 0.5rem'
                        }}
                      >
                        <option value="new">🆕 Offen</option>
                        <option value="contacted">📞 Kontaktiert</option>
                        <option value="fulfilled">✅ Erledigt</option>
                        <option value="cancelled">❌ Storniert</option>
                      </select>
                    </td>
                    <td>{req.message || '—'}</td>
                    <td>{req.items.length}</td>
                    <td>{req.total_price.toFixed(2)} €</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}

export default ManageRentals;
