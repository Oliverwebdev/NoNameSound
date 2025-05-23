import React, { useState } from 'react';
import { motion } from 'framer-motion';
// import './AdminSettings.css';
import { authFetch } from '../../utils/authFetch'; 

// Mock authFetch function for demo


function AdminSettings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);
    
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
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4 }
    }
  };

  const buttonVariants = {
    idle: { scale: 1 },
    hover: { 
      scale: 1.02,
      transition: { duration: 0.2 }
    },
    tap: { scale: 0.98 }
  };

  return (
    <>
      <style jsx>{`
        :root {
          --primary-color: #7c4dff;
          --secondary-color: #ff7043;
          --warm-accent: #ffab40;
          --dark-bg: #1a1a2e;
          --card-bg: #16213e;
          --text-light: #e8eaed;
          --text-muted: #9aa0a6;
          --success-color: #4caf50;
          --error-color: #f44336;
          --border-radius: 12px;
          --shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          --glow: 0 0 20px rgba(124, 77, 255, 0.3);
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, var(--dark-bg) 0%, #0f0f23 100%);
          color: var(--text-light);
          min-height: 100vh;
          line-height: 1.6;
        }

        .admin-settings {
          min-height: 100vh;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: 
            radial-gradient(circle at 20% 50%, rgba(124, 77, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 112, 67, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(255, 171, 64, 0.1) 0%, transparent 50%);
        }

        .settings-container {
          background: var(--card-bg);
          border-radius: var(--border-radius);
          padding: 3rem;
          width: 100%;
          max-width: 500px;
          box-shadow: var(--shadow);
          border: 1px solid rgba(124, 77, 255, 0.2);
          position: relative;
          overflow: hidden;
        }

        .settings-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--primary-color), var(--secondary-color), var(--warm-accent));
        }

        .settings-title {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-align: center;
        }

        .settings-subtitle {
          font-size: 1.25rem;
          color: var(--text-muted);
          margin-bottom: 2.5rem;
          text-align: center;
          font-weight: 400;
        }

        .password-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-label {
          font-weight: 600;
          color: var(--text-light);
          font-size: 0.95rem;
          margin-bottom: 0.25rem;
        }

        .form-input {
          padding: 1rem;
          border: 2px solid transparent;
          border-radius: var(--border-radius);
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-light);
          font-size: 1rem;
          transition: all 0.3s ease;
          outline: none;
          backdrop-filter: blur(10px);
        }

        .form-input:focus {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(124, 77, 255, 0.1);
          background: rgba(255, 255, 255, 0.08);
        }

        .form-input::placeholder {
          color: var(--text-muted);
        }

        .submit-button {
          padding: 1rem 2rem;
          border: none;
          border-radius: var(--border-radius);
          background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
          color: white;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          margin-top: 1rem;
        }

        .submit-button:hover {
          box-shadow: var(--glow);
          transform: translateY(-2px);
        }

        .submit-button:active {
          transform: translateY(0);
        }

        .submit-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .loading-spinner {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 2px solid transparent;
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 0.5rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .message {
          padding: 1rem;
          border-radius: var(--border-radius);
          margin-top: 1rem;
          font-weight: 500;
          text-align: center;
        }

        .success-message {
          background: rgba(76, 175, 80, 0.1);
          color: var(--success-color);
          border: 1px solid rgba(76, 175, 80, 0.3);
        }

        .error-message {
          background: rgba(244, 67, 54, 0.1);
          color: var(--error-color);
          border: 1px solid rgba(244, 67, 54, 0.3);
        }

        .floating-elements {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: -1;
        }

        .floating-circle {
          position: absolute;
          border-radius: 50%;
          opacity: 0.1;
          animation: float 6s ease-in-out infinite;
        }

        .floating-circle:nth-child(1) {
          width: 80px;
          height: 80px;
          background: var(--primary-color);
          top: 20%;
          left: 10%;
          animation-delay: 0s;
        }

        .floating-circle:nth-child(2) {
          width: 60px;
          height: 60px;
          background: var(--secondary-color);
          top: 60%;
          right: 10%;
          animation-delay: 2s;
        }

        .floating-circle:nth-child(3) {
          width: 100px;
          height: 100px;
          background: var(--warm-accent);
          bottom: 20%;
          left: 20%;
          animation-delay: 4s;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .admin-settings {
            padding: 1rem;
          }
          
          .settings-container {
            padding: 2rem;
            margin: 1rem;
          }
          
          .settings-title {
            font-size: 2rem;
          }
          
          .settings-subtitle {
            font-size: 1.1rem;
          }
        }

        @media (max-width: 480px) {
          .settings-container {
            padding: 1.5rem;
          }
          
          .settings-title {
            font-size: 1.75rem;
          }
          
          .form-input {
            padding: 0.875rem;
          }
          
          .submit-button {
            padding: 0.875rem 1.5rem;
          }
        }

        /* Dark mode enhancements */
        @media (prefers-color-scheme: dark) {
          .form-input {
            background: rgba(255, 255, 255, 0.03);
          }
          
          .form-input:focus {
            background: rgba(255, 255, 255, 0.06);
          }
        }
      `}</style>

      <div className="floating-elements">
        <div className="floating-circle"></div>
        <div className="floating-circle"></div>
        <div className="floating-circle"></div>
      </div>

      <motion.div 
        className="admin-settings"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="settings-container"
          variants={itemVariants}
          whileHover={{ y: -5 }}
          transition={{ duration: 0.3 }}
        >
          <motion.h1 
            className="settings-title"
            variants={itemVariants}
          >
            Einstellungen
          </motion.h1>
          
          <motion.h2 
            className="settings-subtitle"
            variants={itemVariants}
          >
            Passwort ändern
          </motion.h2>
          
          <motion.form 
            className="password-form"
            onSubmit={handlePasswordChange}
            variants={itemVariants}
          >
            <motion.div 
              className="form-group"
              variants={itemVariants}
            >
              <label className="form-label">
                Aktuelles Passwort
              </label>
              <motion.input
                className="form-input"
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
                placeholder="Ihr aktuelles Passwort eingeben"
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              />
            </motion.div>
            
            <motion.div 
              className="form-group"
              variants={itemVariants}
            >
              <label className="form-label">
                Neues Passwort
              </label>
              <motion.input
                className="form-input"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Neues Passwort (mind. 8 Zeichen)"
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              />
            </motion.div>
            
            <motion.button 
              className="submit-button"
              type="submit"
              disabled={isLoading}
              variants={buttonVariants}
              initial="idle"
              whileHover="hover"
              whileTap="tap"
            >
              {isLoading && <span className="loading-spinner"></span>}
              {isLoading ? 'Wird geändert...' : 'Passwort ändern'}
            </motion.button>
            
            {message && (
              <motion.div 
                className="message success-message"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {message}
              </motion.div>
            )}
            
            {error && (
              <motion.div 
                className="message error-message"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {error}
              </motion.div>
            )}
          </motion.form>
        </motion.div>
      </motion.div>
    </>
  );
}

export default AdminSettings;