import React from 'react';
import { motion } from 'framer-motion';
import './AdminHome.css';

function AdminHome({ stats }) {
  if (!stats) {
    return (
      <motion.div 
        className="admin-home no-stats"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="no-stats-content">
          <h2>Keine Statistiken verfügbar</h2>
          <p>Die Dashboard-Daten werden geladen...</p>
        </div>
      </motion.div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };

  const cardVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 120,
        damping: 15
      }
    },
    hover: {
      scale: 1.05,
      y: -5,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    }
  };

  const statsData = [
    { title: 'Artikel insgesamt', value: stats.total_articles, icon: '📦' },
    { title: 'Verfügbare Artikel', value: stats.available_articles, icon: '✅' },
    { title: 'Offene Anfragen', value: stats.open_requests, icon: '⏳' },
    { title: 'Abgeschlossene Anfragen', value: stats.completed_requests, icon: '✨' },
    { title: 'Stornierte Anfragen', value: stats.cancelled_requests, icon: '❌' }
  ];

  return (
    <motion.div 
      className="admin-home"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="header-section" variants={itemVariants}>
        <h1 className="main-title">
          <span className="title-icon">🎵</span>
          Willkommen im Admin-Dashboard
        </h1>
        <p className="subtitle">Übersicht über alle wichtigen Kennzahlen</p>
      </motion.div>

      <motion.div className="stats-grid" variants={itemVariants}>
        {statsData.map((stat, index) => (
          <motion.div
            key={stat.title}
            className="stat-card"
            variants={cardVariants}
            whileHover="hover"
            whileTap={{ scale: 0.98 }}
          >
            <div className="card-icon">{stat.icon}</div>
            <h3>{stat.title}</h3>
            <motion.div 
              className="stat-value"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 + index * 0.1, type: "spring", stiffness: 200 }}
            >
              {stat.value}
            </motion.div>
            <div className="card-glow"></div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div className="activities-section" variants={itemVariants}>
        <h2 className="section-title">
          <span className="title-icon">📊</span>
          Letzte Aktivitäten
        </h2>
        
        <motion.div className="activities-container">
          {stats.recent_activities.length === 0 ? (
            <motion.div 
              className="no-activities"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <div className="no-activities-icon">🌙</div>
              <p>Keine Aktivitäten vorhanden</p>
              <span className="no-activities-sub">Alles ist ruhig im Dashboard</span>
            </motion.div>
          ) : (
            <motion.ul className="activities-list">
              {stats.recent_activities.map((act, index) => (
                <motion.li
                  key={act.id}
                  className="activity-item"
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  whileHover={{ x: 10, transition: { duration: 0.2 } }}
                >
                  <div className="activity-indicator"></div>
                  <div className="activity-content">
                    <div className="activity-main">
                      <span className="activity-id">Anfrage #{act.id}</span>
                      <span className="activity-customer">von {act.customer_name}</span>
                    </div>
                    <div className="activity-meta">
                      <span className={`activity-status status-${act.status.toLowerCase()}`}>
                        {act.status}
                      </span>
                      <span className="activity-date">{act.request_date}</span>
                    </div>
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </motion.div>
      </motion.div>

      <motion.div 
        className="floating-elements"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 2 }}
      >
        <div className="floating-note note-1">♪</div>
        <div className="floating-note note-2">♫</div>
        <div className="floating-note note-3">♪</div>
      </motion.div>
    </motion.div>
  );
}

export default AdminHome;