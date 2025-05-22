import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Farben, wie du sie willst:
const COLORS = {
  primary: "#7c4dff",
  secondary: "#ff7043",
  warmAccent: "#ffab40",
  darkBg: "#18132A",
  cardBg: "#201B37",
  textLight: "#F2F1F7",
  textMuted: "#B3A8D7"
};

const authFetch = async (url, options) => {
  await new Promise(resolve => setTimeout(resolve, 1200));
  return {
    ok: true,
    json: async () => ([
      { id: 1, name: "Gibson Les Paul Studio", price_per_day: 25.00, is_available: true, quantity_available: 3 },
      { id: 2, name: "Fender Stratocaster", price_per_day: 30.00, is_available: true, quantity_available: 2 },
      { id: 3, name: "Marshall JCM800", price_per_day: 40.00, is_available: false, quantity_available: 0 },
      { id: 4, name: "Yamaha DM2000", price_per_day: 80.00, is_available: true, quantity_available: 1 },
      { id: 5, name: "Shure SM58", price_per_day: 8.00, is_available: true, quantity_available: 10 }
    ])
  };
};

function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const res = await authFetch('/api/articles');
        if (!res.ok) throw new Error('Fehler beim Laden der Produkte');
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Framer Motion Variants
  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, staggerChildren: 0.12 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.42 } }
  };
  const tableRowVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.28 } }
  };

  return (
    <>
      <style>
      {`
      :root {
        --primary-color: #7c4dff;
        --secondary-color: #ff7043;
        --warm-accent: #ffab40;
        --dark-bg: #18132A;
        --card-bg: #201B37;
        --text-light: #F2F1F7;
        --text-muted: #B3A8D7;
        --border-radius: 13px;
        --shadow: 0 10px 38px 0 rgba(124,77,255,0.16), 0 1.5px 8px rgba(255,112,67,0.09);
        --focus-glow: 0 0 12px var(--warm-accent), 0 0 32px var(--primary-color);
      }
      html, body {
        background: linear-gradient(135deg, var(--dark-bg) 0%, #221742 100%);
        color: var(--text-light);
        min-height: 100vh;
        font-family: 'Inter', 'Segoe UI', 'Arial', sans-serif;
      }
      .manage-products {
        min-height: 100vh;
        padding: 2.2rem 1rem 2rem 1rem;
        background:
          radial-gradient(ellipse at 40% 90%, #ffab4020 0%, transparent 70%),
          radial-gradient(ellipse at 75% 25%, #7c4dff18 0%, transparent 65%);
      }
      .music-header {
        text-align: center;
        margin-bottom: 2.6rem;
        position: relative;
      }
      .music-title {
        font-size: 2.8rem;
        font-weight: 800;
        margin-bottom: .5rem;
        background: linear-gradient(95deg, var(--primary-color) 60%, var(--secondary-color) 100%);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        filter: drop-shadow(0 0 2px #b59fff88);
      }
      .music-subtitle {
        font-size: 1.25rem;
        color: var(--text-muted);
        font-weight: 400;
        letter-spacing: 0.01em;
        margin-bottom: .1rem;
      }
      .music-bar {
        width: 70px; height: 6px;
        margin: 0 auto 0.8rem auto;
        border-radius: 4px;
        background: linear-gradient(90deg, var(--warm-accent) 0%, var(--secondary-color) 100%);
        box-shadow: 0 0 18px #ffab4035;
        animation: musicbar 2.2s infinite linear alternate;
      }
      @keyframes musicbar {
        0% { width: 62px; }
        30% { width: 78px; }
        100% { width: 54px; }
      }

      .table-container {
        background: var(--card-bg);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow);
        border: 1.5px solid #7c4dff2a;
        overflow-x: auto;
        margin-bottom: 2.2rem;
        transition: box-shadow 0.35s;
      }
      .products-table {
        width: 100%;
        border-collapse: collapse;
        min-width: 700px;
      }
      .products-table th, .products-table td {
        padding: 1.15rem 1.15rem;
        font-size: 1.05rem;
        transition: background 0.26s;
      }
      .products-table th {
        background: linear-gradient(93deg, var(--primary-color) 80%, var(--secondary-color) 100%);
        color: white;
        text-align: left;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        border: none;
        border-bottom: 2.5px solid var(--card-bg);
        font-size: 1.01rem;
        box-shadow: 0 2px 10px #0002;
      }
      .products-table td {
        color: var(--text-light);
        background: transparent;
        border-bottom: 1.3px solid #ffffff13;
        font-size: 1.07rem;
      }
      .products-table tr:last-child td {
        border-bottom: none;
      }
      .products-table tr:hover td {
        background: #7c4dff0e;
        transition: background 0.25s;
      }
      .availability-badge {
        display: inline-flex; align-items: center;
        gap: 0.46rem;
        padding: 0.35rem 0.88rem;
        border-radius: 18px;
        font-size: .95rem; font-weight: 600;
        background: #362566;
        border: 1.3px solid #7057ff47;
        transition: background 0.23s;
      }
      .available { color: var(--primary-color); background: #4caf5017; border-color: #4caf5079; }
      .unavailable { color: var(--secondary-color); background: #ff704327; border-color: #ff704371; }
      .price-cell { font-weight: 700; color: var(--warm-accent); font-size: 1.11rem; }
      .quantity-cell { font-weight: 600; color: var(--text-light); }
      .actions-cell {
        display: flex; gap: 0.65rem;
        flex-wrap: wrap;
      }
      .action-btn {
        padding: 0.44rem 1.15rem;
        border: none;
        border-radius: 7.5px;
        font-size: 1.01rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(.65,0,.31,1.1);
        box-shadow: 0 2px 8px #7c4dff22;
        outline: none;
        background: var(--primary-color);
        color: white;
        position: relative;
        overflow: hidden;
        z-index: 1;
      }
      .edit-btn { background: linear-gradient(94deg, var(--primary-color), #b19cff); }
      .edit-btn:hover { box-shadow: 0 3px 19px #7c4dff40; filter: brightness(1.08) saturate(1.15); }
      .edit-btn:focus { box-shadow: var(--focus-glow); }
      .delete-btn { background: linear-gradient(90deg, #ff5e4d, #ff7043); }
      .delete-btn:hover { box-shadow: 0 3px 19px #ff704341; filter: brightness(1.06) saturate(1.09); }
      .delete-btn:focus { box-shadow: var(--focus-glow); }
      .add-product-btn {
        display: flex; align-items: center; justify-content: center;
        gap: 0.77rem;
        padding: 1.15rem 2.3rem;
        border: none;
        border-radius: 18px;
        background: linear-gradient(96deg, var(--secondary-color), var(--warm-accent));
        color: white;
        font-size: 1.2rem;
        font-weight: 800;
        letter-spacing: 0.03em;
        cursor: pointer;
        margin: 2.3rem auto 0 auto;
        box-shadow: 0 8px 25px #ffab4033;
        transition: all 0.18s cubic-bezier(.82,0,.31,1.07);
        max-width: 330px;
        outline: none;
      }
      .add-product-btn:hover { box-shadow: 0 11px 34px #ff704359; transform: translateY(-2px) scale(1.045); }
      .add-product-btn:focus { box-shadow: var(--focus-glow); }
      .add-icon {
        font-size: 1.45rem;
        font-weight: bold;
        filter: drop-shadow(0 0 2px var(--warm-accent));
      }
      .floating-elements {
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        pointer-events: none; z-index: -1;
      }
      .floating-circle {
        position: absolute; border-radius: 50%; opacity: 0.13;
        animation: float 7s ease-in-out infinite;
        filter: blur(1.5px);
      }
      .floating-circle:nth-child(1) { width: 93px; height: 93px; background: var(--primary-color); top: 18%; left: 11%; animation-delay: 0s;}
      .floating-circle:nth-child(2) { width: 61px; height: 61px; background: var(--secondary-color); top: 69%; right: 7%; animation-delay: 2.2s;}
      .floating-circle:nth-child(3) { width: 122px; height: 122px; background: var(--warm-accent); bottom: 13%; left: 25%; animation-delay: 4.1s;}
      @keyframes float { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-21px) rotate(180deg); } }
      .loading-container {
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        padding: 4rem; text-align: center;
      }
      .loading-spinner {
        width: 54px; height: 54px;
        border: 3.4px solid transparent;
        border-top: 3.4px solid var(--primary-color);
        border-radius: 50%;
        animation: spin 1.1s linear infinite;
        margin-bottom: 1.2rem;
      }
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      .error-message {
        background: #ff704315;
        color: #ff7043;
        border: 1.3px solid #ff704363;
        padding: 1.6rem 1.1rem;
        border-radius: var(--border-radius);
        text-align: center;
        margin: 2rem 0;
      }
      /* Responsive */
      @media (max-width: 1200px) { .manage-products { padding: 1.2rem; } .music-title { font-size: 2.1rem; } }
      @media (max-width: 860px)  { .manage-products { padding: 0.65rem; } .music-title { font-size: 1.51rem; } .products-table th, .products-table td { padding: 0.7rem; font-size: 0.97rem; } }
      @media (max-width: 550px)  { .music-title { font-size: 1.08rem; } .products-table th, .products-table td { padding: 0.55rem; font-size: 0.92rem; } .add-product-btn { width: 100%; max-width: unset; padding: 1rem 0.5rem; } }
      `}
      </style>
      {/* Musikalisch-retro, subtil animierte Visuals */}
      <div className="floating-elements">
        <div className="floating-circle"></div>
        <div className="floating-circle"></div>
        <div className="floating-circle"></div>
      </div>
      <motion.div className="manage-products" variants={containerVariants} initial="hidden" animate="visible">
        <div className="music-header">
          <motion.div className="music-title" variants={itemVariants}>Produkte verwalten</motion.div>
          <div className="music-bar"></div>
          <motion.div className="music-subtitle" variants={itemVariants}>
            Musikalisch, hochwertig und mit Liebe zum Detail. <br /> Verwalte dein Musikequipment digital und intuitiv!
          </motion.div>
        </div>
        {isLoading ? (
          <motion.div className="loading-container" variants={itemVariants}>
            <div className="loading-spinner"></div>
            <p>Produkte werden geladen...</p>
          </motion.div>
        ) : error ? (
          <motion.div className="error-message" variants={itemVariants} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
            {error}
          </motion.div>
        ) : (
          <motion.div className="table-container" variants={itemVariants} whileHover={{ y: -4 }} transition={{ duration: 0.32 }}>
            <table className="products-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Preis/Tag</th>
                  <th>Verfügbar</th>
                  <th>Menge</th>
                  <th>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {products.map((prod, index) => (
                    <motion.tr key={prod.id} variants={tableRowVariants} initial="hidden" animate="visible" exit="hidden" transition={{ delay: index * 0.09 }} whileHover={{ scale: 1.01 }}>
                      <td><strong>{prod.name}</strong></td>
                      <td className="price-cell">{prod.price_per_day.toFixed(2)} €</td>
                      <td>
                        <span className={`availability-badge ${prod.is_available ? 'available' : 'unavailable'}`}>
                          {prod.is_available ? "✅ Verfügbar" : "❌ Nicht verfügbar"}
                        </span>
                      </td>
                      <td className="quantity-cell">{prod.quantity_available} Stück</td>
                      <td>
                        <div className="actions-cell">
                          <motion.button className="action-btn edit-btn" whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}>
                            Bearbeiten
                          </motion.button>
                          <motion.button className="action-btn delete-btn" whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}>
                            Löschen
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </motion.div>
        )}
        <motion.button className="add-product-btn" variants={itemVariants} whileHover={{ scale: 1.055 }} whileTap={{ scale: 0.95 }}>
          <span className="add-icon">+</span>
          Neues Produkt hinzufügen
        </motion.button>
      </motion.div>
    </>
  );
}
export default ManageProducts;
