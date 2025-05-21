import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

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

  return (
    <div className="admin-dashboard">
      <div className="admin-sidebar">
        <div className="admin-brand">
          <h2>Admin Panel</h2>
        </div>
        
        <nav className="admin-nav">
          <ul>
            <li>
              <Link to="/admin" className="nav-link">
                <span className="icon">📊</span>
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/admin/products" className="nav-link">
                <span className="icon">🎵</span>
                Produkte
              </Link>
            </li>
            <li>
              <Link to="/admin/rentals" className="nav-link">
                <span className="icon">📋</span>
                Mietanfragen
              </Link>
            </li>
            <li>
              <Link to="/admin/settings" className="nav-link">
                <span className="icon">⚙️</span>
                Einstellungen
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      
      <div className="admin-content">
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Daten werden geladen...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <div className="error-message">{error}</div>
            <button 
              className="retry-button" 
              onClick={() => window.location.reload()}
            >
              Erneut versuchen
            </button>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<AdminHome stats={stats} />} />
            <Route path="/products/*" element={<ManageProducts />} />
            <Route path="/rentals/*" element={<ManageRentals />} />
            <Route path="/settings" element={<AdminSettings />} />
            <Route path="*" element={<NotFound adminView={true} />} />
          </Routes>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;