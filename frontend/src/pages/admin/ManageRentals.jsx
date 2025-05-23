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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const tableRowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    },
    hover: {
      scale: 1.01,
      transition: {
        duration: 0.2,
        ease: "easeInOut"
      }
    }
  };

  const buttonVariants = {
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.2,
        ease: "easeInOut"
      }
    },
    tap: {
      scale: 0.95,
      transition: {
        duration: 0.1
      }
    }
  };

  const spinnerVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        ease: "linear",
        repeat: Infinity
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'bestätigt':
      case 'confirmed':
        return '#4caf50';
      case 'ausstehend':
      case 'pending':
        return '#ff9800';
      case 'abgelehnt':
      case 'rejected':
        return '#f44336';
      default:
        return '#7c4dff';
    }
  };

  return (
    <motion.div 
      className="manage-rentals"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.h1 variants={itemVariants}>
        Mietanfragen verwalten
      </motion.h1>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            className="loading-container"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
          >
            <motion.div
              className="loading-spinner"
              variants={spinnerVariants}
              animate="animate"
            />
            <motion.p
              animate={{
                opacity: [1, 0.5, 1],
                transition: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
            >
              Mietanfragen werden geladen...
            </motion.p>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            className="error-message"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, x: -30, transition: { duration: 0.3 } }}
          >
            {error}
          </motion.div>
        ) : requests.length === 0 ? (
          <motion.div
            key="no-requests"
            className="no-requests"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.3 } }}
          >
            Keine Mietanfragen gefunden.
          </motion.div>
        ) : (
          <motion.div
            key="table"
            className="table-responsive"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: 20, transition: { duration: 0.3 } }}
          >
            <table className="rentals-table">
              <thead>
                <motion.tr
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <th>Kunde</th>
                  <th>E-Mail</th>
                  <th>Zeitraum</th>
                  <th>Status</th>
                  <th>Anzahl Artikel</th>
                  <th>Gesamtpreis</th>
                  <th>Aktionen</th>
                </motion.tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {requests.map((req, index) => (
                    <motion.tr
                      key={req.id}
                      variants={tableRowVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                      transition={{ delay: index * 0.1 }}
                      layout
                    >
                      <td>
                        <motion.span
                          whileHover={{ color: '#ffab40' }}
                          transition={{ duration: 0.2 }}
                        >
                          {req.customer_name}
                        </motion.span>
                      </td>
                      <td>{req.customer_email}</td>
                      <td>
                        <motion.span
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.2 }}
                        >
                          {formatDate(req.start_date)} – {formatDate(req.end_date)}

                        </motion.span>
                      </td>
                      <td>
                        <motion.span
                          style={{ color: getStatusColor(req.status) }}
                          whileHover={{ scale: 1.1, fontWeight: 700 }}
                          transition={{ duration: 0.2 }}
                        >
                          {req.status}
                        </motion.span>
                      </td>
                      <td>
                        <motion.span
                          whileHover={{ scale: 1.2 }}
                          transition={{ duration: 0.2 }}
                        >
                          {req.items.length}
                        </motion.span>
                      </td>
                      <td>
                        <motion.span
                          whileHover={{ 
                            scale: 1.05,
                            color: '#ffab40',
                            fontWeight: 600 
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          {req.total_price.toFixed(2)} €
                        </motion.span>
                      </td>
                      <td>
                        <motion.button
                          onClick={() => alert(`Details zu Anfrage #${req.id} kommen bald!`)}
                          className="action-btn"
                          variants={buttonVariants}
                          whileHover="hover"
                          whileTap="tap"
                        >
                          Details
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default ManageRentals;