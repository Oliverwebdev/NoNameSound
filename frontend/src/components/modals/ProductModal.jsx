import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import  './ProductModal.css';

const defaultState = {
  name: '',
  description: '',
  price_per_day: '',
  quantity_available: '',
  image_url: '',
  is_available: true,
};

function ProductModal({ isOpen, onClose, onSave, initialData }) {
  const [form, setForm] = useState(defaultState);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          name: initialData.name || '',
          description: initialData.description || '',
          price_per_day: initialData.price_per_day || '',
          quantity_available: initialData.quantity_available || '',
          image_url: initialData.image_url || '',
          is_available: typeof initialData.is_available === 'boolean'
            ? initialData.is_available
            : true,
        });
      } else {
        setForm(defaultState);
      }
    }
  }, [isOpen, initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Preis und Menge als number konvertieren (wichtig für Validierung im Backend)
    onSave({
      ...form,
      price_per_day: Number(form.price_per_day),
      quantity_available: parseInt(form.quantity_available, 10),
      is_available: !!form.is_available,
      id: initialData?.id,
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          zIndex: 1000,
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10, 10, 30, 0.60)'
        }}
        onClick={onClose}
      >
        <motion.div
          className="modal-content"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 16 }}
          style={{
            background: 'var(--bg-card, #1a1a2e)',
            borderRadius: '18px',
            maxWidth: 500,
            margin: '5% auto',
            padding: '2.5rem 2rem',
            boxShadow: '0 12px 42px rgba(124,77,255,0.17)',
            position: 'relative'
          }}
          onClick={e => e.stopPropagation()}
        >
          <h2 style={{
            background: 'var(--gradient-primary, linear-gradient(135deg,#7c4dff,#ff7043))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '1.5rem',
            fontWeight: 700,
            fontSize: '2rem',
            textAlign: 'center'
          }}>
            {initialData ? 'Produkt bearbeiten' : 'Neues Produkt'}
          </h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.3rem' }}>
            <label>
              Name *
              <input
                type="text"
                name="name"
                required
                maxLength={120}
                value={form.name}
                onChange={handleChange}
                autoFocus
              />
            </label>
            <label>
              Beschreibung
              <textarea
                name="description"
                maxLength={500}
                value={form.description}
                onChange={handleChange}
              />
            </label>
            <label>
              Preis/Tag (€) *
              <input
                type="number"
                name="price_per_day"
                required
                min="0.01"
                step="0.01"
                value={form.price_per_day}
                onChange={handleChange}
              />
            </label>
            <label>
              Menge verfügbar *
              <input
                type="number"
                name="quantity_available"
                required
                min="0"
                step="1"
                value={form.quantity_available}
                onChange={handleChange}
              />
            </label>
            <label>
              Bild-URL
              <input
                type="url"
                name="image_url"
                maxLength={300}
                value={form.image_url}
                onChange={handleChange}
                placeholder="https://..."
              />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <input
                type="checkbox"
                name="is_available"
                checked={form.is_available}
                onChange={handleChange}
              />
              Verfügbar
            </label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.3rem' }}>
              <button type="button" onClick={onClose} style={{
                padding: '0.8rem 1.5rem',
                background: 'var(--error-color, #f44336)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 500
              }}>Abbrechen</button>
              <button type="submit" style={{
                padding: '0.8rem 1.5rem',
                background: 'var(--primary-color, #7c4dff)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600
              }}>
                {initialData ? 'Speichern' : 'Anlegen'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ProductModal;
