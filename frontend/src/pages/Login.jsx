import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { API_URL } from '../api';
import './Login.css';

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Cookie-Auth!
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login fehlgeschlagen');
      }

      // Kein Token mehr speichern!
      // Login-State via prop (z.B. Context/State oben im App-Baum)
      if (onLogin) onLogin();
      navigate('/admin');
    } catch (error) {
      setError(error.message || 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.6, when: "beforeChildren", staggerChildren: 0.2 }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.4 } }
  };

  return (
    <div className="login-page">
      <motion.div 
        className="login-container"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div className="login-header" variants={itemVariants}>
          <h1>Admin Login</h1>
          <p>Bitte melden Sie sich an, um fortzufahren</p>
        </motion.div>

        <motion.form 
          className="login-form" 
          onSubmit={handleSubmit}
          variants={itemVariants}
        >
          {error && (
            <motion.div 
              className="error-message"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.div>
          )}
          
          <motion.div className="form-group" variants={itemVariants}>
            <label htmlFor="username">Benutzername</label>
            <div className="input-container">
              <input
                type="text"
                id="username"
                name="username"
                value={credentials.username}
                onChange={handleChange}
                required
                autoComplete="username"
              />
              <motion.span 
                className="input-focus-line"
                initial={{ scaleX: 0 }}
                whileFocus={{ scaleX: 1 }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
          
          <motion.div className="form-group" variants={itemVariants}>
            <label htmlFor="password">Passwort</label>
            <div className="input-container">
              <input
                type="password"
                id="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
              <motion.span 
                className="input-focus-line"
                initial={{ scaleX: 0 }}
                whileFocus={{ scaleX: 1 }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
          
          <motion.button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            variants={itemVariants}
          >
            {isLoading ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
                <span>Anmeldung läuft...</span>
              </div>
            ) : 'Anmelden'}
          </motion.button>
        </motion.form>
        
        <motion.div className="login-footer" variants={itemVariants}>
          <Link to="/" className="back-to-home">
            Zurück zur Startseite
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
