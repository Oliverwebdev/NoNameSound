import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ConfirmDeleteModal.css';

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, productName }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="modal-content danger" initial={{ scale: 0.9, y: -20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, y: 20 }}>
            <h2 className="modal-title">Löschen bestätigen</h2>
            <p className="modal-message">Möchtest du <strong>{productName}</strong> wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.</p>
            <div className="modal-actions">
              <button className="delete-btn" onClick={onConfirm}>Ja, löschen</button>
              <button className="cancel-btn" onClick={onClose}>Abbrechen</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDeleteModal;
