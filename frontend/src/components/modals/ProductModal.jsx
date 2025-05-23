// /components/modals/ProductModal.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ProductModal.css';

const ProductModal = ({ isOpen, onClose, onSave, initialData = {} }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_per_day: '',
    quantity_available: '',
    image_url: '',
    is_available: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...formData,
        ...initialData
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="modal-content" initial={{ scale: 0.8, y: -30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.7, y: 30 }}>
            <h2 className="modal-title">Produkt {initialData?.id ? 'bearbeiten' : 'hinzufügen'}</h2>
            <form onSubmit={handleSubmit} className="modal-form">
              <label>Name:
                <input type="text" name="name" value={formData.name} onChange={handleChange} required />
              </label>
              <label>Beschreibung:
                <textarea name="description" value={formData.description} onChange={handleChange} />
              </label>
              <label>Preis pro Tag (€):
                <input type="number" step="0.01" name="price_per_day" value={formData.price_per_day} onChange={handleChange} required />
              </label>
              <label>Verfügbare Menge:
                <input type="number" name="quantity_available" value={formData.quantity_available} onChange={handleChange} required />
              </label>
              <label>Bild-URL:
                <input type="text" name="image_url" value={formData.image_url} onChange={handleChange} />
              </label>
              <label className="checkbox-label">
                <input type="checkbox" name="is_available" checked={formData.is_available} onChange={handleChange} />
                Verfügbar
              </label>
              <div className="modal-actions">
                <button type="submit">Speichern</button>
                <button type="button" onClick={onClose} className="cancel-btn">Abbrechen</button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProductModal;
