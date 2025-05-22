import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './AdminDashboard.css';

// Admin components
import AdminHome from './admin/AdminHome';
import ManageProducts from './admin/ManageProducts';
import ManageRentals from './admin/ManageRentals';
import AdminSettings from './admin/AdminSettings';
import NotFound from './NotFound';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Fetch dashboard stats
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch('/api/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            // Token expired or invalid, logout
            localStorage.removeItem('token');
            navigate('/login');
            return;
          }
          throw new Error('Failed to fetch dashboard data');
        }

        const data = await response.json();
        setStats(data);
        setError(null);
      } catch (error) {
        console.error('Dashboard error:', error);
        setError(error.message || 'Ein Fehler ist aufgetreten');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [navigate]);

  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      x: "-100%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  const contentVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: {
        duration: 0.3
      }
    }
  };

  const navItems = [
    { path: '/admin', icon: '📊', label: 'Dashboard', exact: true },
    { path: '/admin/products', icon: '🎵', label: 'Produkte' },
    { path: '/admin/rentals', icon: '📋', label: 'Mietanfragen' },
    { path: '/admin/settings', icon: '⚙️', label: 'Einstellungen' }
  ];

  const isActiveRoute = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="admin-dashboard">
      {/* Mobile Header */}
      <motion.div 
        className="mobile-header"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <motion.button
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className={`hamburger ${sidebarOpen ? 'active' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </motion.button>
        <h2 className="mobile-title">Admin Panel</h2>
      </motion.div>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div 
        className="admin-sidebar"
        variants={sidebarVariants}
        initial="closed"
        animate={sidebarOpen ? "open" : "open"}
      >
        <motion.div 
          className="admin-brand"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2>🎼 Admin Panel</h2>
          <div className="brand-subtitle">Musikverwaltung</div>
        </motion.div>
        
        <nav className="admin-nav">
          <ul>
            {navItems.map((item, index) => (
              <motion.li
                key={item.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * (index + 1) }}
              >
                <Link 
                  to={item.path} 
                  className={`nav-link ${isActiveRoute(item.path, item.exact) ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <motion.span 
                    className="icon"
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    {item.icon}
                  </motion.span>
                  <span className="nav-text">{item.label}</span>
                  {isActiveRoute(item.path, item.exact) && (
                    <motion.div
                      className="active-indicator"
                      layoutId="activeIndicator"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              </motion.li>
            ))}
          </ul>
        </nav>

        <motion.div 
          className="sidebar-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="user-info">
            <div className="user-avatar">👤</div>
            <div className="user-details">
              <div className="user-name">Administrator</div>
              <div className="user-role">System Admin</div>
            </div>
          </div>
        </motion.div>
      </motion.div>
      
      <div className="admin-content">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              className="loading-container"
              key="loading"
              variants={contentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <motion.div 
                className="loading-spinner"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Daten werden geladen...
              </motion.p>
            </motion.div>
          ) : error ? (
            <motion.div 
              className="error-container"
              key="error"
              variants={contentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <motion.div 
                className="error-icon"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ⚠️
              </motion.div>
              <div className="error-message">{error}</div>
              <motion.button 
                className="retry-button" 
                onClick={() => window.location.reload()}
                whileHover={{ scale: 1.05, boxShadow: "0 8px 25px rgba(124, 77, 255, 0.3)" }}
                whileTap={{ scale: 0.95 }}
              >
                Erneut versuchen
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              variants={contentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <Routes>
                <Route path="/" element={<AdminHome stats={stats} />} />
                <Route path="/products/*" element={<ManageProducts />} />
                <Route path="/rentals/*" element={<ManageRentals />} />
                <Route path="/settings" element={<AdminSettings />} />
                <Route path="*" element={<NotFound adminView={true} />} />
              </Routes>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminDashboard;