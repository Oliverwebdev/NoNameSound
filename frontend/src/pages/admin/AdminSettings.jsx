import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { authFetch } from '../../utils/authFetch'; 

function AdminSettings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Neue Passwörter stimmen nicht überein.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authFetch('/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Fehler beim Ändern des Passworts');
      setMessage('Passwort erfolgreich geändert!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-settings">
      <div className="settings-container">
        <h1 className="settings-title">Einstellungen</h1>
        <h2 className="settings-subtitle">Passwort ändern</h2>
        <form className="password-form" onSubmit={handlePasswordChange}>
          <div className="form-group">
            <label className="form-label">Aktuelles Passwort</label>
            <input
              className="form-input"
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              required
              placeholder="Ihr aktuelles Passwort eingeben"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Neues Passwort</label>
            <input
              className="form-input"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Neues Passwort (mind. 8 Zeichen)"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Neues Passwort bestätigen</label>
            <input
              className="form-input"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Bitte erneut eingeben"
            />
          </div>
          <button className="submit-button" type="submit" disabled={isLoading}>
            {isLoading ? 'Wird geändert...' : 'Passwort ändern'}
          </button>
          {message && <div className="message success-message">{message}</div>}
          {error && <div className="message error-message">{error}</div>}
        </form>
      </div>
    </div>
  );
}

export default AdminSettings;
