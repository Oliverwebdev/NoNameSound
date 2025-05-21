import React, { useState } from 'react';
import { authFetch } from '../../utils/authFetch';

function AdminSettings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const res = await authFetch('/api/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Fehler beim Ändern des Passworts');
      setMessage('Passwort erfolgreich geändert!');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="admin-settings">
      <h1>Einstellungen</h1>
      <h2>Passwort ändern</h2>
      <form onSubmit={handlePasswordChange}>
        <label>
          Aktuelles Passwort
          <input
            type="password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            required
          />
        </label>
        <label>
          Neues Passwort
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
            minLength={8}
          />
        </label>
        <button type="submit">Passwort ändern</button>
        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}
      </form>
    </div>
  );
}

export default AdminSettings;
