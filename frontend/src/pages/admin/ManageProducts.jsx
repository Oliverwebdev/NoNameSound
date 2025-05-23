import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductModal from '../../components/modals/ProductModal';
import ConfirmDeleteModal from '../../components/modals/ConfirmDeleteModal';
import { API_URL } from '../../api';
import './ManageProducts.css';

function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [message, setMessage] = useState(null);
  const [warnDelete, setWarnDelete] = useState(null);

  useEffect(() => {
    if (message || error || warnDelete) {
      const timeout = setTimeout(() => {
        setMessage(null);
        setError(null);
        setWarnDelete(null);
      }, 6000);
      return () => clearTimeout(timeout);
    }
  }, [message, error, warnDelete]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/articles`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Fehler beim Laden der Produkte');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddNew = () => {
    setSelectedProduct(null);
    setModalOpen(true);
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const handleDeletePrompt = (product) => {
    setSelectedProduct(product);
    setWarnDelete(null);
    setDeleteModalOpen(true);
  };

  const handleSaveProduct = async (data) => {
    const token = localStorage.getItem('token');
    const method = data.id ? 'PUT' : 'POST';
    const url = data.id ? `/articles/${data.id}` : '/articles';

    data.price_per_day = parseFloat(data.price_per_day);
    data.quantity_available = parseInt(data.quantity_available, 10);

    console.log('🔍 Sending data to API:', data);

    try {
      const res = await fetch(`${API_URL}${url}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Fehler beim Speichern');
      }
      setModalOpen(false);
      setSelectedProduct(null);
      setMessage('✅ Produkt erfolgreich gespeichert.');
      fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteProduct = async () => {
    const token = localStorage.getItem('token');
    console.log('🗑️ Versuche zu löschen:', selectedProduct);
    try {
      const res = await fetch(`${API_URL}/articles/${selectedProduct.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const errorData = await res.json();
        if (res.status === 400 && errorData.message?.includes('aktiven Mietanfragen')) {
          setWarnDelete(errorData.message);
        }
        throw new Error(errorData.message || 'Fehler beim Löschen');
      }
      setDeleteModalOpen(false);
      setSelectedProduct(null);
      setMessage('🗑️ Produkt erfolgreich gelöscht.');
      fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <motion.div className="manage-products" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
      <div className="header-section">
        <h1>🎸 Produkte verwalten</h1>
        <button className="add-product-btn" onClick={handleAddNew}>+ Neues Produkt</button>
      </div>

      <AnimatePresence>
        {message && <motion.div className="message success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{message}</motion.div>}
        {error && <motion.div className="message error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{error}</motion.div>}
        {warnDelete && <motion.div className="message warning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>⚠️ {warnDelete}</motion.div>}
      </AnimatePresence>

      {isLoading ? (
        <div className="loading-spinner"></div>
      ) : (
        <div className="table-container">
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
              {products.map((prod) => (
                <tr key={prod.id}>
                  <td>{prod.name}</td>
                  <td>{prod.price_per_day.toFixed(2)} €</td>
                  <td>{prod.is_available ? '✅' : '❌'}</td>
                  <td>{prod.quantity_available}</td>
                  <td className="actions-cell">
                    <button className="edit-btn" onClick={() => handleEdit(prod)}>Bearbeiten</button>
                    <button className="delete-btn" onClick={() => handleDeletePrompt(prod)}>Löschen</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveProduct}
        initialData={selectedProduct}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteProduct}
        productName={selectedProduct?.name}
      />
    </motion.div>
  );
}

export default ManageProducts;