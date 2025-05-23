import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductModal from '../../components/modals/ProductModal';
import ConfirmDeleteModal from '../../components/modals/ConfirmDeleteModal';
// import './ManageProducts.css';

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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

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

  const handleOpenCreate = () => {
    setProductToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setProductToEdit(product);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (product) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  const handleSaveProduct = async (data) => {
    console.log('✅ Produkt speichern:', data);
    setIsModalOpen(false);
  };

  const handleDeleteProduct = async () => {
    console.log('🗑️ Produkt löschen:', productToDelete.id);
    setIsDeleteModalOpen(false);
  };

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
                          <motion.button className="action-btn edit-btn" onClick={() => handleOpenEdit(prod)} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}>
                            Bearbeiten
                          </motion.button>
                          <motion.button className="action-btn delete-btn" onClick={() => handleOpenDelete(prod)} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}>
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
        <motion.button className="add-product-btn" onClick={handleOpenCreate} variants={itemVariants} whileHover={{ scale: 1.055 }} whileTap={{ scale: 0.95 }}>
          <span className="add-icon">+</span>
          Neues Produkt hinzufügen
        </motion.button>
      </motion.div>
      <ProductModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProduct}
        initialData={productToEdit}
      />
      <ConfirmDeleteModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteProduct}
        productName={productToDelete?.name}
      />
    </>
  );
}

export default ManageProducts;
